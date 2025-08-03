import {BaseState} from './BaseState';
import {CharacterSelectState} from './CharacterSelectState';
import {LeaderboardState} from './LeaderboardState';
import {AuthState} from './AuthState';
import {
  TabSelectElement,
  TabSelectElementEvents,
  type TabSelectOption,
  StyledTextRenderable,
  FrameBufferRenderable,
  OptimizedBuffer,
  RGBA,
  t,
  bold,
  fg,
  type ParsedKey,
} from '../../core';
import {COLORS, GAME_CONFIG} from '../constants';
import {GameplayState} from '@states/GameplayState.ts';

export class MainMenuState extends BaseState {
  private tabSelect: TabSelectElement | null = null;
  private contentArea: FrameBufferRenderable | null = null;
  private welcomeText: StyledTextRenderable | null = null;
  private statsText: StyledTextRenderable | null = null;
  private newsText: StyledTextRenderable | null = null;
  private helpText: StyledTextRenderable | null = null;
  private currentTab: string = 'play';

  onEnter(): void {
    this.createUI();
  }

  onExit(): void {
    // Cleanup handled by BaseState
  }

  private createUI(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;

    // Create tab navigation
    const tabs: TabSelectOption[] = [
      {name: 'Play', description: 'Start your adventure', value: 'play'},
      {name: 'Characters', description: 'Manage your characters', value: 'characters'},
      {name: 'Leaderboard', description: 'View rankings', value: 'leaderboard'},
      {name: 'Settings', description: 'Configure game options', value: 'settings'},
      {name: 'About', description: 'Game information', value: 'about'},
      {name: 'Logout', description: 'Return to login', value: 'logout'},
    ];

    this.tabSelect = new TabSelectElement('main-menu-tabs', {
      x: 2,
      y: 2,
      width: termWidth - 4,
      options: tabs,
      zIndex: 100,
      tabWidth: Math.floor((termWidth - 4) / tabs.length) - 1,
      selectedBackgroundColor: '#334455',
      selectedTextColor: '#FFFF00',
      textColor: '#CCCCCC',
      selectedDescriptionColor: '#FFFFFF',
      borderStyle: 'rounded',
      borderColor: '#666666',
      focusedBorderColor: '#00AAFF',
      showDescription: false,
      showUnderline: true,
      showScrollArrows: false,
      wrapSelection: true,
    });
    this.stateContainer.add(this.tabSelect);

    // Content area
    this.contentArea = new FrameBufferRenderable(
      'content-area',
      this.renderer.lib.createOptimizedBuffer(termWidth - 4, termHeight - 10, true),
      {
        x: 2,
        y: 6,
        width: termWidth - 4,
        height: termHeight - 10,
        zIndex: 99,
      },
    );
    this.stateContainer.add(this.contentArea);
    this.drawContentBorder();

    // Help text
    this.helpText = this.renderer.createStyledText('help-text', {
      fragment: t`${fg('#666666')('[←→] Navigate Tabs  [Enter] Select  [Esc] Logout')}`,
      x: Math.floor((termWidth - 50) / 2),
      y: termHeight - 2,
      width: 50,
      height: 1,
      zIndex: 100,
    });
    this.stateContainer.add(this.helpText);

    // Setup event handlers
    this.setupEventHandlers();

    // Show initial content
    this.showPlayContent();
    this.tabSelect.focus();
  }

  private setupEventHandlers(): void {
    if (this.tabSelect) {
      this.tabSelect.on(
        TabSelectElementEvents.SELECTION_CHANGED,
        (index: number, option: TabSelectOption) => {
          this.currentTab = option.value as string;
          this.updateContent();
        },
      );

      this.tabSelect.on(
        TabSelectElementEvents.ITEM_SELECTED,
        (index: number, option: TabSelectOption) => {
          this.handleTabSelect(option.value as string);
        },
      );
    }
  }

