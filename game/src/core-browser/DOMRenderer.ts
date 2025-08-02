import { RGBA, type RenderContext, type SelectionState } from "../core/types.ts";
import { OptimizedBuffer } from "./browser-buffer";
import { Renderable } from "../core/Renderable.ts";
import {
  GroupRenderable,
  FrameBufferRenderable,
  type FrameBufferOptions,
  type StyledTextOptions,
  StyledTextRenderable,
} from "../core/objects.ts";
import { parseKeypress } from "./browser-keypress";
import { TerminalConsole, type ConsoleOptions } from "./console-stub";
import { Selection } from "../core/selection.ts";

export interface DOMRendererConfig {
  targetFps?: number;
  consoleOptions?: ConsoleOptions;
  enableMouseMovement?: boolean;
  useMouse?: boolean;
}

// Track dirty cells for efficient updates
interface DirtyCell {
  x: number;
  y: number;
  char: string;
  fg: RGBA;
  bg: RGBA;
  attributes: number;
}

export class DOMRenderer extends Renderable {
  public lib: any; // Browser-compatible lib interface
  private container: HTMLDivElement;
  private terminalDiv: HTMLDivElement;
  private cells: HTMLSpanElement[][] = [];
  private cellCache: Map<string, DirtyCell> = new Map();
  
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
  private previousBuffer: OptimizedBuffer;
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

  constructor(container: HTMLDivElement, width: number, height: number, config: DOMRendererConfig = {}) {
    super("__dom_renderer__", { x: 0, y: 0, zIndex: 0, visible: true, width, height });

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
    };

