import {RGBA, type RenderContext, type SelectionState} from '../core/types.ts';
import {OptimizedBuffer} from './browser-buffer';
import {Renderable} from '../core/Renderable.ts';
import {
  GroupRenderable,
  FrameBufferRenderable,
  type FrameBufferOptions,
  type StyledTextOptions,
  StyledTextRenderable,
} from '../core/objects.ts';
import {parseKeypress} from './browser-keypress';
import {TerminalConsole, type ConsoleOptions} from './console-stub';
import {Selection} from '../core/selection.ts';

export interface BrowserRendererConfig {
  targetFps?: number;
  consoleOptions?: ConsoleOptions;
  enableMouseMovement?: boolean;
  useMouse?: boolean;
}

const CHAR_WIDTH = 10;
const CHAR_HEIGHT = 20;

export class BrowserRenderer extends Renderable {
  public lib: any; // Browser-compatible lib interface
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  private _isRunning: boolean = false;
  private targetFps: number = 30;
  private enableMouseMovement: boolean = false;
  private _useMouse: boolean = true;

  private rendering: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;
  private targetFrameTime: number = 0;
  private frameCallbacks: ((deltaTime: number) => Promise<void>)[] = [];

  private renderContext: RenderContext;
  public nextRenderBuffer: OptimizedBuffer;
  private _console: TerminalConsole;

  private capturedRenderable?: Renderable;
  private lastOverRenderableNum: number = 0;
  private lastOverRenderable?: Renderable;

  private currentSelection: Selection | null = null;
  private selectionState: SelectionState | null = null;
  private selectionContainers: Renderable[] = [];

  private animationFrameId: number | null = null;
  private renderStats = {
    frameCount: 0,
    fps: 0,
    renderTime: 0,
    frameCallbackTime: 0,
  };

  constructor(
    container: HTMLDivElement,
    width: number,
    height: number,
    config: BrowserRendererConfig = {},
  ) {
    super('__browser_renderer__', {x: 0, y: 0, zIndex: 0, visible: true, width, height});

    this.container = container;
    this.width = width;
    this.height = height;
    this.targetFps = config.targetFps || 30;
    this.enableMouseMovement = config.enableMouseMovement ?? true;
    this._useMouse = config.useMouse ?? true;

    // Create browser-compatible lib interface
    this.lib = {
      createOptimizedBuffer: (width: number, height: number, respectAlpha?: boolean) => {
        return new OptimizedBuffer(width, height, respectAlpha || false);
      },
      destroyOptimizedBuffer: (buffer: any) => {
        // No-op for browser
      },
      // Add other methods as needed
    };

    this.canvas = document.createElement('canvas');
    this.canvas.width = width * CHAR_WIDTH;
    this.canvas.height = height * CHAR_HEIGHT;
    this.canvas.style.backgroundColor = '#000';
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.fontFamily = 'monospace';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d', {alpha: false})!;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = `${CHAR_HEIGHT - 4}px monospace`;
    this.ctx.textBaseline = 'top';
    (this.ctx as any).addToHitGrid = () => {};

    this.nextRenderBuffer = new OptimizedBuffer(width, height, false);

    this.renderContext = {
      addToHitGrid: (x, y, width, height, id) => {
        // Browser doesn't use hit grid for now
      },
      width: () => this.width,
      height: () => this.height,
    };

    this._console = new TerminalConsole(this as any, config.consoleOptions);

    this.setupInput();
    this.setupMouse();
  }

  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      const key = parseKeypress(e);
      this.emit('key', key);

