import {BaseState} from './BaseState';
import {AuthState} from './AuthState';
import {
  FrameBufferRenderable,
  StyledTextRenderable,
  t,
  bold,
  fg,
  type ParsedKey,
  OptimizedBuffer,
  RGBA,
} from '../../core';
import {COLORS, GAME_CONFIG} from '../constants';

export class SplashState extends BaseState {
  private animationTime: number = 0;
  private logoBuffer: FrameBufferRenderable | null = null;
  private titleText: StyledTextRenderable | null = null;
  private versionText: StyledTextRenderable | null = null;
  private copyrightText: StyledTextRenderable | null = null;
  private promptText: StyledTextRenderable | null = null;
  private animationFrame: NodeJS.Timeout | null = null;
  private totalDisplayTime: number = 3;

  onEnter(): void {
    this.createLogo();
    this.startAnimation();
  }

  onExit(): void {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }

    // Clean up all renderables
    if (this.logoBuffer) {
      this.stateContainer.remove(this.logoBuffer.id);
    }
    if (this.titleText) {
      this.stateContainer.remove(this.titleText.id);
    }
    if (this.versionText) {
      this.stateContainer.remove(this.versionText.id);
    }
    if (this.copyrightText) {
      this.stateContainer.remove(this.copyrightText.id);
    }
    if (this.promptText) {
      this.stateContainer.remove(this.promptText.id);
    }
  }

  private createLogo(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;
    const centerX = Math.floor(termWidth / 2);
    const centerY = Math.floor(termHeight / 2);

    // Create logo buffer for animated ASCII art

    this.logoBuffer = new FrameBufferRenderable(
      'logo-buffer',
      this.renderer.lib.createOptimizedBuffer(60, 20, true),
      {
        x: centerX - 30,
        y: centerY - 15,
        width: 60,
        height: 20,
        zIndex: 100,
      },
    );
    this.stateContainer.add(this.logoBuffer);

    // Title text
    this.titleText = this.renderer.createStyledText('title', {
      fragment: t`${bold(fg('#00FFFF')('shellquest.sh'))}`,
      x: centerX - 6,
      y: centerY + 8,
      width: 12,
      height: 1,
      zIndex: 101,
    });
    this.stateContainer.add(this.titleText);

    // Prompt text
    this.promptText = this.renderer.createStyledText('prompt', {
      fragment: t`${fg('#FFFF00')('Press any key to continue')}`,
      x: centerX - 13,
      y: centerY + 10,
      width: 26,
      height: 1,
      zIndex: 101,
    });
    this.stateContainer.add(this.promptText);

    // Version text
    this.versionText = this.renderer.createStyledText('version', {
      fragment: t`${fg('#666666')(`v${GAME_CONFIG.VERSION}`)}`,
      x: termWidth - 10,
      y: termHeight - 2,
      width: 8,
      height: 1,
      zIndex: 101,
    });
    this.stateContainer.add(this.versionText);

    // Copyright text
    this.copyrightText = this.renderer.createStyledText('copyright', {
      fragment: t`${fg('#666666')('© 2024 shellquest.sh')}`,
      x: 2,
      y: termHeight - 2,
      width: 20,
      height: 1,
      zIndex: 101,
    });
    this.stateContainer.add(this.copyrightText);
  }

  private startAnimation(): void {
    this.animationFrame = setInterval(() => {
      this.animationTime += 0.05;
      this.updateLogo();

      // Update prompt text pulsing
      if (this.promptText) {
        const brightness = 0.5 + Math.sin(this.animationTime * 3) * 0.5;
        const color = this.interpolateColor('#666666', '#FFFF00', brightness);
        this.promptText.fragment = t`${fg(color)('Press any key to continue')}`;
      }

      // Auto-transition after display time
      if (this.animationTime >= this.totalDisplayTime) {
        this.stateManager.replace(new AuthState());
      }
    }, 50);
  }

  private updateLogo(): void {
    if (!this.logoBuffer) return;

    const buffer = this.logoBuffer.frameBuffer;
    buffer.clear();

    // Draw animated skull logo
    const skull = [
      '         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓         ',
      '       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       ',
      '     ▓▓▓▓░░░░░░░░░░░░░░▓▓▓▓     ',
      '    ▓▓▓░░░░░░░░░░░░░░░░░░▓▓▓    ',
      '   ▓▓▓░░░██░░░░░░░░██░░░░▓▓▓   ',
      '  ▓▓▓░░░████░░░░░░████░░░░▓▓▓  ',
      '  ▓▓░░░░████░░░░░░████░░░░░▓▓  ',
      '  ▓▓░░░░░██░░░░░░░░██░░░░░░▓▓  ',
      '  ▓▓░░░░░░░░░░██░░░░░░░░░░░▓▓  ',
      '  ▓▓░░░░░░░░░████░░░░░░░░░░▓▓  ',
      '  ▓▓▓░░░░░░████████░░░░░░░▓▓▓  ',
      '   ▓▓▓░░░████████████░░░░▓▓▓   ',
      '    ▓▓▓░░██████████████░░▓▓▓    ',
      '     ▓▓▓▓░░██████████░░▓▓▓▓     ',
      '       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       ',
      '         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓         ',
    ];

    const offsetY = 2;
    for (let y = 0; y < skull.length; y++) {
      const line = skull[y];
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        let color: RGBA = RGBA.fromInts(255, 255, 255); // Default white color

        if (char === '▓') {
          // Animated rainbow effect for border
          const hue = (this.animationTime * 60 + x * 10 + y * 5) % 360;
          color = this.hslToRgb(hue / 360, 0.7, 0.5);
        } else if (char === '░') {
          // Subtle pulsing for inner area
          const brightness = 0.3 + Math.sin(this.animationTime * 2) * 0.1;
          color = this.rgbToHex(brightness, brightness, brightness);
        } else if (char === '█') {
          // Eyes and mouth glow
          const pulse = 0.7 + Math.sin(this.animationTime * 4) * 0.3;
          color = this.rgbToHex(pulse, 0, 0);
        }

        buffer.setCell(x + 13, y + offsetY, char, color, color);
      }
    }
  }

  private hslToRgb(h: number, s: number, l: number) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return RGBA.fromValues(r, g, b, 1);
  }

  private rgbToHex(r: number, g: number, b: number) {
    return RGBA.fromValues(r, g, b);
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  handleInput(key: ParsedKey): void {
    // Any key press skips to auth
    this.stateManager.replace(new AuthState());
  }
}
