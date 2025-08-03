import {BaseState} from './BaseState';
import {CharacterSelectState} from './CharacterSelectState';
import {LeaderboardState} from './LeaderboardState';
import {AuthState} from './AuthState';
import {GameplayState} from '@states/GameplayState.ts';
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
  bg,
  type ParsedKey,
  SelectElement,
  SelectElementEvents,
  type SelectOption,
  Image,
} from '../../core';
import {measureText, renderFontToFrameBuffer} from '../../core/ui/ascii.font';
import {COLORS, GAME_CONFIG} from '../constants';
import {Assets} from '../assets';

enum FocusMode {
  TABS,
  CONTENT,
}

interface DungeonOption {
  id: string;
  name: string;
  duration: number;
  keys: number;
  difficulty: string;
  color: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time: string;
  character: string;
}

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  lastPlayed: string;
  equipment: string;
  isDefault?: boolean;
}

interface GameSettings {
  soundEffects: boolean;
  backgroundMusic: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  showFPS: boolean;
  particleEffects: boolean;
  screenShake: boolean;
}

export class MainMenuState extends BaseState {
  private tabSelect: TabSelectElement | null = null;
  private contentArea: FrameBufferRenderable | null = null;
  private helpText: StyledTextRenderable | null = null;
  private currentTab: string = 'play';
  private focusMode: FocusMode = FocusMode.TABS;

  // Content elements for different tabs
  private dungeonSelect: SelectElement | null = null;
  private settingsSelect: SelectElement | null = null;
  private characterSelect: SelectElement | null = null;
  private leaderboardText: StyledTextRenderable | null = null;
  private leaderboardBuffer: FrameBufferRenderable | null = null;
  private tabTitleBuffer: FrameBufferRenderable | null = null;

  // Visual elements
  private titleText: StyledTextRenderable | null = null;
  private decorImage: Image | null = null;
  private logoImage: Image | null = null;
  private particleTimer: NodeJS.Timeout | null = null;
  private particles: Array<{x: number; y: number; char: string; color: string; life: number}> = [];
  private torchImages: Image[] = [];

  // Animation state
  private animationTime: number = 0;
  private animationFrame: NodeJS.Timeout | null = null;

  // Dungeon options
  private dungeonOptions: DungeonOption[] = [
    {
      id: '30s',
      name: '30 Second Sprint',
      duration: 30,
      keys: 3,
      difficulty: 'Easy',
      color: '#00FF00',
    },
    {
      id: '60s',
      name: '60 Second Challenge',
      duration: 60,
      keys: 5,
      difficulty: 'Normal',
      color: '#FFFF00',
    },
    {
      id: '120s',
      name: '120 Second Epic',
      duration: 120,
      keys: 8,
      difficulty: 'Hard',
      color: '#FF0000',
    },
  ];

  // Mock leaderboard data
  private leaderboardData: LeaderboardEntry[] = [
    {rank: 1, username: 'xXDragonSlayerXx', score: 9999, time: '29.5s', character: 'Wizard'},
    {rank: 2, username: 'SpeedRunner2000', score: 8750, time: '31.2s', character: 'Fighter'},
    {rank: 3, username: 'NoobMaster69', score: 7500, time: '35.8s', character: 'Wizard'},
    {rank: 4, username: 'DungeonCrawler', score: 6200, time: '42.1s', character: 'Fighter'},
    {rank: 5, username: 'TerminalHero', score: 5500, time: '48.3s', character: 'Wizard'},
    {rank: 6, username: 'CasualGamer42', score: 4800, time: '52.1s', character: 'Fighter'},
    {rank: 7, username: 'ProTerminal', score: 4200, time: '55.7s', character: 'Wizard'},
    {rank: 8, username: 'NewbieHero', score: 3500, time: '61.2s', character: 'Fighter'},
    {rank: 9, username: 'ShellMaster', score: 2800, time: '68.5s', character: 'Wizard'},
    {rank: 10, username: 'FirstTimer', score: 1200, time: '89.3s', character: 'Fighter'},
  ];

