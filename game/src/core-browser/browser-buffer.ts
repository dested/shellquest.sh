import {RGBA} from '../core/types.ts';

export class OptimizedBuffer {
  private width: number;
  private height: number;
  private buffer: {
    char: Uint32Array;
    fg: Float32Array;
    bg: Float32Array;
    attributes: Uint8Array;
  };
  public respectAlpha: boolean = false;

  constructor(width: number, height: number, respectAlpha: boolean = false) {
    this.width = width;
    this.height = height;
    this.respectAlpha = respectAlpha;

    const size = width * height;
    this.buffer = {
      char: new Uint32Array(size),
      fg: new Float32Array(size * 4),
      bg: new Float32Array(size * 4),
      attributes: new Uint8Array(size),
    };

    // Initialize with spaces and default colors
    this.clear();
  }

  private coordsToIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public clear(bg: RGBA = RGBA.fromValues(0, 0, 0, 1)): void {
    this.buffer.char.fill(' '.charCodeAt(0));
    this.buffer.attributes.fill(0);

    for (let i = 0; i < this.width * this.height; i++) {
      const index = i * 4;

      this.buffer.fg[index] = 1.0;
      this.buffer.fg[index + 1] = 1.0;
      this.buffer.fg[index + 2] = 1.0;
      this.buffer.fg[index + 3] = 1.0;

      this.buffer.bg[index] = bg.r;
      this.buffer.bg[index + 1] = bg.g;
      this.buffer.bg[index + 2] = bg.b;
      this.buffer.bg[index + 3] = bg.a;
    }
  }

  public setCell(
    x: number,
    y: number,
    char: string,
    fg: RGBA,
    bg: RGBA,
    attributes: number = 0,
  ): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    const index = this.coordsToIndex(x, y);
    const colorIndex = index * 4;

    // Set character and attributes
    this.buffer.char[index] = char.charCodeAt(0);
    this.buffer.attributes[index] = attributes;

    // Set foreground color
    this.buffer.fg[colorIndex] = fg.r;
    this.buffer.fg[colorIndex + 1] = fg.g;
    this.buffer.fg[colorIndex + 2] = fg.b;
    this.buffer.fg[colorIndex + 3] = fg.a;

