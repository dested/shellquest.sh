import { BaseState } from './BaseState';
import { MainMenuState } from './MainMenuState';
import {
    StyledTextRenderable,
    t,
    bold,
    fg,
    type ParsedKey,
} from '../../core';

export class GameOverState extends BaseState {
    private titleText: StyledTextRenderable | null = null;
    private statsText: StyledTextRenderable | null = null;
    private helpText: StyledTextRenderable | null = null;

    onEnter(): void {
        this.createUI();
    }

    onExit(): void {
        // Cleanup handled by BaseState
    }

    private createUI(): void {
        const termWidth = this.renderer.terminalWidth;
        const termHeight = this.renderer.terminalHeight;
        const centerX = Math.floor(termWidth / 2);
        const centerY = Math.floor(termHeight / 2);

        // Title
        this.titleText = this.renderer.createStyledText('title', {
            fragment: t`${bold(fg('#FF0000')('GAME OVER'))}`,
            x: centerX - 5,
            y: centerY - 10,
            width: 10,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.titleText);

        // Stats
        this.statsText = this.renderer.createStyledText('stats', {
            fragment: t`${bold(fg('#FFFF00')('Final Stats'))}

${fg('#CCCCCC')('Time Survived:')} ${fg('#00FF00')('25 seconds')}
${fg('#CCCCCC')('Keys Collected:')} ${fg('#FFFF00')('2 / 3')}
${fg('#CCCCCC')('Coins Collected:')} ${fg('#FFD700')('5')}
${fg('#CCCCCC')('Enemies Defeated:')} ${fg('#FF0000')('3')}
${fg('#CCCCCC')('Experience Gained:')} ${fg('#00FFFF')('150')}

${fg('#888888')('You ran out of time!')}`,
            x: centerX - 15,
            y: centerY - 5,
            width: 30,
            height: 10,
            zIndex: 100,
        });
        this.stateContainer.add(this.statsText);

        // Help text
        this.helpText = this.renderer.createStyledText('help', {
            fragment: t`${fg('#666666')('[Enter] Continue  [R] Retry  [Esc] Main Menu')}`,
            x: centerX - 22,
            y: termHeight - 3,
            width: 44,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.helpText);
    }

    handleInput(key: ParsedKey): void {
        if (key.name === 'escape' || key.name === 'enter') {
            this.stateManager.replace(new MainMenuState());
        } else if (key.name === 'r') {
            // TODO: Retry with same settings
            this.stateManager.replace(new MainMenuState());
        }
    }
}