  // Character data
  private characters: Character[] = [
    {
      id: 'char-1',
      name: 'Merlin the Wise',
      class: 'Wizard',
      level: 42,
      lastPlayed: '2 hours ago',
      equipment: 'Staff of Lightning | Robe of Stars',
      isDefault: true,
    },
    {
      id: 'char-2',
      name: 'Thorin Ironfoot',
      class: 'Fighter',
      level: 38,
      lastPlayed: 'Yesterday',
      equipment: 'Dragonslayer Sword | Plate Armor',
    },
  ];

  // Settings state
  private gameSettings: GameSettings = {
    soundEffects: true,
    backgroundMusic: false,
    difficulty: 'NORMAL',
    showFPS: false,
    particleEffects: true,
    screenShake: true,
  };

  onEnter(): void {
    this.createUI();
    this.startAnimations();
  }

  onExit(): void {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.particleTimer) {
      clearInterval(this.particleTimer);
      this.particleTimer = null;
    }

    // Cleanup elements
    if (this.dungeonSelect) {
      this.dungeonSelect.blur();
    }
    if (this.settingsSelect) {
      this.settingsSelect.blur();
    }
    if (this.characterSelect) {
      this.characterSelect.blur();
    }
    if (this.logoImage) {
      this.stateContainer.remove(this.logoImage.id);
    }
    this.torchImages.forEach((torch) => {
      this.stateContainer.remove(torch.id);
    });
  }

  private createUI(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;

    // Create title with block font
    this.createBlockTitle();

    // Add decorative torches
    this.addDecorativeTorches();

    // Create tab navigation
    const tabs: TabSelectOption[] = [
      {name: 'Play', description: 'Start your adventure', value: 'play'},
      {name: 'Characters', description: 'Manage your heroes', value: 'characters'},
      {name: 'Leaderboard', description: 'Hall of fame', value: 'leaderboard'},
      {name: 'Settings', description: 'Configure options', value: 'settings'},
      {name: 'About', description: 'Game information', value: 'about'},
      {name: 'Logout', description: 'Return to login', value: 'logout'},
    ];

    this.tabSelect = new TabSelectElement('main-menu-tabs', {
      x: 2,
      y: 5,
      width: termWidth - 4,
      options: tabs,
      zIndex: 100,
      tabWidth: Math.floor((termWidth - 4) / tabs.length) - 1,
      selectedBackgroundColor: '#2255AA',
      selectedTextColor: '#FFFF00',
      textColor: '#CCCCCC',
      selectedDescriptionColor: '#FFFFFF',
      borderStyle: 'rounded',
      borderColor: '#666666',
      focusedBorderColor: this.focusMode === FocusMode.TABS ? '#00FFFF' : '#444444',
      showDescription: false,
      showUnderline: true,
      showScrollArrows: false,
      wrapSelection: true,
    });
    this.stateContainer.add(this.tabSelect);

    // Content area with fancy border
    this.contentArea = new FrameBufferRenderable(
      'content-area',
      this.renderer.lib.createOptimizedBuffer(termWidth - 4, termHeight - 14, true),
      {
        x: 2,
        y: 9,
        width: termWidth - 4,
        height: termHeight - 14,
        zIndex: 99,
      },
    );
    this.stateContainer.add(this.contentArea);
    this.drawContentBorder();

    // Help text
    this.updateHelpText();

    // Setup event handlers
    this.setupEventHandlers();

    // Show initial content
    this.showPlayContent();
    this.tabSelect.focus();
  }

  private updateHelpText(): void {
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;

    if (this.helpText) {
      this.stateContainer.remove(this.helpText.id);
    }

    const helpMessage =
      this.focusMode === FocusMode.TABS
        ? '[←→] Navigate Tabs  [↓] Enter Section  [Enter] Select  [Esc] Logout'
        : '[↑↓] Navigate  [Enter] Select  [Esc/↑] Back to Tabs';

    this.helpText = this.renderer.createStyledText('help-text', {
      fragment: t`${fg('#888888')(helpMessage)}`,
      x: Math.floor((termWidth - helpMessage.length) / 2),
      y: termHeight - 2,
      width: helpMessage.length,
      height: 1,
      zIndex: 100,
    });
    this.stateContainer.add(this.helpText);
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
          if (this.focusMode === FocusMode.TABS) {
            this.handleTabSelect(option.value as string);
          }
        },
      );
    }
  }

  private drawContentBorder(): void {
    if (!this.contentArea) return;

    const buffer = this.contentArea.frameBuffer;
    const width = this.contentArea.width;
    const height = this.contentArea.height;
    const borderColor = RGBA.fromHex(0x00aaff);
    const bgColor = RGBA.fromHex(0x000011);

    // Draw fancy double-line border
    buffer.setCell(0, 0, '╔', borderColor, bgColor);
    buffer.setCell(width - 1, 0, '╗', borderColor, bgColor);
    buffer.setCell(0, height - 1, '╚', borderColor, bgColor);
    buffer.setCell(width - 1, height - 1, '╝', borderColor, bgColor);

    for (let x = 1; x < width - 1; x++) {
      buffer.setCell(x, 0, '═', borderColor, bgColor);
      buffer.setCell(x, height - 1, '═', borderColor, bgColor);
    }

    for (let y = 1; y < height - 1; y++) {
      buffer.setCell(0, y, '║', borderColor, bgColor);
      buffer.setCell(width - 1, y, '║', borderColor, bgColor);
    }

    // Add corner decorations
    if (width > 20 && height > 10) {
      const decorChars = ['◆', '◇', '◈'];
      const decorPositions = [
        {x: 10, y: 0},
        {x: width - 11, y: 0},
        {x: 10, y: height - 1},
        {x: width - 11, y: height - 1},
      ];

      decorPositions.forEach((pos, i) => {
        const char = decorChars[i % decorChars.length];
        buffer.setCell(pos.x, pos.y, char, RGBA.fromHex(0xffff00), bgColor);
      });
    }
  }

  private updateContent(): void {
    // Clear existing content elements
    this.clearContentElements();

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

  private clearContentElements(): void {
    if (this.dungeonSelect) {
      this.dungeonSelect.blur();
      this.stateContainer.remove(this.dungeonSelect.id);
      this.dungeonSelect = null;
    }
    if (this.settingsSelect) {
      this.settingsSelect.blur();
      this.stateContainer.remove(this.settingsSelect.id);
      this.settingsSelect = null;
    }
    if (this.characterSelect) {
      this.characterSelect.blur();
      this.stateContainer.remove(this.characterSelect.id);
      this.characterSelect = null;
    }
    if (this.leaderboardText) {
      this.stateContainer.remove(this.leaderboardText.id);
      this.leaderboardText = null;
    }
    if (this.leaderboardBuffer) {
      this.stateContainer.remove(this.leaderboardBuffer.id);
      this.leaderboardBuffer = null;
    }
    if (this.logoImage) {
      this.stateContainer.remove(this.logoImage.id);
      this.logoImage = null;
    }

    // Clear any other text elements
    const elementsToRemove = [
      'play-content',
      'characters-content',
      'settings-content',
      'about-content',
      'stats-text',
      'news-text',
    ];
    elementsToRemove.forEach((id) => {
      if (this.stateContainer.has(id)) {
        this.stateContainer.remove(id);
      }
    });
  }

  private showPlayContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    // Create dungeon selection menu
    const dungeonSelectOptions: SelectOption[] = this.dungeonOptions.map((d) => ({
      name: d.name,
      description: `${d.duration}s | ${d.keys} keys | ${d.difficulty}`,
      value: d.id,
    }));

    this.dungeonSelect = new SelectElement('dungeon-select', {
      x: centerX - 25,
      y: centerY - 4,
      width: 50,
      height: 10,
      options: dungeonSelectOptions,
      zIndex: 103,
      backgroundColor: '#001122',
      selectedBackgroundColor: '#334455',
      selectedTextColor: '#FFFF00',
      textColor: '#CCCCCC',
      selectedDescriptionColor: '#FFFFFF',
      descriptionColor: '#888888',
      borderStyle: 'rounded',
      borderColor: '#666666',
      focusedBorderColor: this.focusMode === FocusMode.CONTENT ? '#00FFFF' : '#444444',
      showDescription: true,
      showScrollIndicator: false,
      wrapSelection: true,
      title: '⚔ Choose Your Dungeon ⚔',
      titleAlignment: 'center',
    });

    this.dungeonSelect.on(
      SelectElementEvents.ITEM_SELECTED,
      (index: number, option: SelectOption) => {
        const dungeon = this.dungeonOptions.find((d) => d.id === option.value);
        if (dungeon) {
          this.startDungeon(dungeon);
        }
      },
    );

    this.stateContainer.add(this.dungeonSelect);

    // Player stats with animation
    const statsText = this.renderer.createStyledText('stats-text', {
      fragment: t`${bold(fg('#00FF00')('╔══ Your Stats ══╗'))}
${fg('#CCCCCC')('║ Level:')} ${fg('#FFFF00')('42')}      ${fg('#CCCCCC')('║')}
${fg('#CCCCCC')('║ XP:')} ${fg('#FFFF00')('1337/2000')}  ${fg('#CCCCCC')('║')}
${fg('#CCCCCC')('║ Wins:')} ${fg('#00FF00')('17')}       ${fg('#CCCCCC')('║')}
${fg('#CCCCCC')('║ Best:')} ${fg('#FF00FF')('28.3s')}   ${fg('#CCCCCC')('║')}
${fg('#00FF00')('╚════════════════╝')}`,
      x: 5,
      y: 11,
      width: 20,
      height: 7,
      zIndex: 101,
    });
    this.stateContainer.add(statsText);

    // News with pulsing effect
    const newsText = this.renderer.createStyledText('news-text', {
      fragment: t`${bold(fg('#FF00FF')('◆ Latest Updates ◆'))}
${fg('#00FFFF')('▸')} ${fg('#AAAAAA')('New boss: The Terminal Terror!')}
${fg('#00FFFF')('▸')} ${fg('#AAAAAA')('Wizard class buffed +15% damage')}
${fg('#00FFFF')('▸')} ${fg('#AAAAAA')('Weekend event: Double XP!')}
${fg('#00FFFF')('▸')} ${fg('#AAAAAA')('Season 2 starts next week')}`,
      x: this.renderer.terminalWidth - 40,
      y: 11,
      width: 35,
      height: 6,
      zIndex: 101,
    });
    this.stateContainer.add(newsText);

    // Focus on dungeon select if in content mode
    if (this.focusMode === FocusMode.CONTENT && this.dungeonSelect) {
      this.dungeonSelect.focus();
    }
  }

  private showCharactersContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    // Create character selection list
    const characterOptions: SelectOption[] = [
      ...this.characters.map((char) => ({
        name: `${char.isDefault ? '★ ' : '  '}${char.name} (${char.class} Lv.${char.level})`,
        description: `${char.equipment} | Last: ${char.lastPlayed}`,
        value: char.id,
      })),
      {
        name: '+ Create New Character',
        description: "Start a new hero's journey",
        value: 'create-new',
      },
    ];

    this.characterSelect = new SelectElement('character-select', {
      x: centerX - 30,
      y: centerY - 6,
      width: 60,
      height: 14,
      options: characterOptions,
      zIndex: 103,
      backgroundColor: '#001122',
      selectedBackgroundColor: '#334455',
      selectedTextColor: '#FFFF00',
      textColor: '#CCCCCC',
      selectedDescriptionColor: '#FFFFFF',
      descriptionColor: '#888888',
      borderStyle: 'rounded',
      borderColor: '#666666',
      focusedBorderColor: this.focusMode === FocusMode.CONTENT ? '#00FFFF' : '#444444',
      showDescription: true,
      showScrollIndicator: false,
      wrapSelection: true,
      title: '⚔ Your Heroes ⚔',
      titleAlignment: 'center',
    });

    this.characterSelect.on(
      SelectElementEvents.ITEM_SELECTED,
      (index: number, option: SelectOption) => {
        if (option.value === 'create-new') {
          this.stateManager.push(new CharacterSelectState());
        } else {
          // Set as default character
          this.characters = this.characters.map((char) => ({
            ...char,
            isDefault: char.id === option.value,
          }));
          // Refresh the display
          this.updateContent();
        }
      },
    );

    this.stateContainer.add(this.characterSelect);

    // Focus if in content mode
    if (this.focusMode === FocusMode.CONTENT && this.characterSelect) {
      this.characterSelect.focus();
    }
  }

  private showLeaderboardContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    // Create leaderboard with block font title
    const titleText = 'LEADERBOARD';
    let textSize = measureText({text: titleText, font: 'block'});
    const titleWidth = textSize.width; // Add padding
    const titleHeight = textSize.height; // Add padding

    this.leaderboardBuffer = this.renderer.createFrameBuffer('leaderboard-buffer', {
      width: titleWidth + 10,
      height: this.renderer.terminalHeight - 30,
      x: centerX - titleWidth / 2,
      y: centerY - 12,
      zIndex: 101,
    });

    // Clear buffer
    this.leaderboardBuffer.frameBuffer.clear(RGBA.fromInts(0, 0, 0, 0));

    // Render block font title
    renderFontToFrameBuffer(this.leaderboardBuffer.frameBuffer, {
      text: titleText,
      x: 0,
      y: 0,
      fg: [RGBA.fromInts(255, 215, 0, 255), RGBA.fromInts(255, 180, 0, 255)],
      bg: RGBA.fromInts(0, 0, 0, 0),
      font: 'block',
    });

    // Add leaderboard entries below the title
    let yOffset = titleHeight + 2;

    // Headers
    const headerColor = RGBA.fromInts(136, 136, 136, 255);
    const headerText = 'Rank    Player                Score    Time      Class';
    for (let i = 0; i < headerText.length; i++) {
      this.leaderboardBuffer.frameBuffer.setCell(
        10 + i,
        yOffset,
        headerText[i],
        headerColor,
        RGBA.fromInts(0, 0, 0, 0),
      );
    }
    yOffset++;

    // Separator
    const sepColor = RGBA.fromInts(100, 100, 100, 255);
    for (let i = 0; i < 60; i++) {
      this.leaderboardBuffer.frameBuffer.setCell(
        10 + i,
        yOffset,
        '─',
        sepColor,
        RGBA.fromInts(0, 0, 0, 0),
      );
    }
    yOffset++;

    // Entries
    this.leaderboardData.forEach((entry, index) => {
      const rankColor =
        index === 0
          ? RGBA.fromInts(255, 215, 0, 255)
          : index === 1
            ? RGBA.fromInts(192, 192, 192, 255)
            : index === 2
              ? RGBA.fromInts(205, 127, 50, 255)
              : RGBA.fromInts(200, 200, 200, 255);

      const rankText = `${String(entry.rank).padStart(2)}.`;
      const nameText = entry.username.padEnd(20);
      const scoreText = String(entry.score).padStart(6);
      const timeText = entry.time.padStart(8);
      const classText = entry.character.padEnd(8);

      // Render rank
      for (let i = 0; i < rankText.length; i++) {
        this.leaderboardBuffer.frameBuffer.setCell(
          10 + i,
          yOffset,
          rankText[i],
          rankColor,
          RGBA.fromInts(0, 0, 0, 0),
        );
      }

      // Render name
      for (let i = 0; i < nameText.length; i++) {
        this.leaderboardBuffer.frameBuffer.setCell(
          18 + i,
          yOffset,
          nameText[i],
          RGBA.fromInts(255, 255, 255, 255),
          RGBA.fromInts(0, 0, 0, 0),
        );
      }

      // Render score
      for (let i = 0; i < scoreText.length; i++) {
        this.leaderboardBuffer.frameBuffer.setCell(
          40 + i,
          yOffset,
          scoreText[i],
          RGBA.fromInts(0, 255, 0, 255),
          RGBA.fromInts(0, 0, 0, 0),
        );
      }

      // Render time
      for (let i = 0; i < timeText.length; i++) {
        this.leaderboardBuffer.frameBuffer.setCell(
          48 + i,
          yOffset,
          timeText[i],
          RGBA.fromInts(0, 255, 255, 255),
          RGBA.fromInts(0, 0, 0, 0),
        );
      }

      // Render class
      for (let i = 0; i < classText.length; i++) {
        this.leaderboardBuffer.frameBuffer.setCell(
          58 + i,
          yOffset,
          classText[i],
          RGBA.fromInts(150, 150, 255, 255),
          RGBA.fromInts(0, 0, 0, 0),
        );
      }

      yOffset++;
    });

    this.stateContainer.add(this.leaderboardBuffer);
  }

  private showSettingsContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    const settingsOptions: SelectOption[] = [
      {
        name: 'Sound Effects',
        description: `Currently: ${this.gameSettings.soundEffects ? 'ON' : 'OFF'}`,
        value: 'sound',
      },
      {
        name: 'Background Music',
        description: `Currently: ${this.gameSettings.backgroundMusic ? 'ON' : 'OFF'}`,
        value: 'music',
      },
      {
        name: 'Difficulty',
        description: `Currently: ${this.gameSettings.difficulty}`,
        value: 'difficulty',
      },
      {
        name: 'Show FPS Counter',
        description: `Currently: ${this.gameSettings.showFPS ? 'ON' : 'OFF'}`,
        value: 'fps',
      },
      {
        name: 'Particle Effects',
        description: `Currently: ${this.gameSettings.particleEffects ? 'ON' : 'OFF'}`,
        value: 'particles',
      },
      {
        name: 'Screen Shake',
        description: `Currently: ${this.gameSettings.screenShake ? 'ON' : 'OFF'}`,
        value: 'shake',
      },
    ];

    this.settingsSelect = new SelectElement('settings-select', {
      x: centerX - 25,
      y: centerY - 6,
      width: 50,
      height: 14,
      options: settingsOptions,
      zIndex: 103,
      backgroundColor: '#001122',
      selectedBackgroundColor: '#334455',
      selectedTextColor: '#FFFF00',
      textColor: '#CCCCCC',
      selectedDescriptionColor: '#FFFFFF',
      descriptionColor: '#888888',
      borderStyle: 'rounded',
      borderColor: '#666666',
      focusedBorderColor: this.focusMode === FocusMode.CONTENT ? '#00FFFF' : '#444444',
      showDescription: true,
      showScrollIndicator: false,
      wrapSelection: true,
      title: '⚙ Game Settings ⚙',
      titleAlignment: 'center',
    });

    this.settingsSelect.on(
      SelectElementEvents.ITEM_SELECTED,
      (index: number, option: SelectOption) => {
        // Toggle settings
        switch (option.value) {
          case 'sound':
            this.gameSettings.soundEffects = !this.gameSettings.soundEffects;
            break;
          case 'music':
            this.gameSettings.backgroundMusic = !this.gameSettings.backgroundMusic;
            break;
          case 'difficulty':
            const difficulties: Array<'EASY' | 'NORMAL' | 'HARD'> = ['EASY', 'NORMAL', 'HARD'];
            const currentIndex = difficulties.indexOf(this.gameSettings.difficulty);
            this.gameSettings.difficulty = difficulties[(currentIndex + 1) % 3];
            break;
          case 'fps':
            this.gameSettings.showFPS = !this.gameSettings.showFPS;
            break;
          case 'particles':
            this.gameSettings.particleEffects = !this.gameSettings.particleEffects;
            break;
          case 'shake':
            this.gameSettings.screenShake = !this.gameSettings.screenShake;
            break;
        }
        // Refresh the display to show updated values
        this.updateContent();
      },
    );

    this.stateContainer.add(this.settingsSelect);

    if (this.focusMode === FocusMode.CONTENT && this.settingsSelect) {
      this.settingsSelect.focus();
    }
  }

  private showAboutContent(): void {
    const centerX = Math.floor(this.renderer.terminalWidth / 2);
    const centerY = Math.floor(this.renderer.terminalHeight / 2);

    // Add logo
    if (Assets.logo) {
      this.logoImage = new Image('about-logo', this.renderer, Assets.logo, 10, centerY - 15, {
        scale: 1,
        zIndex: 102,
        visible: true,
        animation: 'pulse',
        animationDuration: 2000,
      });
      this.stateContainer.add(this.logoImage);
    }

    const aboutText = this.renderer.createStyledText('about-content', {
      fragment: t`${bold(fg('#00FFFF')('╔═══════════════════════════════════════╗'))}
${bold(fg('#00FFFF')('║        S H E L L Q U E S T . S H      ║'))}
${bold(fg('#00FFFF')('╚═══════════════════════════════════════╝'))}
${fg('#666666')(`                Version ${GAME_CONFIG.VERSION}`)}

${fg('#FFFF00')('A terminal-based dungeon crawler')}
${fg('#CCCCCC')('for engineers and terminal enthusiasts.')}

${fg('#00FF00')('Features:')}
${fg('#888888')('• Real-time combat with ASCII graphics')}
${fg('#888888')('• Procedurally generated dungeons')}
${fg('#888888')('• Character progression & leaderboards')}
${fg('#888888')('• Cross-platform terminal gaming')}

${fg('#FF00FF')('Created with ❤ using OpenTUI engine')}
${fg('#666666')('© 2024 shellquest.sh')}

${fg('#00AAFF')('github.com/dested/shellquest.sh')}`,
      x: centerX - 22,
      y: centerY - 10,
      width: 44,
      height: 20,
      zIndex: 101,
    });
    this.stateContainer.add(aboutText);
  }

  private handleTabSelect(tab: string): void {
    switch (tab) {
      case 'logout':
        this.stateManager.replace(new AuthState(), {
          type: 'pixelate',
          duration: 1000,
        });
        break;
      default:
        // For other tabs, enter content mode if there's interactive content
        if (tab === 'play' || tab === 'settings') {
          this.focusMode = FocusMode.CONTENT;
          this.updateHelpText();
          this.updateContent();
        }
        break;
    }
  }

  private startDungeon(dungeon: DungeonOption): void {
    // Start game with selected dungeon configuration
    this.stateManager.replace(new GameplayState(), {
      type: 'spiral',
      duration: 1500,
    });
  }

  handleInput(key: ParsedKey): void {
    // Handle escape
    if (key.name === 'escape') {
      if (this.focusMode === FocusMode.CONTENT) {
        // Return to tab navigation
        this.focusMode = FocusMode.TABS;
        if (this.dungeonSelect) this.dungeonSelect.blur();
        if (this.settingsSelect) this.settingsSelect.blur();
        if (this.tabSelect) {
          this.tabSelect.focus();
          // Update border color to show tabs are focused
          if (this.tabSelect) {
            this.tabSelect.focusedBorderColor = RGBA.fromHex('#00FFFF');
          }
        }
        this.updateHelpText();
        this.updateContent();
      } else {
        // Logout
        this.stateManager.replace(new AuthState(), {
          type: 'pixelate',
          duration: 1000,
        });
      }
      return;
    }

    // Handle navigation based on focus mode
    if (this.focusMode === FocusMode.TABS) {
      // In tab mode
      if (key.name === 'down') {
        // Enter content mode if there's interactive content
        if (
          this.currentTab === 'play' ||
          this.currentTab === 'settings' ||
          this.currentTab === 'characters'
        ) {
          this.focusMode = FocusMode.CONTENT;
          this.updateHelpText();
          this.updateContent();
        }
      }
    } else {
      // In content mode
      if (key.name === 'up') {
        // Check if we're at the top of a select element
        if (this.currentTab === 'play' && this.dungeonSelect) {
          const selectState = (this.dungeonSelect as any).selectedIndex;
          if (selectState === 0) {
            // Return to tabs if at top of list
            this.focusMode = FocusMode.TABS;
            this.dungeonSelect.blur();
            if (this.tabSelect) this.tabSelect.focus();
            this.updateHelpText();
            this.updateContent();
          }
        } else if (this.currentTab === 'settings' && this.settingsSelect) {
          const selectState = (this.settingsSelect as any).selectedIndex;
          if (selectState === 0) {
            // Return to tabs if at top of list
            this.focusMode = FocusMode.TABS;
            this.settingsSelect.blur();
            if (this.tabSelect) this.tabSelect.focus();
            this.updateHelpText();
            this.updateContent();
          }
        } else if (this.currentTab === 'characters' && this.characterSelect) {
          const selectState = (this.characterSelect as any).selectedIndex;
          if (selectState === 0) {
            // Return to tabs if at top of list
            this.focusMode = FocusMode.TABS;
            this.characterSelect.blur();
            if (this.tabSelect) this.tabSelect.focus();
            this.updateHelpText();
            this.updateContent();
          }
        }
      }
    }
  }

  private startAnimations(): void {
    // Create particle effect timer
    this.particleTimer = setInterval(() => {
      // Add random particles
      if (Math.random() < 0.3 && this.particles.length < 20) {
        const chars = ['✦', '✧', '⋆', '∘', '･', '◦'];
        const colors = ['#00FFFF', '#FFFF00', '#FF00FF', '#00FF00'];
        this.particles.push({
          x: Math.random() * this.renderer.terminalWidth,
          y: 0,
          char: chars[Math.floor(Math.random() * chars.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 100,
        });
      }

      // Update particles
      this.particles = this.particles.filter((p) => {
        p.y += 0.5;
        p.life -= 2;
        return p.life > 0 && p.y < this.renderer.terminalHeight;
      });

      // Render particles
      this.renderParticles();
    }, 100);

    // Animation loop for pulsing effects
    this.animationFrame = setInterval(() => {
      this.animationTime += 0.05;

      // Update title color with rainbow effect
      if (this.titleText) {
        const hue = (this.animationTime * 60) % 360;
        const color = this.hslToHex(hue, 70, 50);
        this.titleText.fragment = t`${bold(fg(color)('═══════════════════════════════════════════════════════════════════════════'))}
${bold(fg('#FFFF00')('                           S H E L L Q U E S T'))}
${bold(fg(color)('═══════════════════════════════════════════════════════════════════════════'))}`;
      }
    }, 50);
  }

  private renderParticles(): void {
    if (!this.contentArea) return;

    const buffer = this.contentArea.frameBuffer;

    // Clear previous particles (would need proper tracking in real implementation)
    // For now, just redraw the border
    this.drawContentBorder();

    // Draw particles
    this.particles.forEach((p) => {
      const x = Math.floor(p.x) - this.contentArea.x;
      const y = Math.floor(p.y) - this.contentArea.y;

      if (x > 0 && x < buffer.width - 1 && y > 0 && y < buffer.height - 1) {
        const alpha = p.life / 100;
        const color = RGBA.fromHex(parseInt(p.color.slice(1), 16));
        color.buffer[3] = alpha;
        buffer.setCell(x, y, p.char, color, RGBA.fromValues(0, 0, 0, 0));
      }
    });
  }

  private hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;

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

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private createBlockTitle(): void {
    const termWidth = this.renderer.terminalWidth;
    const titleText = 'SHELLQUEST';
    const titleHeight = 5;
    const titleWidth = 80;

    this.tabTitleBuffer = this.renderer.createFrameBuffer('tab-title', {
      width: titleWidth,
      height: titleHeight,
      x: Math.floor((termWidth - titleWidth) / 2),
      y: 1,
      zIndex: 102,
    });

    this.tabTitleBuffer.frameBuffer.clear(RGBA.fromInts(0, 0, 0, 0));

    renderFontToFrameBuffer(this.tabTitleBuffer.frameBuffer, {
      text: titleText,
      x: Math.floor((titleWidth - 60) / 2),
      y: 0,
      fg: [RGBA.fromInts(0, 255, 255, 255), RGBA.fromInts(255, 255, 0, 255)],
      bg: RGBA.fromInts(0, 0, 0, 0),
      font: 'block',
    });

    this.stateContainer.add(this.tabTitleBuffer);
  }

  private addDecorativeTorches(): void {
    // Add placeholder torch images in corners
    const termWidth = this.renderer.terminalWidth;
    const termHeight = this.renderer.terminalHeight;

    // Top-left torch
    const torch1 = new Image(
      'torch-1',
      this.renderer,
      Assets.torch /*PLACEHOLDER: ANIMATED TORCH*/,
      10,
      termHeight - 12,
      {
        scale: 1,
        zIndex: 98,
        visible: true,
        animation: 'shimmer',
        animationDuration: 1000,
      },
    );
    this.torchImages.push(torch1);
    this.stateContainer.add(torch1);

    // Top-right torch
    const torch2 = new Image(
      'torch-2',
      this.renderer,
      Assets.torch /*PLACEHOLDER: ANIMATED TORCH*/,
      termWidth - 20,
      termHeight - 12,
      {
        scale: 1,
        zIndex: 98,
        visible: true,
        animation: 'shimmer',
        animationDuration: 1000,
        animationDelay: 500,
      },
    );
    this.torchImages.push(torch2);
    this.stateContainer.add(torch2);
  }
}