  private drawContentBorder(): void {
    if (!this.contentArea) return;

    const buffer = this.contentArea.frameBuffer;
    const width = this.contentArea.width;
    const height = this.contentArea.height;
    const borderColor = RGBA.fromHex(0x666666);
    const bgColor = RGBA.fromHex(0x000000);

    // Draw rounded border
    buffer.setCell(0, 0, '╭', borderColor, bgColor);
    buffer.setCell(width - 1, 0, '╮', borderColor, bgColor);
    buffer.setCell(0, height - 1, '╰', borderColor, bgColor);
    buffer.setCell(width - 1, height - 1, '╯', borderColor, bgColor);

    for (let x = 1; x < width - 1; x++) {
      buffer.setCell(x, 0, '─', borderColor, bgColor);
      buffer.setCell(x, height - 1, '─', borderColor, bgColor);
    }

    for (let y = 1; y < height - 1; y++) {
      buffer.setCell(0, y, '│', borderColor, bgColor);
      buffer.setCell(width - 1, y, '│', borderColor, bgColor);
    }
  }

  private updateContent(): void {
    // Clear existing content texts
    if (this.welcomeText) {
      this.stateContainer.remove(this.welcomeText.id);
      this.welcomeText = null;
    }
    if (this.statsText) {
      this.stateContainer.remove(this.statsText.id);
      this.statsText = null;
    }
    if (this.newsText) {
      this.stateContainer.remove(this.newsText.id);
      this.newsText = null;
    }

    // Show content based on current tab
    switch (this.currentTab) {
      case 'play':
        this.showPlayContent();
        break;
      case 'characters':
        this.showCharactersContent();
        break;
      case 'leaderboard':
        this.showLeaderboardContent();
        break;
      case 'settings':
        this.showSettingsContent();
        break;
      case 'about':
        this.showAboutContent();
        break;
    }
  }

  private showPlayContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    // Welcome message
    this.welcomeText = this.renderer.createStyledText('welcome-text', {
      fragment: t`${bold(fg('#00FFFF')('Welcome to shellquest.sh!'))}

${fg('#FFFFFF')('Choose your dungeon type:')}

${fg('#FFFF00')('[1]')} ${fg('#CCCCCC')('30 Second Dungeon')}
    ${fg('#888888')('Quick challenge - 3 keys to collect')}
    
${fg('#FFFF00')('[2]')} ${fg('#CCCCCC')('60 Second Dungeon')}
    ${fg('#888888')('Standard run - 5 keys to collect')}
    
${fg('#FFFF00')('[3]')} ${fg('#CCCCCC')('120 Second Dungeon')}
    ${fg('#888888')('Epic adventure - 8 keys to collect')}

${fg('#666666')('Press a number key to start...')}`,
      x: centerX - 20,
      y: centerY - 8,
      width: 40,
      height: 16,
      zIndex: 101,
    });
    this.stateContainer.add(this.welcomeText);

    // Player stats
    this.statsText = this.renderer.createStyledText('stats-text', {
      fragment: t`${bold(fg('#00FF00')('Your Stats'))}
${fg('#CCCCCC')('Level:')} ${fg('#FFFF00')('1')}
${fg('#CCCCCC')('Experience:')} ${fg('#FFFF00')('0 / 100')}
${fg('#CCCCCC')('Dungeons Cleared:')} ${fg('#FFFF00')('0')}
${fg('#CCCCCC')('Best Time:')} ${fg('#FFFF00')('--:--')}`,
      x: 5,
      y: 8,
      width: 30,
      height: 6,
      zIndex: 101,
    });
    this.stateContainer.add(this.statsText);

