import {Renderable, RenderableOptions} from './Renderable';
import {FrameBufferRenderable} from './objects';
import {CliRenderer} from './index';
import {RGBA} from './types';
import {OptimizedBuffer} from './buffer';
import {AssetData, getNormalizedPixelAt} from '../game/assets';

// Block characters for rendering
const BLOCK_CHARS = {
  FULL: '█',
  UPPER: '▀',
  LOWER: '▄',
  LEFT: '▌',
  RIGHT: '▐',
  SHADE_LIGHT: '░',
  SHADE_MED: '▒',
  SHADE_DARK: '▓',
};

export interface ImageOptions extends Partial<RenderableOptions> {
  scale?: number; // Scale factor for the image (default: 1)
  flipX?: boolean; // Flip horizontally
  flipY?: boolean; // Flip vertically
  animation?: AnimationType; // Animation to apply
  waveAmplitude?: number;
  animationDuration?: number; // Duration in milliseconds
  animationDelay?: number; // Delay before animation starts
}

export type AnimationType = 'shimmer' | 'pulse' | 'wave' | 'none';

interface AnimationState {
  type: AnimationType;
  startTime: number;
  duration: number;
  delay: number;
  lastUpdate: number;
}

export class Image extends Renderable {
  private frameBuffer: FrameBufferRenderable | null = null;
  private renderer: CliRenderer;
  private imageData: AssetData;
  private scale: number;
  private flipX: boolean;
  private flipY: boolean;
  private charWidth: number;
  private charHeight: number;
  private animationState: AnimationState | null = null;
  private originalPixels: Map<string, RGBA> = new Map();
  private animationFrame: number = 0;

  constructor(
    id: string,
    renderer: CliRenderer,
    imageData: AssetData,
    x: number = 0,
    y: number = 0,
    public options?: ImageOptions,
  ) {
    // Calculate character dimensions (using half-block rendering)
    // Each pixel is 1 char wide, 2 pixels are 1 char tall
    const scale = options?.scale ?? 1;
    const charWidth = Math.ceil(imageData.width * scale);
    const charHeight = Math.ceil((imageData.height * scale) / 2);

    super(id, {
      x,
      y,
      width: charWidth,
      height: charHeight,
      zIndex: options?.zIndex ?? 0,
      visible: options?.visible ?? true,
    });

    this.renderer = renderer;
    this.imageData = imageData;
    this.scale = scale;
    this.flipX = options?.flipX ?? false;
    this.flipY = options?.flipY ?? false;
    this.charWidth = charWidth;
    this.charHeight = charHeight;

    // Setup animation if specified
    if (options?.animation && options.animation !== 'none') {
      this.animationState = {
        type: options.animation,
        startTime: Date.now(),
        duration: options.animationDuration ?? 2000,
        delay: options.animationDelay ?? 0,
        lastUpdate: Date.now(),
      };
    }

    // Create the frame buffer
    this.createFrameBuffer();
    // Render the image to the buffer
    this.renderImage();

    // Start animation loop if needed
    if (this.animationState) {
      this.startAnimationLoop();
    }
  }

  private createFrameBuffer(): void {
    // Create an optimized buffer with transparency
    const buffer = this.renderer.lib.createOptimizedBuffer(this.charWidth, this.charHeight, true);

    // Create FrameBufferRenderable from the buffer
    this.frameBuffer = new FrameBufferRenderable(`${this.id}-buffer`, buffer, {
      x: 0,
      y: 0,
      width: this.charWidth,
      height: this.charHeight,
      zIndex: 0,
    });

    // Add to this renderable
    this.add(this.frameBuffer);
  }