      if (key.raw === '`') {
        this.console.toggle();
        e.preventDefault();
      }
    });
  }

  private setupMouse(): void {
    if (!this._useMouse) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CHAR_WIDTH);
      const y = Math.floor((e.clientY - rect.top) / CHAR_HEIGHT);

      if (this.lastOverRenderable) {
        const event = {
          x,
          y,
          type: 'move' as const,
          button: 0,
          modifiers: {shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey},
        };
        this.lastOverRenderable.processMouseEvent(event as any);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CHAR_WIDTH);
      const y = Math.floor((e.clientY - rect.top) / CHAR_HEIGHT);

      // Handle selection start
      const maybeRenderable = this.findRenderableAt(x, y);
      if (maybeRenderable?.selectable && maybeRenderable.shouldStartSelection(x, y)) {
        this.startSelection(maybeRenderable, x, y);
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      if (this.selectionState?.isSelecting) {
        this.finishSelection();
      }
    });
  }

  private findRenderableAt(x: number, y: number): Renderable | undefined {
    // Simple implementation - iterate through renderables
    for (const [, renderable] of Renderable.renderablesByNumber) {
      if (
        renderable.visible &&
        x >= renderable.x &&
        x < renderable.x + renderable.width &&
        y >= renderable.y &&
        y < renderable.y + renderable.height
      ) {
        return renderable;
      }
    }
    return undefined;
  }

  public add(obj: Renderable): void {
    obj.propagateContext(this.renderContext);
    super.add(obj);
  }

  public get console(): TerminalConsole {
    return this._console;
  }

  public get terminalWidth(): number {
    return this.width;
  }

  public get terminalHeight(): number {
    return this.height;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get useMouse(): boolean {
    return this._useMouse;
  }

  public setBackgroundColor(color: string): void {
    this.canvas.style.backgroundColor = color;
  }

  public createFrameBuffer(id: string, options: Partial<FrameBufferOptions>) {
    if (this.getRenderable(id)) {
      this.remove(id);
    }
    const width = options.width ?? this.width;
    const height = options.height ?? this.height;
    const buffer = new OptimizedBuffer(width, height, options.respectAlpha);
    const fbObj = new FrameBufferRenderable(id, buffer, {
      ...options,
      x: options.x ?? 0,
      y: options.y ?? 0,
      width,
      height,
      zIndex: options.zIndex ?? 1,
    });
    this.add(fbObj);
    return fbObj;
  }

  public createStyledText(id: string, options: StyledTextOptions): StyledTextRenderable {
    if (!options.fragment) {
      throw new Error('StyledText requires a fragment');
    }

    const width = options.width ?? this.width;
    const height = options.height ?? this.height;
    const buffer = new OptimizedBuffer(width, height, true);
    const stObj = new StyledTextRenderable(id, buffer, {
      ...options,
      x: options.x ?? 0,
      y: options.y ?? 0,
      width,
      height,
      zIndex: options.zIndex ?? 1,
    });

    return stObj;
  }

  public setFrameCallback(callback: (deltaTime: number) => Promise<void>): void {
    this.frameCallbacks.push(callback);
  }

  public removeFrameCallback(callback: (deltaTime: number) => Promise<void>): void {
    this.frameCallbacks = this.frameCallbacks.filter((cb) => cb !== callback);
  }

  public start(): void {
    if (!this._isRunning) {
      this._isRunning = true;
      this.startRenderLoop();
    }
  }

  public pause(): void {
    this._isRunning = false;
  }

  public stop(): void {
    this._isRunning = false;
    this._console.deactivate();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public async renderOnce(): Promise<void> {
    await this.loop();
  }

  private startRenderLoop(): void {
    if (!this._isRunning) return;

    this.lastTime = Date.now();
    this.frameCount = 0;
    this.lastFpsTime = this.lastTime;
    this.currentFps = 0;
    this.targetFrameTime = 1000 / this.targetFps;

    this.loop();
  }

  private async loop(): Promise<void> {
    if (this.rendering) return;
    this.rendering = true;

    const now = Date.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.renderStats.frameCount++;
    this.renderStats.fps = this.currentFps;

    // Execute frame callbacks
    for (const frameCallback of this.frameCallbacks) {
      try {
        await frameCallback(deltaTime);
      } catch (error) {
        console.error('Error in frame callback:', error);
      }
    }

    // Clear buffer with black background first
    this.nextRenderBuffer.clear(RGBA.fromValues(0, 0, 0, 1));

    // Render the renderable tree
    this.render(this.nextRenderBuffer, deltaTime);
    this._console.renderToBuffer(this.nextRenderBuffer);

    // Draw to canvas
    this.drawBufferToCanvas();

    this.rendering = false;

    if (this._isRunning) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  private drawBufferToCanvas(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.nextRenderBuffer.getCell(x, y);
        if (!cell) continue;

        const px = x * CHAR_WIDTH;
        const py = y * CHAR_HEIGHT;

        // Draw background - colors are already normalized (0-1)
        if (cell.bg) {
          this.ctx.fillStyle = `rgba(${Math.round(cell.bg.r * 255)}, ${Math.round(cell.bg.g * 255)}, ${Math.round(cell.bg.b * 255)}, ${cell.bg.a})`;
          this.ctx.fillRect(px, py, CHAR_WIDTH, CHAR_HEIGHT);
        }

        // Draw character - only if not a space
        if (cell.char && cell.char !== ' ' && cell.fg) {
          this.ctx.fillStyle = `rgba(${Math.round(cell.fg.r * 255)}, ${Math.round(cell.fg.g * 255)}, ${Math.round(cell.fg.b * 255)}, ${cell.fg.a})`;
          this.ctx.fillText(cell.char, px + 1, py + 2);
        }
      }
    }
  }

  public clearTerminal(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public toggleDebugOverlay(): void {
    // No-op for browser
  }

  public configureDebugOverlay(options: any): void {
    // No-op for browser
  }

  public setCursorPosition(x: number, y: number, visible: boolean = true): void {
    // No-op for browser
  }

  public setCursorStyle(style: any, blinking: boolean = false, color?: RGBA): void {
    // No-op for browser
  }

  public setCursorColor(color: RGBA): void {
    // No-op for browser
  }

  // Selection methods
  private startSelection(startRenderable: Renderable, x: number, y: number): void {
    this.clearSelection();
    this.selectionContainers.push(startRenderable.parent || this);

    this.selectionState = {
      anchor: {x, y},
      focus: {x, y},
      isActive: true,
      isSelecting: true,
    };

    this.currentSelection = new Selection({x, y}, {x, y});
    this.notifySelectablesOfSelectionChange();
  }

  private finishSelection(): void {
    if (this.selectionState) {
      this.selectionState.isSelecting = false;
      this.emit('selection', this.currentSelection);
    }
  }

  public clearSelection(): void {
    if (this.selectionState) {
      this.selectionState = null;
      this.notifySelectablesOfSelectionChange();
    }
    this.currentSelection = null;
    this.selectionContainers = [];
  }

  private notifySelectablesOfSelectionChange(): void {
    let normalizedSelection: SelectionState | null = null;
    if (this.selectionState) {
      normalizedSelection = {...this.selectionState};

      if (
        normalizedSelection.anchor.y > normalizedSelection.focus.y ||
        (normalizedSelection.anchor.y === normalizedSelection.focus.y &&
          normalizedSelection.anchor.x > normalizedSelection.focus.x)
      ) {
        const temp = normalizedSelection.anchor;
        normalizedSelection.anchor = normalizedSelection.focus;
        normalizedSelection.focus = {
          x: temp.x + 1,
          y: temp.y,
        };
      }
    }

    const selectedRenderables: Renderable[] = [];

    for (const [, renderable] of Renderable.renderablesByNumber) {
      if (renderable.visible && renderable.selectable) {
        const currentContainer =
          this.selectionContainers.length > 0
            ? this.selectionContainers[this.selectionContainers.length - 1]
            : null;
        let hasSelection = false;
        if (!currentContainer || this.isWithinContainer(renderable, currentContainer)) {
          hasSelection = renderable.onSelectionChanged(normalizedSelection);
        } else {
          hasSelection = renderable.onSelectionChanged(
            normalizedSelection ? {...normalizedSelection, isActive: false} : null,
          );
        }

        if (hasSelection) {
          selectedRenderables.push(renderable);
        }
      }
    }

    if (this.currentSelection) {
      this.currentSelection.updateSelectedRenderables(selectedRenderables);
    }
  }

  private isWithinContainer(renderable: Renderable, container: Renderable): boolean {
    let current: Renderable | null = renderable;
    while (current) {
      if (current === container) return true;
      current = current.parent;
    }
    return false;
  }

  public getSelection(): Selection | null {
    return this.currentSelection;
  }

  public hasSelection(): boolean {
    return this.currentSelection !== null;
  }

  public getSelectionContainer(): Renderable | null {
    return this.selectionContainers.length > 0
      ? this.selectionContainers[this.selectionContainers.length - 1]
      : null;
  }

  public get needsUpdate(): boolean {
    return false;
  }

  public set needsUpdate(value: boolean) {
    if (value && !this._isRunning) {
      this.renderOnce();
    }
  }

  public on(event: string, callback: any): void {
    // Simple event emitter
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private listeners: Record<string, any[]> = {};

  public emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      callback(...args);
    }
  }

  public intermediateRender(): void {
    if (!this._isRunning) return;
    this.loop();
  }
}
