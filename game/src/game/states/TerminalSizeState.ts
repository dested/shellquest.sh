import {BaseState} from './BaseState';
import {SplashState} from './SplashState';
import {
  StyledTextRenderable,
  t,
  fg,
  bold,
  type ParsedKey,
  Image,
  GroupRenderable,
} from '../../core';
import {GAME_CONFIG} from '../constants';
import {Assets} from '../assets';

export class TerminalSizeState extends BaseState {
  private checkInterval: NodeJS.Timeout | null = null;
  private logo: Image | null = null;
  private messageContainer: GroupRenderable | null = null;
  private titleText: StyledTextRenderable | null = null;
  private sizeText: StyledTextRenderable | null = null;
  private instructionTexts: StyledTextRenderable[] = [];
  private hintText: StyledTextRenderable | null = null;
  private decorationTexts: StyledTextRenderable[] = [];
  private animationTime: number = 0;
  private animationInterval: NodeJS.Timeout | null = null;
  private resizeHandler: (() => void) | null = null;

  onEnter(): void {
    this.createUI();
    this.startSizeCheck();
    this.startAnimation();

    // Setup resize handler
    this.resizeHandler = () => {
      this.updateUIPositions();
    };
    this.renderer.on('resize', this.resizeHandler);
  }

  onExit(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    // Remove resize handler
    if (this.resizeHandler) {
      this.renderer.off('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Clean up all renderables
    if (this.logo) {
      this.stateContainer.remove(this.logo.id);
    }
    if (this.messageContainer) {
      this.stateContainer.remove(this.messageContainer.id);
    }
    this.decorationTexts.forEach((text) => {
      this.stateContainer.remove(text.id);
    });
  }

  private createUI(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;
    const centerX = Math.floor(termWidth / 2);
    const centerY = Math.floor(termHeight / 2);

    // Create logo with scale flag to fit screen
    if (Assets.logo) {
      this.logo = new Image('size-logo', this.renderer, Assets.logo, 0, 0, {
        animation: 'pulse',
        animationDuration: 2000,
        scale: 0.5, // Scale down to fit smaller terminal
        zIndex: 100,
        visible: true,
      });

      // Center the logo
      const logoDimensions = this.logo.getCharDimensions();
      this.logo.x = centerX - Math.floor(logoDimensions.width / 2);
      this.logo.y = Math.max(1, centerY - Math.floor(logoDimensions.height / 2) - 8);

      this.stateContainer.add(this.logo);
    }

    // Create message container
    this.messageContainer = new GroupRenderable('size-message', {
      x: 0,
      y: centerY,
      zIndex: 101,
      visible: true,
    });
    this.stateContainer.add(this.messageContainer);

    // Title text with warning icon
    const titleMessage = '⚠ Terminal Size Required ⚠';
    this.titleText = this.renderer.createStyledText('size-title', {
      fragment: t`${bold(fg('#FF6600')(titleMessage))}`,
      x: centerX - Math.floor(titleMessage.length / 2),
      y: 0,
      width: titleMessage.length + 2,
      height: 1,
      zIndex: 102,
    });
    this.messageContainer.add(this.titleText);

    // Current size display
    const currentSize = `Current: ${termWidth}×${termHeight}`;
    const requiredSize = `Required: ${GAME_CONFIG.MIN_TERMINAL_WIDTH}×${GAME_CONFIG.MIN_TERMINAL_HEIGHT}`;

    this.sizeText = this.renderer.createStyledText('size-info', {
      fragment: t`${fg('#FF3333')(currentSize)}  ${fg('#00FF00')(requiredSize)}`,
      x: centerX - 20,
      y: 2,
      width: 40,
      height: 1,
      zIndex: 102,
    });
    this.messageContainer.add(this.sizeText);

    // Instructions
    const instructions = [
      'Please resize your terminal window:',
      '• Zoom out (Ctrl/Cmd + -)',
      '• Maximize the window',
      '• Adjust font size in settings',
    ];

    instructions.forEach((instruction, index) => {
      const text = this.renderer.createStyledText(`instruction-${index}`, {
        fragment: t`${fg(index === 0 ? '#FFFFFF' : '#AAAAAA')(instruction)}`,
        x: centerX - 18,
        y: 4 + index,
        width: 36,
        height: 1,
        zIndex: 102,
      });
      this.messageContainer.add(text);
      this.instructionTexts.push(text);
    });

    // Hint text at bottom
    this.hintText = this.renderer.createStyledText('hint', {
      fragment: t`${fg('#666666')('shellquest.sh works best in larger terminals')}`,
      x: centerX - 22,
      y: 10,
      width: 44,
      height: 1,
      zIndex: 102,
    });
    this.messageContainer.add(this.hintText);

    // Add decorative ASCII art borders
    this.createDecorations();
  }

  private createDecorations(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;

    // Create corner decorations
    const corners = [
      {x: 2, y: 2, text: '╔═══╗'},
      {x: termWidth - 7, y: 2, text: '╔═══╗'},
      {x: 2, y: termHeight - 3, text: '╚═══╝'},
      {x: termWidth - 7, y: termHeight - 3, text: '╚═══╝'},
    ];

    corners.forEach((corner, index) => {
      const decoration = this.renderer.createStyledText(`corner-${index}`, {
        fragment: t`${fg('#333333')(corner.text)}`,
        x: corner.x,
        y: corner.y,
        width: corner.text.length,
        height: 1,
        zIndex: 99,
      });
      this.stateContainer.add(decoration);
      this.decorationTexts.push(decoration);
    });
  }

  private startAnimation(): void {
    // Clear any existing interval first
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    this.animationInterval = setInterval(() => {
      this.animationTime += 0.05;

      // Pulse the title color
      if (this.titleText) {
        const brightness = 0.7 + Math.sin(this.animationTime * 2) * 0.3;
        const color = this.interpolateColor('#CC4400', '#FF8800', brightness);
        const titleMessage = '⚠ Terminal Size Required ⚠';
        this.titleText.fragment = t`${bold(fg(color)(titleMessage))}`;
      }

      // Update current size display with color coding
      const termWidth = process.stdout.columns || 80;
      const termHeight = process.stdout.rows || 24;

      if (this.sizeText) {
        const widthOk = termWidth >= GAME_CONFIG.MIN_TERMINAL_WIDTH;
        const heightOk = termHeight >= GAME_CONFIG.MIN_TERMINAL_HEIGHT;

        const currentColor =
          widthOk && heightOk ? '#00FF00' : widthOk || heightOk ? '#FFAA00' : '#FF3333';

        const currentSize = `Current: ${termWidth}×${termHeight}`;
        const requiredSize = `Required: ${GAME_CONFIG.MIN_TERMINAL_WIDTH}×${GAME_CONFIG.MIN_TERMINAL_HEIGHT}`;

        this.sizeText.fragment = t`${fg(currentColor)(currentSize)}  ${fg('#00FF00')(requiredSize)}`;
      }

      // Animate corner decorations
      this.decorationTexts.forEach((text, index) => {
        const phase = this.animationTime + index * 0.5;
        const brightness = 0.3 + Math.sin(phase) * 0.2;
        const color = this.interpolateColor('#222222', '#666666', brightness);
        const cornerChars = index < 2 ? '╔═══╗' : '╚═══╝';
        text.fragment = t`${fg(color)(cornerChars)}`;
      });
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

  private startSizeCheck(): void {
    // Check terminal size every 100ms
    this.checkInterval = setInterval(() => {
      const columns = process.stdout.columns || 80;
      const rows = process.stdout.rows || 24;

      if (columns >= GAME_CONFIG.MIN_TERMINAL_WIDTH && rows >= GAME_CONFIG.MIN_TERMINAL_HEIGHT) {
        // Terminal is now the right size, transition to FadeState
        // Stop all timers before transitioning
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        if (this.animationInterval) {
          clearInterval(this.animationInterval);
          this.animationInterval = null;
        }

        // Small delay to ensure terminal dimensions are fully updated
        setTimeout(() => {
          this.stateManager.replace(new SplashState(), {
            type: 'fade',
            duration: 500,
          });
        }, 100);
      }
    }, 100);
  }

  private updateUIPositions(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;
    const centerX = Math.floor(termWidth / 2);
    const centerY = Math.floor(termHeight / 2);

    // Update logo position
    if (this.logo) {
      const logoDimensions = this.logo.getCharDimensions();
      this.logo.x = centerX - Math.floor(logoDimensions.width / 2);
      this.logo.y = Math.max(1, centerY - Math.floor(logoDimensions.height / 2) - 8);
    }

    // Update message container position
    if (this.messageContainer) {
      this.messageContainer.y = centerY;
    }

    // Update title text position
    if (this.titleText) {
      const titleMessage = '⚠ Terminal Size Required ⚠';
      this.titleText.x = centerX - Math.floor(titleMessage.length / 2);
    }

    // Update size text position
    if (this.sizeText) {
      this.sizeText.x = centerX - 20;
    }

    // Update instruction texts position
    this.instructionTexts.forEach((text) => {
      text.x = centerX - 18;
    });

    // Update hint text position
    if (this.hintText) {
      this.hintText.x = centerX - 22;
    }

    // Clear old decorations
    this.decorationTexts.forEach((text) => {
      this.stateContainer.remove(text.id);
    });
    this.decorationTexts = [];

    // Recreate decorations with new positions
    this.createDecorations();
  }

  handleInput(key: ParsedKey): void {
    // Allow ESC or Ctrl+C to exit
    if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      process.exit(0);
    }
  }
}
