import { BaseState } from './BaseState';
import {
    TabSelectElement,
    TabSelectElementEvents,
    type TabSelectOption,
    FrameBufferRenderable,
    StyledTextRenderable,
    t,
    bold,
    fg,
    type ParsedKey,
} from '../../core';
import { LEADERBOARD_PERIODS } from '../constants';

export class LeaderboardState extends BaseState {
    private periodTabs: TabSelectElement | null = null;
    private leaderboardArea: FrameBufferRenderable | null = null;
    private titleText: StyledTextRenderable | null = null;
    private contentText: StyledTextRenderable | null = null;
    private helpText: StyledTextRenderable | null = null;
    private currentPeriod: string = 'DAILY';

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

        // Title
        this.titleText = this.renderer.createStyledText('title', {
            fragment: t`${bold(fg('#00FFFF')('LEADERBOARD'))}`,
            x: centerX - 6,
            y: 3,
            width: 12,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.titleText);

        // Period tabs
        const tabs: TabSelectOption[] = [
            { name: 'Last Hour', description: '', value: 'HOURLY' },
            { name: 'Today', description: '', value: 'DAILY' },
            { name: 'This Week', description: '', value: 'WEEKLY' },
            { name: 'This Month', description: '', value: 'MONTHLY' },
        ];

        this.periodTabs = new TabSelectElement('period-tabs', {
            x: 10,
            y: 6,
            width: termWidth - 20,
            options: tabs,
            zIndex: 101,
            tabWidth: Math.floor((termWidth - 20) / tabs.length) - 1,
            selectedBackgroundColor: '#334455',
            selectedTextColor: '#FFFF00',
            textColor: '#CCCCCC',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            showDescription: false,
            showUnderline: true,
            showScrollArrows: false,
            wrapSelection: true,
        });
        this.stateContainer.add(this.periodTabs);

        // Leaderboard area
        this.leaderboardArea = new FrameBufferRenderable('leaderboard-area', {
            x: 10,
            y: 10,
            width: termWidth - 20,
            height: termHeight - 15,
            zIndex: 99,
        });
        this.stateContainer.add(this.leaderboardArea);
        this.drawBorder();

        // Help text
        this.helpText = this.renderer.createStyledText('help', {
            fragment: t`${fg('#666666')('[←→] Change Period  [Esc] Back')}`,
            x: centerX - 15,
            y: termHeight - 2,
            width: 30,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.helpText);

        // Setup events
        this.periodTabs.on(TabSelectElementEvents.SELECTION_CHANGED, (index: number, option: TabSelectOption) => {
            this.currentPeriod = option.value as string;
            this.updateLeaderboard();
        });

        this.periodTabs.focus();
        this.updateLeaderboard();
    }

    private drawBorder(): void {
        if (!this.leaderboardArea) return;

        const buffer = this.leaderboardArea.buffer;
        const width = this.leaderboardArea.width;
        const height = this.leaderboardArea.height;

        // Draw border
        for (let x = 0; x < width; x++) {
            buffer.setPixel(x, 0, '─', 0x666666);
            buffer.setPixel(x, height - 1, '─', 0x666666);
        }
        for (let y = 0; y < height; y++) {
            buffer.setPixel(0, y, '│', 0x666666);
            buffer.setPixel(width - 1, y, '│', 0x666666);
        }

        // Corners
        buffer.setPixel(0, 0, '╭', 0x666666);
        buffer.setPixel(width - 1, 0, '╮', 0x666666);
        buffer.setPixel(0, height - 1, '╰', 0x666666);
        buffer.setPixel(width - 1, height - 1, '╯', 0x666666);
    }

    private updateLeaderboard(): void {
        if (this.contentText) {
            this.stateContainer.remove(this.contentText.id);
        }

        // Mock leaderboard data
        const mockData = [
            { rank: 1, name: 'xXDragonSlayerXx', level: 42, score: 9999 },
            { rank: 2, name: 'NoobMaster69', level: 38, score: 8765 },
            { rank: 3, name: 'TerminalHero', level: 35, score: 7234 },
            { rank: 4, name: 'DungeonDiver', level: 33, score: 6890 },
            { rank: 5, name: 'CodeWarrior', level: 31, score: 5678 },
        ];

        const periodName = this.currentPeriod === 'HOURLY' ? 'Last Hour' :
                          this.currentPeriod === 'DAILY' ? 'Today' :
                          this.currentPeriod === 'WEEKLY' ? 'This Week' :
                          'This Month';

        let leaderboardText = t`${bold(fg('#FFFF00')(`Top Players - ${periodName}`))}\n\n`;
        leaderboardText = t`${leaderboardText}${fg('#888888')('Rank  Name                 Level  Score')}\n`;
        leaderboardText = t`${leaderboardText}${fg('#888888')('────  ──────────────────  ─────  ─────')}\n`;

        for (const entry of mockData) {
            const rankColor = entry.rank === 1 ? '#FFD700' :
                            entry.rank === 2 ? '#C0C0C0' :
                            entry.rank === 3 ? '#CD7F32' :
                            '#CCCCCC';
            
            const rank = String(entry.rank).padEnd(4);
            const name = entry.name.padEnd(18);
            const level = String(entry.level).padEnd(5);
            const score = String(entry.score);

            leaderboardText = t`${leaderboardText}${fg(rankColor)(`${rank}  ${name}  ${level}  ${score}`)}\n`;
        }

        leaderboardText = t`${leaderboardText}\n${fg('#666666')('(Demo mode - showing mock data)')}`;

        this.contentText = this.renderer.createStyledText('content', {
            fragment: leaderboardText,
            x: 15,
            y: 12,
            width: this.renderer.terminalWidth - 30,
            height: this.renderer.terminalHeight - 18,
            zIndex: 102,
        });
        this.stateContainer.add(this.contentText);
    }

    handleInput(key: ParsedKey): void {
        if (key.name === 'escape') {
            this.stateManager.pop();
        }
    }
}