    // Set background color
    this.buffer.bg[colorIndex] = bg.r;
    this.buffer.bg[colorIndex + 1] = bg.g;
    this.buffer.bg[colorIndex + 2] = bg.b;
    this.buffer.bg[colorIndex + 3] = bg.a;
  }

  public getCell(
    x: number,
    y: number,
  ): {char: string; fg: RGBA; bg: RGBA; attributes: number} | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

    const index = this.coordsToIndex(x, y);
    const colorIndex = index * 4;

    return {
      char: String.fromCharCode(this.buffer.char[index]),
      fg: RGBA.fromArray(this.buffer.fg.slice(colorIndex, colorIndex + 4)),
      bg: RGBA.fromArray(this.buffer.bg.slice(colorIndex, colorIndex + 4)),
      attributes: this.buffer.attributes[index],
    };
  }

  public get(x: number, y: number): {char: number; fg: RGBA; bg: RGBA; attributes: number} | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

    const index = this.coordsToIndex(x, y);
    const colorIndex = index * 4;

    return {
      char: this.buffer.char[index],
      fg: RGBA.fromArray(this.buffer.fg.slice(colorIndex, colorIndex + 4)),
      bg: RGBA.fromArray(this.buffer.bg.slice(colorIndex, colorIndex + 4)),
      attributes: this.buffer.attributes[index],
    };
  }

  public setCellWithAlphaBlending(
    x: number,
    y: number,
    char: string,
    fg: RGBA,
    bg: RGBA,
    attributes: number = 0,
  ): void {
    // Simplified alpha blending for browser
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    const destCell = this.get(x, y);
    if (destCell && bg.a < 1.0) {
      // Blend background colors
      const alpha = bg.a;
      const blendedBg = RGBA.fromValues(
        bg.r * alpha + destCell.bg.r * (1 - alpha),
        bg.g * alpha + destCell.bg.g * (1 - alpha),
        bg.b * alpha + destCell.bg.b * (1 - alpha),
        1,
      );
      this.setCell(x, y, char, fg, blendedBg, attributes);
    } else {
      this.setCell(x, y, char, fg, bg, attributes);
    }
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    fg: RGBA,
    bg?: RGBA,
    attributes: number = 0,
  ): void {
    if (y < 0 || y >= this.height) return;

    let i = 0;
    for (const char of text) {
      const charX = x + i;
      i++;

      if (charX < 0 || charX >= this.width) continue;

      let bgColor = bg;
      if (!bgColor) {
        const existingCell = this.get(charX, y);
        if (existingCell) {
          bgColor = existingCell.bg;
        } else {
          bgColor = RGBA.fromValues(0.0, 0.0, 0.0, 1.0);
        }
      }

      this.setCellWithAlphaBlending(charX, y, char, fg, bgColor, attributes);
    }
  }

  public fillRect(x: number, y: number, width: number, height: number, bg: RGBA): void {
    const startX = Math.max(0, x);
    const startY = Math.max(0, y);
    const endX = Math.min(this.getWidth() - 1, x + width - 1);
    const endY = Math.min(this.getHeight() - 1, y + height - 1);

    if (startX > endX || startY > endY) return;

    const fg = RGBA.fromValues(1.0, 1.0, 1.0, 1.0);
    for (let fillY = startY; fillY <= endY; fillY++) {
      for (let fillX = startX; fillX <= endX; fillX++) {
        this.setCellWithAlphaBlending(fillX, fillY, ' ', fg, bg, 0);
      }
    }
  }

  public drawFrameBuffer(
    destX: number,
    destY: number,
    frameBuffer: OptimizedBuffer,
    sourceX?: number,
    sourceY?: number,
    sourceWidth?: number,
    sourceHeight?: number,
  ): void {
    const srcX = sourceX ?? 0;
    const srcY = sourceY ?? 0;
    const srcWidth = sourceWidth ?? frameBuffer.getWidth();
    const srcHeight = sourceHeight ?? frameBuffer.getHeight();

    if (srcX >= frameBuffer.getWidth() || srcY >= frameBuffer.getHeight()) return;
    if (srcWidth === 0 || srcHeight === 0) return;

    const clampedSrcWidth = Math.min(srcWidth, frameBuffer.getWidth() - srcX);
    const clampedSrcHeight = Math.min(srcHeight, frameBuffer.getHeight() - srcY);

    const startDestX = Math.max(0, destX);
    const startDestY = Math.max(0, destY);
    const endDestX = Math.min(this.width - 1, destX + clampedSrcWidth - 1);
    const endDestY = Math.min(this.height - 1, destY + clampedSrcHeight - 1);

    for (let dY = startDestY; dY <= endDestY; dY++) {
      for (let dX = startDestX; dX <= endDestX; dX++) {
        const relativeDestX = dX - destX;
        const relativeDestY = dY - destY;
        const sX = srcX + relativeDestX;
        const sY = srcY + relativeDestY;

        if (sX >= frameBuffer.getWidth() || sY >= frameBuffer.getHeight()) continue;

        const srcCell = frameBuffer.get(sX, sY);
        if (srcCell) {
          const char = String.fromCharCode(srcCell.char);
          if (frameBuffer.respectAlpha && srcCell.bg.a === 0 && srcCell.fg.a === 0) {
            continue;
          }
          this.setCellWithAlphaBlending(dX, dY, char, srcCell.fg, srcCell.bg, srcCell.attributes);
        }
      }
    }
  }

  // Stub methods for compatibility
  public drawStyledText(): void {}
  public drawStyledTextFragment(): void {}
  public destroy(): void {}
  public resize(width: number, height: number): void {
    // Create new buffers with new size
    const newSize = width * height;
    const newBuffer = {
      char: new Uint32Array(newSize),
      fg: new Float32Array(newSize * 4),
      bg: new Float32Array(newSize * 4),
      attributes: new Uint8Array(newSize),
    };

    // Copy existing data
    const minWidth = Math.min(this.width, width);
    const minHeight = Math.min(this.height, height);

    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        const oldIndex = this.coordsToIndex(x, y);
        const newIndex = y * width + x;
        const oldColorIndex = oldIndex * 4;
        const newColorIndex = newIndex * 4;

        newBuffer.char[newIndex] = this.buffer.char[oldIndex];
        newBuffer.attributes[newIndex] = this.buffer.attributes[oldIndex];

        for (let i = 0; i < 4; i++) {
          newBuffer.fg[newColorIndex + i] = this.buffer.fg[oldColorIndex + i];
          newBuffer.bg[newColorIndex + i] = this.buffer.bg[oldColorIndex + i];
        }
      }
    }

    this.buffer = newBuffer;
    this.width = width;
    this.height = height;
  }
}
