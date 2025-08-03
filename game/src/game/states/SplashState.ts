import {BaseState} from './BaseState';
import {AuthState} from './AuthState';
import {StyledTextRenderable, t, fg, type ParsedKey, Image} from '../../core';
import {COLORS, GAME_CONFIG} from '../constants';
import {Assets} from '../assets';

export class SplashState extends BaseState {
  private animationTime: number = 0;
  private logo: Image | null = null;
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
    if (this.logo) {
      this.stateContainer.remove(this.logo.id);
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

    // Create logo image using the new Image class
    if (Assets.logo) {
      this.logo = new Image(
        'logo',
        this.renderer,
        Assets.logo,
        0, // x will be set below
        0, // y will be set below
        {
          scale: 1,
          zIndex: 100,
          visible: true,
        },
      );

      // Center the logo
      const logoDimensions = this.logo.getCharDimensions();
      this.logo.x = centerX - Math.floor(logoDimensions.width / 2);
      this.logo.y = centerY - Math.floor(logoDimensions.height / 2) - 5;

      this.stateContainer.add(this.logo);
    }

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