    // News/Updates
    this.newsText = this.renderer.createStyledText('news-text', {
      fragment: t`${bold(fg('#FF00FF')('Latest News'))}
${fg('#888888')('• New boss added to level 5!')}
${fg('#888888')('• Balance changes to wizard class')}
${fg('#888888')('• Weekly tournament starts Monday')}`,
      x: this.renderer.terminalWidth - 35,
      y: 8,
      width: 30,
      height: 5,
      zIndex: 101,
    });
    this.stateContainer.add(this.newsText);
  }

  private showCharactersContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    this.welcomeText = this.renderer.createStyledText('characters-content', {
      fragment: t`${bold(fg('#00FFFF')('Your Characters'))}

${fg('#FFFF00')('No characters yet!')}

${fg('#CCCCCC')('Press')} ${fg('#00FF00')('[C]')} ${fg('#CCCCCC')('to create a new character')}`,
      x: centerX - 20,
      y: centerY - 4,
      width: 40,
      height: 8,
      zIndex: 101,
    });
    this.stateContainer.add(this.welcomeText);
  }

  private showLeaderboardContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    this.welcomeText = this.renderer.createStyledText('leaderboard-content', {
      fragment: t`${bold(fg('#00FFFF')('Leaderboard'))}

${fg('#CCCCCC')('Loading rankings...')}

${fg('#666666')('(Demo mode - no server connection)')}`,
      x: centerX - 20,
      y: centerY - 4,
      width: 40,
      height: 8,
      zIndex: 101,
    });
    this.stateContainer.add(this.welcomeText);
  }

  private showSettingsContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    this.welcomeText = this.renderer.createStyledText('settings-content', {
      fragment: t`${bold(fg('#00FFFF')('Settings'))}

${fg('#CCCCCC')('Sound:')} ${fg('#00FF00')('[ON]')} ${fg('#666666')('OFF')}
${fg('#CCCCCC')('Music:')} ${fg('#666666')('ON')} ${fg('#FF0000')('[OFF]')}
${fg('#CCCCCC')('Difficulty:')} ${fg('#FFFF00')('[NORMAL]')}
${fg('#CCCCCC')('Show FPS:')} ${fg('#666666')('ON')} ${fg('#FF0000')('[OFF]')}

${fg('#666666')('Use arrow keys to change settings')}`,
      x: centerX - 20,
      y: centerY - 6,
      width: 40,
      height: 12,
      zIndex: 101,
    });
    this.stateContainer.add(this.welcomeText);
  }

  private showAboutContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    this.welcomeText = this.renderer.createStyledText('about-content', {
      fragment: t`${bold(fg('#00FFFF')('shellquest.sh'))}
${fg('#666666')(`Version ${GAME_CONFIG.VERSION}`)}

${fg('#CCCCCC')('A terminal-based dungeon crawler')}
${fg('#CCCCCC')('for engineers and terminal enthusiasts.')}

${fg('#888888')('Created with OpenTUI engine')}
${fg('#888888')('© 2024 shellquest.sh')}

${fg('#FFFF00')('GitHub:')} ${fg('#00AAFF')('github.com/dested/shellquest.sh')}`,
      x: centerX - 20,
      y: centerY - 8,
      width: 40,
      height: 16,
      zIndex: 101,
    });
    this.stateContainer.add(this.welcomeText);
  }

  private handleTabSelect(tab: string): void {
    switch (tab) {
      case 'play':
        // In play tab, Enter starts a game (for now just stay)
        break;
      case 'characters':
        this.stateManager.push(new CharacterSelectState());
        break;
      case 'leaderboard':
        this.stateManager.push(new LeaderboardState());
        break;
      case 'logout':
        this.stateManager.replace(new AuthState(), {
          type: 'pixelate',
          duration: 1000,
        });
        break;
    }
  }

  handleInput(key: ParsedKey): void {
    // Handle escape
    if (key.name === 'escape') {
      this.stateManager.replace(new AuthState(),{
        type: 'pixelate',
        duration: 1000,
      });
      return;
    }

    // Handle number keys for quick dungeon selection
    if (this.currentTab === 'play') {
      if (key.name === '1') {
        // Start 30 second dungeon
        this.stateManager.replace(new GameplayState(),{
          type: 'pixelate',
          duration: 2000,
        })
        // TODO: Start game with 30 second config
      } else if (key.name === '2') {
        // Start 60 second dungeon
        this.stateManager.replace(new GameplayState(),{
          type: 'pixelate',
          duration: 2000,
        })

        // TODO: Start game with 60 second config
      } else if (key.name === '3') {
        // Start 120 second dungeon
        this.stateManager.replace(new GameplayState(),{
          type: 'pixelate',
          duration: 2000,
        })
        // TODO: Start game with 120 second config
      }
    }

    // Handle C for character creation
    if (this.currentTab === 'characters' && key.name === 'c') {
      this.stateManager.push(new CharacterSelectState());
    }
  }
}
