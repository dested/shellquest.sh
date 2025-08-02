import { BaseState } from './BaseState';
import { CharacterCreateState } from './CharacterCreateState';
import { GameplayState } from './GameplayState';
import {
    SelectElement,
    SelectElementEvents,
    type SelectOption,
    StyledTextRenderable,
    t,
    bold,
    fg,
    type ParsedKey,
} from '../../core';
import { COLORS, GAME_CONFIG } from '../constants';

export class CharacterSelectState extends BaseState {
    private characterList: SelectElement | null = null;
    private titleText: StyledTextRenderable | null = null;
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
            fragment: t`${bold(fg('#00FFFF')('Character Selection'))}`,
            x: centerX - 10,
            y: 5,
            width: 20,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.titleText);

        // Character list (empty for now)
        const characters: SelectOption[] = [
            { name: 'Create New Character', description: 'Start a new adventure', value: 'new' },
        ];

        this.characterList = new SelectElement('character-list', {
            x: centerX - 30,
            y: centerY - 10,
            width: 60,
            height: 20,
            options: characters,
            zIndex: 101,
            backgroundColor: '#001122',
            selectedBackgroundColor: '#334455',
            selectedTextColor: '#FFFF00',
            textColor: '#CCCCCC',
            selectedDescriptionColor: '#FFFFFF',
            descriptionColor: '#888888',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            showDescription: true,
            showScrollIndicator: true,
            wrapSelection: false,
            title: 'Your Characters',
            titleAlignment: 'center',
        });
        this.stateContainer.add(this.characterList);

        // Help text
        this.helpText = this.renderer.createStyledText('help', {
            fragment: t`${fg('#666666')('[↑↓] Navigate  [Enter] Select  [Esc] Back')}`,
            x: centerX - 22,
            y: termHeight - 3,
            width: 44,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.helpText);

        // Setup events
        this.characterList.on(SelectElementEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
            if (option.value === 'new') {
                this.stateManager.push(new CharacterCreateState());
            } else {
                // Start game with selected character
                this.stateManager.push(new GameplayState());
            }
        });

        this.characterList.focus();
    }

    handleInput(key: ParsedKey): void {
        if (key.name === 'escape') {
            this.stateManager.pop();
        }
    }
}