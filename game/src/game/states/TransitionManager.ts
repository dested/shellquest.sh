import {
  CliRenderer,
  GroupRenderable,
  FrameBufferRenderable,
  OptimizedBuffer,
  RGBA,
} from '../../core';

export type TransitionType =
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'fade'
  | 'pixelate'
  | 'spiral'
  | 'none';

interface TransitionOptions {
  duration?: number; // milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class TransitionManager {
  private renderer: CliRenderer;
  private transitionBuffer: FrameBufferRenderable | null = null;
  private sourceBuffer: FrameBufferRenderable | null = null;
  private targetBuffer: FrameBufferRenderable | null = null;
  private isTransitioning: boolean = false;
  private transitionStart: number = 0;
  private transitionDuration: number = 500;
  private transitionType: TransitionType = 'none';
  private easing: string = 'ease-in-out';
  private animationFrame: number = 0;
  private onComplete: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
  }

  /**
   * Start a transition between two states
   */
  public async transition(
    fromContainer: GroupRenderable,
    toContainer: GroupRenderable,
    type: TransitionType = 'swipe-left',
    options: TransitionOptions = {},
    onComplete?: () => void,
  ): Promise<void> {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.transitionType = type;
    this.transitionDuration = options.duration ?? 500;
    this.easing = options.easing ?? 'ease-in-out';
    this.onComplete = onComplete || null;

    // Capture current screen
    this.captureScreen(fromContainer, true);

    // Hide from container and show to container
    fromContainer.visible = false;
    toContainer.visible = true;

    // Capture target screen
    this.captureScreen(toContainer, false);

    // Hide to container during transition
    toContainer.visible = false;

    // Create transition buffer
    this.createTransitionBuffer();

    // Start transition animation
    this.transitionStart = Date.now();
    this.animate();
  }

  /**
   * Capture screen content to buffer
   */
  private captureScreen(container: GroupRenderable, isSource: boolean): void {
    const width = this.renderer.terminalWidth;
    const height = this.renderer.terminalHeight;

    // Create a frame buffer to capture the container
    const bufferId = isSource ? 'source-capture' : 'target-capture';
    const frameBuffer = this.renderer.createFrameBuffer(bufferId, {
      x: 0,
      y: 0,
      width,
      height,
      zIndex: -1000,
    });

    // Clear the buffer
    frameBuffer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0));

    // Force render the container to our buffer
    container.visible = true;
    container.render(frameBuffer.frameBuffer, 0);

    if (isSource) {
      this.sourceBuffer = frameBuffer;
    } else {
      this.targetBuffer = frameBuffer;
    }
  }

  /**
   * Create the transition buffer
   */
  private createTransitionBuffer(): void {
    if (this.transitionBuffer) {
      this.renderer.remove(this.transitionBuffer.id);
    }

    this.transitionBuffer = this.renderer.createFrameBuffer('transition-buffer', {
      x: 0,
      y: 0,
      width: this.renderer.terminalWidth,
      height: this.renderer.terminalHeight,
      zIndex: 9999,
    });
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isTransitioning || !this.transitionBuffer) return;

    const now = Date.now();
    const elapsed = now - this.transitionStart;
    const rawProgress = Math.min(elapsed / this.transitionDuration, 1);
    const progress = this.applyEasing(rawProgress);

    // Clear transition buffer
    this.transitionBuffer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0));

    // Apply transition effect
    switch (this.transitionType) {
      case 'swipe-left':
        this.applySwipe(progress, -1, 0);
        break;
      case 'swipe-right':
        this.applySwipe(progress, 1, 0);
        break;
      case 'swipe-up':
        this.applySwipe(progress, 0, -1);
        break;
      case 'swipe-down':
        this.applySwipe(progress, 0, 1);
        break;
      case 'fade':
        this.applyFade(progress);
        break;
      case 'pixelate':
        this.applyPixelate(progress);
        break;
      case 'spiral':
        this.applySpiral(progress);
        break;
      default:
        this.applyFade(progress);
    }

    this.transitionBuffer.needsUpdate = true;

    if (rawProgress >= 1) {
      this.completeTransition();
    } else {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number): number {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }

  /**
   * Swipe transition effect
   */
  private applySwipe(progress: number, dirX: number, dirY: number): void {
    if (!this.sourceBuffer || !this.targetBuffer || !this.transitionBuffer) return;

    const width = this.renderer.terminalWidth;
    const height = this.renderer.terminalHeight;

    const offsetX = Math.floor(width * progress * dirX);
    const offsetY = Math.floor(height * progress * dirY);

    // Draw source screen sliding out
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destX = x + offsetX;
        const destY = y + offsetY;

        if (destX >= 0 && destX < width && destY >= 0 && destY < height) {
          const cell = this.sourceBuffer.frameBuffer.get(x, y);
          if (cell) {
            this.transitionBuffer.frameBuffer.setCell(destX, destY, cell.char, cell.fg, cell.bg);
          }
        }
      }
    }

    // Draw target screen sliding in
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = x - (width * dirX - offsetX);
        const srcY = y - (height * dirY - offsetY);

        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const cell = this.targetBuffer.frameBuffer.get(x, y);
          if (cell) {
            this.transitionBuffer.frameBuffer.setCell(srcX, srcY, cell.char, cell.fg, cell.bg);
          }
        }
      }
    }
  }

  /**
   * Fade transition
   */
  private applyFade(progress: number): void {
    if (!this.sourceBuffer || !this.targetBuffer || !this.transitionBuffer) return;

    const width = this.renderer.terminalWidth;
    const height = this.renderer.terminalHeight;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceCell = this.sourceBuffer.frameBuffer.get(x, y);
        const target = this.targetBuffer.frameBuffer.get(x, y);

        if (sourceCell && target) {
          // Interpolate colors
          const fg = this.interpolateColor(sourceCell.fg, target.fg, progress);
          const bg = this.interpolateColor(sourceCell.bg, target.bg, progress);

          // Use target char when more than halfway
          const char = progress > 0.5 ? target.char : sourceCell.char;

          this.transitionBuffer.frameBuffer.setCell(x, y, char, fg, bg);
        }
      }
    }
  }

  /**
   * Pixelate effect
   */
  private applyPixelate(progress: number): void {
    if (!this.sourceBuffer || !this.targetBuffer || !this.transitionBuffer) return;

    const width = this.renderer.terminalWidth;
    const height = this.renderer.terminalHeight;

    // Pixelation increases then decreases
    const pixelSize =
      progress < 0.5 ? Math.floor(1 + progress * 16) : Math.floor(1 + (1 - progress) * 16);
    const black = RGBA.fromValues(0, 0, 0, 1);
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Sample from center of pixel block
        const sampleX = Math.min(x + Math.floor(pixelSize / 2), width - 1);
        const sampleY = Math.min(y + Math.floor(pixelSize / 2), height - 1);

        const buffer = progress < 0.5 ? this.sourceBuffer : this.targetBuffer;
        const cell = buffer.frameBuffer.get(sampleX, sampleY);

        if (cell) {
          let fg = cell.fg;
          if (fg.r + fg.g + fg.b + fg.a === 4) {
            // idk why its white when it should be like null
            fg = black;
          }
          // Fill the pixel block
          for (let py = y; py < Math.min(y + pixelSize, height); py++) {
            for (let px = x; px < Math.min(x + pixelSize, width); px++) {
              this.transitionBuffer.frameBuffer.setCell(px, py, '█', fg, cell.bg);
            }
          }
        } else {
          for (let py = y; py < Math.min(y + pixelSize, height); py++) {
            for (let px = x; px < Math.min(x + pixelSize, width); px++) {
              this.transitionBuffer.frameBuffer.setCell(px, py, '█', black, black);
            }
          }
        }
      }
    }
  }

  /**
   * Spiral effect
   */
  private applySpiral(progress: number): void {
    if (!this.sourceBuffer || !this.targetBuffer || !this.transitionBuffer) return;

    const width = this.renderer.terminalWidth;
    const height = this.renderer.terminalHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const spiralProgress = progress * maxRadius * 1.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Create spiral pattern
        const spiralOffset = (angle / (Math.PI * 2)) * 20;
        const effectiveDistance = distance - spiralOffset;

        if (effectiveDistance < spiralProgress) {
          // Show target
          const cell = this.targetBuffer.frameBuffer.get(x, y);
          if (cell) {
            this.transitionBuffer.frameBuffer.setCell(x, y, cell.char, cell.fg, cell.bg);
          }
        } else {
          // Show source
          const cell = this.sourceBuffer.frameBuffer.get(x, y);
          if (cell) {
            this.transitionBuffer.frameBuffer.setCell(x, y, cell.char, cell.fg, cell.bg);
          }
        }
      }
    }
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: RGBA, color2: RGBA, t: number): RGBA {
    return RGBA.fromValues(
      color1.buffer[0] + (color2.buffer[0] - color1.buffer[0]) * t,
      color1.buffer[1] + (color2.buffer[1] - color1.buffer[1]) * t,
      color1.buffer[2] + (color2.buffer[2] - color1.buffer[2]) * t,
      color1.buffer[3] + (color2.buffer[3] - color1.buffer[3]) * t,
    );
  }

  /**
   * Pseudo-random number generator
   */
  private pseudoRandom(x: number, y: number, seed: number): number {
    const hash = Math.sin((x * 12.9898 + y * 78.233 + seed * 94.673) * 43758.5453);
    return hash - Math.floor(hash);
  }

  /**
   * Complete the transition
   */
  private completeTransition(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Call completion callback BEFORE cleanup to ensure state visibility is set
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }

    // Clean up after callback
    if (this.transitionBuffer) {
      this.renderer.remove(this.transitionBuffer.id);
      this.transitionBuffer = null;
    }

    if (this.sourceBuffer) {
      this.renderer.remove(this.sourceBuffer.id);
      this.sourceBuffer = null;
    }

    if (this.targetBuffer) {
      this.renderer.remove(this.targetBuffer.id);
      this.targetBuffer = null;
    }

    this.isTransitioning = false;
  }

  /**
   * Check if currently transitioning
   */
  public get transitioning(): boolean {
    return this.isTransitioning;
  }
}