    // Create terminal div with proper styling
    this.terminalDiv = document.createElement("div");
    this.terminalDiv.className = "terminal";
    this.terminalDiv.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.2;
      background: #000;
      color: #fff;
      white-space: pre;
      overflow: hidden;
      cursor: default;
      user-select: none;
      position: relative;
    `;
    this.container.appendChild(this.terminalDiv);

    // Create grid of span elements for efficient updates
    this.createGrid();

    this.nextRenderBuffer = new OptimizedBuffer(width, height, false);
    this.previousBuffer = new OptimizedBuffer(width, height, false);

    this.renderContext = {
      addToHitGrid: (x, y, width, height, id) => {
        // Store hit regions for mouse interaction
        // For now, we'll handle this simply
      },
      width: () => this.width,
      height: () => this.height,
    };

    this._console = new TerminalConsole(this as any, config.consoleOptions);

    this.setupInput();
    this.setupMouse();
  }

  private createGrid(): void {
    // Create a grid of spans for each cell
    for (let y = 0; y < this.height; y++) {
      const row: HTMLSpanElement[] = [];
      const rowDiv = document.createElement("div");
      rowDiv.style.cssText = `
        height: 1.2em;
        white-space: pre;
        margin: 0;
        padding: 0;
        display: flex;
      `;

      for (let x = 0; x < this.width; x++) {
        const cell = document.createElement("span");
        cell.style.cssText = `
          display: inline-block;
          width: 1ch;
          height: 1.2em;
          overflow: hidden;
        `;
        cell.textContent = " ";
        rowDiv.appendChild(cell);
        row.push(cell);
      }

      this.terminalDiv.appendChild(rowDiv);
      this.cells.push(row);
    }
  }

  private setupInput(): void {
    document.addEventListener("keydown", (e) => {
      const key = parseKeypress(e);
      this.emit("key", key);

      if (key.raw === "`") {
        this.console.toggle();
        e.preventDefault();
      }
    });
  }

  private setupMouse(): void {
    if (!this._useMouse) return;

    const getCellCoords = (e: MouseEvent): { x: number; y: number } => {
      const rect = this.terminalDiv.getBoundingClientRect();
      const charWidth = rect.width / this.width;
      const charHeight = rect.height / this.height;
      const x = Math.floor((e.clientX - rect.left) / charWidth);
      const y = Math.floor((e.clientY - rect.top) / charHeight);
      return { x: Math.max(0, Math.min(this.width - 1, x)), y: Math.max(0, Math.min(this.height - 1, y)) };
    };

    this.terminalDiv.addEventListener("mousemove", (e) => {
      const { x, y } = getCellCoords(e);

      if (this.lastOverRenderable) {
        const event = {
          x,
          y,
          type: "move" as const,
          button: 0,
          modifiers: { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey },
        };
        this.lastOverRenderable.processMouseEvent(event as any);
      }
    });

    this.terminalDiv.addEventListener("mousedown", (e) => {
      const { x, y } = getCellCoords(e);

      // Handle selection start
      const maybeRenderable = this.findRenderableAt(x, y);
      if (maybeRenderable?.selectable && maybeRenderable.shouldStartSelection(x, y)) {
        this.startSelection(maybeRenderable, x, y);
      }
    });

    this.terminalDiv.addEventListener("mouseup", () => {
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
    this.terminalDiv.style.backgroundColor = color;
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
      throw new Error("StyledText requires a fragment");
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
        console.error("Error in frame callback:", error);
      }
    }

    // Clear buffer with black background first
    this.nextRenderBuffer.clear(RGBA.fromValues(0, 0, 0, 1));

    // Render the renderable tree
    this.render(this.nextRenderBuffer, deltaTime);
    this._console.renderToBuffer(this.nextRenderBuffer);

    // Update DOM efficiently
    this.updateDOM();

    this.rendering = false;

    if (this._isRunning) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  private updateDOM(): void {
    const updates: Array<() => void> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.nextRenderBuffer.getCell(x, y);
        const prevCell = this.previousBuffer.getCell(x, y);

        // Only update if cell has changed
        if (!cell || (prevCell && this.cellsEqual(cell, prevCell))) {
          continue;
        }

        const domCell = this.cells[y][x];
        const char = cell.char || " ";
        const fg = cell.fg;
        const bg = cell.bg;

        updates.push(() => {
          // Update text content
          domCell.textContent = char === "" ? " " : char;

          // Update colors - RGBA values are already normalized (0-1)
          const fgColor = `rgba(${Math.round(fg.r * 255)}, ${Math.round(fg.g * 255)}, ${Math.round(fg.b * 255)}, ${fg.a})`;
          const bgColor = `rgba(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)}, ${bg.a})`;

          domCell.style.color = fgColor;
          domCell.style.backgroundColor = bgColor;

          // Handle text attributes
          if (cell.attributes) {
            const attrs = cell.attributes;
            let textDecoration = "";
            let fontWeight = "normal";
            let fontStyle = "normal";

            if (attrs & 1) fontWeight = "bold"; // Bold
            if (attrs & 2) fontStyle = "italic"; // Italic
            if (attrs & 4) textDecoration = "underline"; // Underline
            if (attrs & 8) textDecoration = textDecoration ? textDecoration + " line-through" : "line-through"; // Strikethrough

            domCell.style.fontWeight = fontWeight;
            domCell.style.fontStyle = fontStyle;
            domCell.style.textDecoration = textDecoration;
          } else {
            domCell.style.fontWeight = "normal";
            domCell.style.fontStyle = "normal";
            domCell.style.textDecoration = "none";
          }
        });

        // Store in previous buffer for next frame comparison
        this.previousBuffer.setCell(x, y, char, fg, bg, cell.attributes);
      }
    }

    // Batch DOM updates
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
      });
    }
  }

  private cellsEqual(a: any, b: any): boolean {
    return (
      a.char === b.char &&
      a.fg.r === b.fg.r &&
      a.fg.g === b.fg.g &&
      a.fg.b === b.fg.b &&
      a.fg.a === b.fg.a &&
      a.bg.r === b.bg.r &&
      a.bg.g === b.bg.g &&
      a.bg.b === b.bg.b &&
      a.bg.a === b.bg.a &&
      a.attributes === b.attributes
    );
  }

  public clearTerminal(): void {
    this.cells.forEach(row => {
      row.forEach(cell => {
        cell.textContent = " ";
        cell.style.color = "#fff";
        cell.style.backgroundColor = "#000";
      });
    });
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
      anchor: { x, y },
      focus: { x, y },
      isActive: true,
      isSelecting: true,
    };

    this.currentSelection = new Selection({ x, y }, { x, y });
    this.notifySelectablesOfSelectionChange();
  }

  private finishSelection(): void {
    if (this.selectionState) {
      this.selectionState.isSelecting = false;
      this.emit("selection", this.currentSelection);
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
      normalizedSelection = { ...this.selectionState };

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
          this.selectionContainers.length > 0 ? this.selectionContainers[this.selectionContainers.length - 1] : null;
        let hasSelection = false;
        if (!currentContainer || this.isWithinContainer(renderable, currentContainer)) {
          hasSelection = renderable.onSelectionChanged(normalizedSelection);
        } else {
          hasSelection = renderable.onSelectionChanged(
            normalizedSelection ? { ...normalizedSelection, isActive: false } : null,
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
    return this.selectionContainers.length > 0 ? this.selectionContainers[this.selectionContainers.length - 1] : null;
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