  private renderImage(): void {
    if (!this.frameBuffer) return;

    // Clear the buffer
    this.frameBuffer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0));

    // Process the image pixel by pixel
    for (let charY = 0; charY < this.charHeight; charY++) {
      for (let charX = 0; charX < this.charWidth; charX++) {
        // Calculate which pixels this character represents
        const topPixelY = Math.floor((charY * 2) / this.scale);
        const bottomPixelY = Math.floor((charY * 2 + 1) / this.scale);
        const pixelX = Math.floor(charX / this.scale);

        // Apply flipping
        const srcX = this.flipX ? this.imageData.width - 1 - pixelX : pixelX;
        const srcTopY = this.flipY ? this.imageData.height - 1 - topPixelY : topPixelY;
        const srcBottomY = this.flipY ? this.imageData.height - 1 - bottomPixelY : bottomPixelY;

        // Get the colors for top and bottom pixels
        const topPixel = getNormalizedPixelAt(this.imageData, srcX, srcTopY);
        const bottomPixel = getNormalizedPixelAt(this.imageData, srcX, srcBottomY);

        if (!topPixel && !bottomPixel) continue;

        const topColor = topPixel
          ? RGBA.fromValues(topPixel.r, topPixel.g, topPixel.b, topPixel.a)
          : RGBA.fromValues(0, 0, 0, 0);
        const bottomColor = bottomPixel
          ? RGBA.fromValues(bottomPixel.r, bottomPixel.g, bottomPixel.b, bottomPixel.a)
          : RGBA.fromValues(0, 0, 0, 0);

        const topAlpha = topColor.buffer[3];
        const bottomAlpha = bottomColor.buffer[3];

        // Rendering logic similar to LayeredRenderer
        if (topAlpha > 0 && bottomAlpha > 0) {
          // Both pixels visible
          const topBrightness = (topColor.buffer[0] + topColor.buffer[1] + topColor.buffer[2]) / 3;
          const bottomBrightness =
            (bottomColor.buffer[0] + bottomColor.buffer[1] + bottomColor.buffer[2]) / 3;
          const brightnessDiff = Math.abs(topBrightness - bottomBrightness);

          const rDiff = Math.abs(topColor.buffer[0] - bottomColor.buffer[0]);
          const gDiff = Math.abs(topColor.buffer[1] - bottomColor.buffer[1]);
          const bDiff = Math.abs(topColor.buffer[2] - bottomColor.buffer[2]);
          const colorDiff = (rDiff + gDiff + bDiff) / 3;

          if (colorDiff < 0.05 && topAlpha > 0.95 && bottomAlpha > 0.95) {
            // Very similar colors - use full block
            const avgColor = RGBA.fromValues(
              (topColor.buffer[0] + bottomColor.buffer[0]) / 2,
              (topColor.buffer[1] + bottomColor.buffer[1]) / 2,
              (topColor.buffer[2] + bottomColor.buffer[2]) / 2,
              (topAlpha + bottomAlpha) / 2,
            );
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.FULL,
              avgColor,
              RGBA.fromValues(0, 0, 0, 0),
            );
          } else {
            // Use upper half block for two-color rendering
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.UPPER,
              topColor,
              bottomColor,
            );
          }
        } else if (topAlpha > 0 && bottomAlpha === 0) {
          // Only top pixel visible
          if (topAlpha < 0.3) {
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.SHADE_LIGHT,
              topColor,
              RGBA.fromValues(0, 0, 0, 0),
            );
          } else {
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.UPPER,
              topColor,
              RGBA.fromValues(0, 0, 0, 0),
            );
          }
        } else if (topAlpha === 0 && bottomAlpha > 0) {
          // Only bottom pixel visible
          if (bottomAlpha < 0.3) {
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.SHADE_LIGHT,
              bottomColor,
              RGBA.fromValues(0, 0, 0, 0),
            );
          } else {
            this.frameBuffer.frameBuffer.setCell(
              charX,
              charY,
              BLOCK_CHARS.LOWER,
              bottomColor,
              RGBA.fromValues(0, 0, 0, 0),
            );
          }
        }
      }
    }

    // Force update
    this.frameBuffer.needsUpdate = true;
  }

  /**
   * Update the image data and re-render
   */
  public setImageData(imageData: AssetData): void {
    this.imageData = imageData;

    // Recalculate dimensions
    this.charWidth = Math.ceil(imageData.width * this.scale);
    this.charHeight = Math.ceil((imageData.height * this.scale) / 2);
    this.width = this.charWidth;
    this.height = this.charHeight;

    // Recreate frame buffer if dimensions changed
    if (this.frameBuffer) {
      this.remove(this.frameBuffer.id);
      this.frameBuffer.destroy();
    }
    this.createFrameBuffer();
    this.renderImage();
  }

  /**
   * Set scale and re-render
   */
  public setScale(scale: number): void {
    if (scale <= 0) return;
    this.scale = scale;
    this.setImageData(this.imageData);
  }

  /**
   * Set flip options and re-render
   */
  public setFlip(flipX?: boolean, flipY?: boolean): void {
    const changed =
      (flipX !== undefined && flipX !== this.flipX) ||
      (flipY !== undefined && flipY !== this.flipY);

    if (changed) {
      if (flipX !== undefined) this.flipX = flipX;
      if (flipY !== undefined) this.flipY = flipY;
      this.renderImage();
    }
  }

  /**
   * Get the current image dimensions in characters
   */
  public getCharDimensions(): {width: number; height: number} {
    return {
      width: this.charWidth,
      height: this.charHeight,
    };
  }

  /**
   * Get the original pixel dimensions
   */
  public getPixelDimensions(): {width: number; height: number} {
    return {
      width: this.imageData.width,
      height: this.imageData.height,
    };
  }

  protected destroySelf(): void {
    if (this.frameBuffer) {
      this.frameBuffer.frameBuffer.destroy();
    }
    // Clear animation frame if exists
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    const animate = () => {
      if (!this.animationState || !this.frameBuffer) return;

      const now = Date.now();
      const elapsed = now - this.animationState.startTime;

      // Check if we're past the delay
      if (elapsed >= this.animationState.delay) {
        const animTime = (elapsed - this.animationState.delay) % this.animationState.duration;
        const progress = animTime / this.animationState.duration;

        debugger;
        this.applyAnimation(progress);
        this.frameBuffer.needsUpdate = true;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Apply the current animation based on progress
   */
  private applyAnimation(progress: number): void {
    try {
      if (!this.animationState || !this.frameBuffer) return;

      switch (this.animationState.type) {
        case 'shimmer':
          this.applyShimmer(progress);
          break;
        case 'pulse':
          this.applyPulse(progress);
          break;
        case 'wave':
          this.applyWave(progress);
          break;
      }
    } catch (ex) {
      console.error('Error applying animation:', ex);
    }
  }

  /**
   * Shimmer effect - bright band moving from top to bottom
   */
  private applyShimmer(progress: number): void {
    if (!this.frameBuffer) return;

    // First render the base image
    this.renderImage();

    const shimmerHeight = 5; // Height of shimmer band in pixels
    const totalHeight = this.imageData.height;
    const shimmerCenter = Math.floor(progress * (totalHeight + shimmerHeight)) - shimmerHeight / 2;

    // Apply shimmer effect
    for (let charY = 0; charY < this.charHeight; charY++) {
      for (let charX = 0; charX < this.charWidth; charX++) {
        const topPixelY = Math.floor((charY * 2) / this.scale);
        const bottomPixelY = Math.floor((charY * 2 + 1) / this.scale);

        // Check if pixels are in shimmer range
        const topInShimmer = Math.abs(topPixelY - shimmerCenter) < shimmerHeight / 2;
        const bottomInShimmer = Math.abs(bottomPixelY - shimmerCenter) < shimmerHeight / 2;

        if (topInShimmer || bottomInShimmer) {
          const cell = this.frameBuffer.frameBuffer.get(charX, charY);
          if (!cell) continue;

          // Calculate shimmer intensity based on distance from center
          const topIntensity = topInShimmer
            ? 1 - Math.abs(topPixelY - shimmerCenter) / (shimmerHeight / 2)
            : 0;
          const bottomIntensity = bottomInShimmer
            ? 1 - Math.abs(bottomPixelY - shimmerCenter) / (shimmerHeight / 2)
            : 0;

          // Apply shimmer to foreground color
          if (cell.fg.buffer[3] > 0) {
            const shimmerFg = this.applyShimmerToColor(cell.fg, topIntensity);
            cell.fg = shimmerFg;
          }

          // Apply shimmer to background color
          if (cell.bg.buffer[3] > 0) {
            const shimmerBg = this.applyShimmerToColor(cell.bg, bottomIntensity);
            cell.bg = shimmerBg;
          }

          this.frameBuffer.frameBuffer.setCell(charX, charY, cell.char, cell.fg, cell.bg);
        }
      }
    }
  }

  /**
   * Apply shimmer brightness to a color
   */
  private applyShimmerToColor(color: RGBA, intensity: number): RGBA {
    if (color.buffer[3] === 0) return color; // Skip transparent

    const boost = intensity * 0.5; // Max 50% brightness boost
    return RGBA.fromValues(
      Math.min(1, color.buffer[0] + boost),
      Math.min(1, color.buffer[1] + boost),
      Math.min(1, color.buffer[2] + boost),
      color.buffer[3],
    );
  }

  /**
   * Pulse effect - entire image brightens and darkens
   */
  private applyPulse(progress: number): void {
    if (!this.frameBuffer) return;

    // First render the base image
    this.renderImage();

    // Use sine wave for smooth pulsing
    const intensity = (Math.sin(progress * Math.PI * 2) + 1) / 2; // 0 to 1
    const brightnessBoost = intensity * 0.3; // Max 30% brightness variation

    for (let charY = 0; charY < this.charHeight; charY++) {
      for (let charX = 0; charX < this.charWidth; charX++) {
        const cell = this.frameBuffer.frameBuffer.get(charX, charY);
        if (!cell) continue;

        // Apply pulse to both colors
        if (cell.fg.buffer[3] > 0) {
          cell.fg = this.adjustBrightness(cell.fg, brightnessBoost);
        }
        if (cell.bg.buffer[3] > 0) {
          cell.bg = this.adjustBrightness(cell.bg, brightnessBoost);
        }

        this.frameBuffer.frameBuffer.setCell(charX, charY, cell.char, cell.fg, cell.bg);
      }
    }
  }

  /**
   * Wave effect - distortion wave moving across the image
   */
  private applyWave(progress: number): void {
    if (!this.frameBuffer) return;

    // Clear and re-render with wave distortion
    this.frameBuffer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0));

    const waveAmplitude = this.options?.waveAmplitude ?? 3; // Pixels of vertical displacement
    const waveFrequency = 2; // Full wave cycles across the image

    for (let charY = 0; charY < this.charHeight; charY++) {
      for (let charX = 0; charX < this.charWidth; charX++) {
        // Calculate wave offset using sine wave
        // Progress moves the wave horizontally, charX determines position in wave
        const wavePhase =
          (charX / this.charWidth) * waveFrequency * Math.PI * 2 + progress * Math.PI * 2;
        const waveOffset = Math.sin(wavePhase) * waveAmplitude;

        // Calculate source pixels with vertical wave offset
        const topPixelY = Math.floor((charY * 2 - waveOffset) / this.scale);
        const bottomPixelY = Math.floor((charY * 2 + 1 - waveOffset) / this.scale);
        const pixelX = Math.floor(charX / this.scale);

        // Bounds check
        if (
          topPixelY < 0 ||
          topPixelY >= this.imageData.height ||
          bottomPixelY < 0 ||
          bottomPixelY >= this.imageData.height ||
          pixelX < 0 ||
          pixelX >= this.imageData.width
        ) {
          continue;
        }

        // Apply flipping
        const srcX = this.flipX ? this.imageData.width - 1 - pixelX : pixelX;
        const srcTopY = this.flipY ? this.imageData.height - 1 - topPixelY : topPixelY;
        const srcBottomY = this.flipY ? this.imageData.height - 1 - bottomPixelY : bottomPixelY;

        // Get the colors for top and bottom pixels
        const topPixel = getNormalizedPixelAt(this.imageData, srcX, srcTopY);
        const bottomPixel = getNormalizedPixelAt(this.imageData, srcX, srcBottomY);

        if (!topPixel && !bottomPixel) continue;

        const topColor = topPixel
          ? RGBA.fromValues(topPixel.r, topPixel.g, topPixel.b, topPixel.a)
          : RGBA.fromValues(0, 0, 0, 0);
        const bottomColor = bottomPixel
          ? RGBA.fromValues(bottomPixel.r, bottomPixel.g, bottomPixel.b, bottomPixel.a)
          : RGBA.fromValues(0, 0, 0, 0);

        // Render the distorted pixel
        this.renderPixelPair(charX, charY, topColor, bottomColor);
      }
    }
  }

  /**
   * Helper to adjust brightness
   */
  private adjustBrightness(color: RGBA, amount: number): RGBA {
    return RGBA.fromValues(
      Math.max(0, Math.min(1, color.buffer[0] + amount)),
      Math.max(0, Math.min(1, color.buffer[1] + amount)),
      Math.max(0, Math.min(1, color.buffer[2] + amount)),
      color.buffer[3],
    );
  }

  /**
   * Helper to render a pixel pair
   */
  private renderPixelPair(charX: number, charY: number, topColor: RGBA, bottomColor: RGBA): void {
    if (!this.frameBuffer) return;

    const topAlpha = topColor.buffer[3];
    const bottomAlpha = bottomColor.buffer[3];

    if (topAlpha > 0 && bottomAlpha > 0) {
      const topBrightness = (topColor.buffer[0] + topColor.buffer[1] + topColor.buffer[2]) / 3;
      const bottomBrightness =
        (bottomColor.buffer[0] + bottomColor.buffer[1] + bottomColor.buffer[2]) / 3;

      const rDiff = Math.abs(topColor.buffer[0] - bottomColor.buffer[0]);
      const gDiff = Math.abs(topColor.buffer[1] - bottomColor.buffer[1]);
      const bDiff = Math.abs(topColor.buffer[2] - bottomColor.buffer[2]);
      const colorDiff = (rDiff + gDiff + bDiff) / 3;

      if (colorDiff < 0.05 && topAlpha > 0.95 && bottomAlpha > 0.95) {
        const avgColor = RGBA.fromValues(
          (topColor.buffer[0] + bottomColor.buffer[0]) / 2,
          (topColor.buffer[1] + bottomColor.buffer[1]) / 2,
          (topColor.buffer[2] + bottomColor.buffer[2]) / 2,
          (topAlpha + bottomAlpha) / 2,
        );
        this.frameBuffer.frameBuffer.setCell(
          charX,
          charY,
          BLOCK_CHARS.FULL,
          avgColor,
          RGBA.fromValues(0, 0, 0, 0),
        );
      } else {
        this.frameBuffer.frameBuffer.setCell(
          charX,
          charY,
          BLOCK_CHARS.UPPER,
          topColor,
          bottomColor,
        );
      }
    } else if (topAlpha > 0) {
      this.frameBuffer.frameBuffer.setCell(
        charX,
        charY,
        topAlpha < 0.3 ? BLOCK_CHARS.SHADE_LIGHT : BLOCK_CHARS.UPPER,
        topColor,
        RGBA.fromValues(0, 0, 0, 0),
      );
    } else if (bottomAlpha > 0) {
      this.frameBuffer.frameBuffer.setCell(
        charX,
        charY,
        bottomAlpha < 0.3 ? BLOCK_CHARS.SHADE_LIGHT : BLOCK_CHARS.LOWER,
        bottomColor,
        RGBA.fromValues(0, 0, 0, 0),
      );
    }
  }

  /**
   * Set or change animation
   */
  public setAnimation(type: AnimationType, duration?: number, delay?: number): void {
    // Clear existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }

    if (type === 'none') {
      this.animationState = null;
      this.renderImage(); // Render static image
    } else {
      this.animationState = {
        type,
        startTime: Date.now(),
        duration: duration ?? 2000,
        delay: delay ?? 0,
        lastUpdate: Date.now(),
      };
      this.startAnimationLoop();
    }
  }
}
