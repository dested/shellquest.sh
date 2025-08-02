import { BaseState } from './BaseState';
import { GameOverState } from './GameOverState';
import {
    FrameBufferRenderable,
    StyledTextRenderable,
    OptimizedBuffer,
    RGBA,
    t,
    bold,
    fg,
    type ParsedKey,
} from '../../core';
import { COLORS, GAME_CONFIG } from '../constants';

export class GameplayState extends BaseState {
    private gameArea: FrameBufferRenderable | null = null;
    private hudText: StyledTextRenderable | null = null;
    private helpText: StyledTextRenderable | null = null;
    private playerX: number = 10;
    private playerY: number = 10;

    onEnter(): void {
        this.createUI();
    }

    onExit(): void {
        // Cleanup handled by BaseState
    }

    private createUI(): void {
        const termWidth = this.renderer.terminalWidth;
        const termHeight = this.renderer.terminalHeight;

        // Game area
        this.gameArea = new FrameBufferRenderable('game-area', 
            this.renderer.lib.createOptimizedBuffer(termWidth, termHeight - 10, true), {
            x: 0,
            y: 0,
            width: termWidth,
            height: termHeight - 10,
            zIndex: 100,
        });
        this.stateContainer.add(this.gameArea);

        // HUD
        this.hudText = this.renderer.createStyledText('hud', {
            fragment: this.getHUDText(),
            x: 2,
            y: termHeight - 9,
            width: termWidth - 4,
            height: 8,
            zIndex: 101,
        });
        this.stateContainer.add(this.hudText);

        // Help text
        this.helpText = this.renderer.createStyledText('help', {
            fragment: t`${fg('#666666')('[WASD/Arrows] Move  [Space] Attack  [Tab] Swap  [Esc] Menu')}`,
            x: 2,
            y: termHeight - 1,
            width: termWidth - 4,
            height: 1,
            zIndex: 101,
        });
        this.stateContainer.add(this.helpText);

        this.drawGame();
    }

    private getHUDText() {
        return t`${fg('#FF0000')('HP: 70/100')} ${fg('#00AAFF')('MP: 20/50')} ${fg('#FFFF00')('Keys: 0/3')} ${fg('#FFD700')('Coins: 0')}
${fg('#888888')('────────────────────────────────────────────────────────')}
${fg('#CCCCCC')('Level 1')} ${fg('#00FF00')('Time: 30s')} ${fg('#FF8800')('Weapon: Basic Sword')}`;
    }

    private drawGame(): void {
        if (!this.gameArea) return;

        const buffer = this.gameArea.frameBuffer;
        buffer.clear();

        // Draw simple dungeon room
        const roomWidth = 40;
        const roomHeight = 20;
        const roomX = 10;
        const roomY = 5;

        const wallColor = RGBA.fromHex(0x888888);
        const floorColor = RGBA.fromHex(0x333333);
        const bgColor = RGBA.fromHex(0x000000);
        const playerColor = RGBA.fromHex(0x00FF00);
        const enemyColor = RGBA.fromHex(0xFF0000);
        const itemColor = RGBA.fromHex(0xFFFF00);
        const coinColor = RGBA.fromHex(0xFFD700);

        // Draw walls
        for (let x = roomX; x < roomX + roomWidth; x++) {
            buffer.setCell(x, roomY, '═', wallColor, bgColor);
            buffer.setCell(x, roomY + roomHeight, '═', wallColor, bgColor);
        }
        for (let y = roomY; y < roomY + roomHeight; y++) {
            buffer.setCell(roomX, y, '║', wallColor, bgColor);
            buffer.setCell(roomX + roomWidth, y, '║', wallColor, bgColor);
        }

        // Corners
        buffer.setCell(roomX, roomY, '╔', wallColor, bgColor);
        buffer.setCell(roomX + roomWidth, roomY, '╗', wallColor, bgColor);
        buffer.setCell(roomX, roomY + roomHeight, '╚', wallColor, bgColor);
        buffer.setCell(roomX + roomWidth, roomY + roomHeight, '╝', wallColor, bgColor);

        // Draw floor
        for (let y = roomY + 1; y < roomY + roomHeight; y++) {
            for (let x = roomX + 1; x < roomX + roomWidth; x++) {
                buffer.setCell(x, y, '·', floorColor, bgColor);
            }
        }

        // Draw player
        buffer.setCell(this.playerX, this.playerY, '@', playerColor, bgColor);

        // Draw some enemies
        buffer.setCell(roomX + 10, roomY + 5, 'g', enemyColor, bgColor);
        buffer.setCell(roomX + 25, roomY + 12, 's', enemyColor, bgColor);

        // Draw items
        buffer.setCell(roomX + 5, roomY + 10, '†', itemColor, bgColor); // Sword
        buffer.setCell(roomX + 30, roomY + 3, '○', coinColor, bgColor); // Coin
        buffer.setCell(roomX + 20, roomY + 15, '⌐', coinColor, bgColor); // Key
    }

    handleInput(key: ParsedKey): void {
        if (key.name === 'escape') {
            this.stateManager.pop();
            return;
        }

        // Handle movement
        let dx = 0;
        let dy = 0;

        if (key.name === 'w' || key.name === 'up') dy = -1;
        if (key.name === 's' || key.name === 'down') dy = 1;
        if (key.name === 'a' || key.name === 'left') dx = -1;
        if (key.name === 'd' || key.name === 'right') dx = 1;

        if (dx !== 0 || dy !== 0) {
            // Simple boundary check
            const newX = this.playerX + dx;
            const newY = this.playerY + dy;
            
            if (newX >= 11 && newX < 50 && newY >= 6 && newY < 25) {
                this.playerX = newX;
                this.playerY = newY;
                this.drawGame();
            }
        }

        // Handle attack
        if (key.name === 'space') {
            console.log('Attack!');
        }
    }
}