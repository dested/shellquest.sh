import { BaseState } from './BaseState';
import { GameplayState } from './GameplayState';
import {
    InputElement,
    InputElementEvents,
    SelectElement,
    SelectElementEvents,
    type SelectOption,
    StyledTextRenderable,
    t,
    bold,
    fg,
    type ParsedKey,
} from '../../core';
import { CHARACTER_CLASSES, GAME_CONFIG } from '../constants';

export class CharacterCreateState extends BaseState {
    private nameInput: InputElement | null = null;
    private classSelect: SelectElement | null = null;
    private titleText: StyledTextRenderable | null = null;
    private helpText: StyledTextRenderable | null = null;
    private descriptionText: StyledTextRenderable | null = null;
    private selectedClass: string = 'WIZARD';

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
            fragment: t`${bold(fg('#00FFFF')('Create New Character'))}`,
            x: centerX - 10,
            y: 5,
            width: 20,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.titleText);

        // Name input
        this.nameInput = new InputElement('name-input', {
            x: centerX - 20,
            y: centerY - 8,
            width: 40,
            height: 3,
            zIndex: 101,
            backgroundColor: '#001122',
            textColor: '#FFFFFF',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            placeholder: 'Enter character name...',
            placeholderColor: '#666666',
            cursorColor: '#FFFF00',
            maxLength: GAME_CONFIG.MAX_CHARACTER_NAME_LENGTH,
            title: 'Character Name',
            titleAlignment: 'left',
        });
        this.stateContainer.add(this.nameInput);

        // Class selector
        const classOptions: SelectOption[] = [
            { 
                name: CHARACTER_CLASSES.WIZARD.name, 
                description: CHARACTER_CLASSES.WIZARD.description, 
                value: 'WIZARD' 
            },
            { 
                name: CHARACTER_CLASSES.FIGHTER.name, 
                description: CHARACTER_CLASSES.FIGHTER.description, 
                value: 'FIGHTER' 
            },
        ];

        this.classSelect = new SelectElement('class-select', {
            x: centerX - 20,
            y: centerY - 3,
            width: 40,
            height: 8,
            options: classOptions,
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
            showScrollIndicator: false,
            wrapSelection: true,
            title: 'Choose Class',
            titleAlignment: 'left',
        });
        this.stateContainer.add(this.classSelect);

        // Class description
        this.updateClassDescription();

        // Help text
        this.helpText = this.renderer.createStyledText('help', {
            fragment: t`${fg('#666666')('[Tab] Next Field  [Enter] Create  [Esc] Back')}`,
            x: centerX - 22,
            y: termHeight - 3,
            width: 44,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.helpText);

        // Setup events
        this.nameInput.on(InputElementEvents.ENTER, () => {
            this.createCharacter();
        });

        this.classSelect.on(SelectElementEvents.SELECTION_CHANGED, (index: number, option: SelectOption) => {
            this.selectedClass = option.value as string;
            this.updateClassDescription();
        });

        this.nameInput.focus();
    }

    private updateClassDescription(): void {
        if (this.descriptionText) {
            this.stateContainer.remove(this.descriptionText.id);
        }

        const classData = this.selectedClass === 'WIZARD' ? CHARACTER_CLASSES.WIZARD : CHARACTER_CLASSES.FIGHTER;
        const centerX = Math.floor(this.renderer.terminalWidth / 2);
        const centerY = Math.floor(this.renderer.terminalHeight / 2);

        this.descriptionText = this.renderer.createStyledText('class-desc', {
            fragment: t`${bold(fg('#FFFF00')(classData.name + ' Stats'))}
${fg('#CCCCCC')('Starting HP:')} ${fg('#00FF00')(String(classData.startingHp))}
${fg('#CCCCCC')('Starting Mana:')} ${fg('#00AAFF')(String(classData.startingMana))}
${fg('#CCCCCC')('HP per Level:')} ${fg('#00FF00')('+' + classData.hpPerLevel)}
${fg('#CCCCCC')('Mana per Level:')} ${fg('#00AAFF')('+' + classData.manaPerLevel)}
${fg('#CCCCCC')('Weapons:')} ${fg('#FF8800')(classData.allowedWeapons.join(', '))}`,
            x: centerX - 20,
            y: centerY + 6,
            width: 40,
            height: 8,
            zIndex: 101,
        });
        this.stateContainer.add(this.descriptionText);
    }

    private createCharacter(): void {
        const name = this.nameInput?.getValue() || '';
        
        if (name.length < GAME_CONFIG.MIN_CHARACTER_NAME_LENGTH) {
            // TODO: Show error message
            return;
        }

        // TODO: Save character to database
        console.log(`Creating character: ${name} (${this.selectedClass})`);
        
        // Start game with new character
        this.stateManager.replace(new GameplayState());
    }

    handleInput(key: ParsedKey): void {
        if (key.name === 'escape') {
            this.stateManager.pop();
        } else if (key.name === 'tab') {
            // Toggle focus between name input and class select
            if (this.nameInput?.isFocused()) {
                this.nameInput.blur();
                this.classSelect?.focus();
            } else {
                this.classSelect?.blur();
                this.nameInput?.focus();
            }
        }
    }
}