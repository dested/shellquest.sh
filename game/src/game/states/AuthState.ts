import { BaseState } from './BaseState';
import { MainMenuState } from './MainMenuState';
import {
    InputElement,
    InputElementEvents,
    SelectElement,
    SelectElementEvents,
    type SelectOption,
    GroupRenderable,
    StyledTextRenderable,
    FrameBufferRenderable,
    OptimizedBuffer,
    RGBA,
    t,
    bold,
    fg,
    bg,
    type ParsedKey,
} from '../../core';
import { COLORS, GAME_CONFIG } from '../constants';

enum AuthMode {
    CHOICE,
    LOGIN,
    REGISTER,
}

export class AuthState extends BaseState {
    private mode: AuthMode = AuthMode.CHOICE;
    private modeSelect: SelectElement | null = null;
    private usernameInput: InputElement | null = null;
    private passwordInput: InputElement | null = null;
    private confirmPasswordInput: InputElement | null = null;
    private errorText: StyledTextRenderable | null = null;
    private successText: StyledTextRenderable | null = null;
    private titleText: StyledTextRenderable | null = null;
    private helpText: StyledTextRenderable | null = null;
    private logoBuffer: FrameBufferRenderable | null = null;
    private activeInputIndex: number = 0;
    private inputs: InputElement[] = [];
    private isProcessing: boolean = false;

    onEnter(): void {
        this.createUI();
        this.showChoiceMenu();
    }

    onExit(): void {
        // Cleanup will be handled by BaseState
    }

    private createUI(): void {
        const termWidth = this.renderer.terminalWidth;
        const termHeight = this.renderer.terminalHeight;
        const centerX = Math.floor(termWidth / 2);
        const centerY = Math.floor(termHeight / 2);

        // Create logo using FrameBufferRenderable with OptimizedBuffer
        this.logoBuffer = new FrameBufferRenderable('auth-logo', 
            this.renderer.lib.createOptimizedBuffer(14, 8, true), {
            x: centerX - 7,
            y: centerY - 18,
            width: 14,
            height: 8,
            zIndex: 100,
        });
        this.stateContainer.add(this.logoBuffer);
        this.drawLogo();

        // Title
        this.titleText = this.renderer.createStyledText('auth-title', {
            fragment: t`${bold(fg('#00FFFF')('shellquest.sh'))}`,
            x: centerX - 6,
            y: centerY - 10,
            width: 12,
            height: 1,
            zIndex: 101,
        });
        this.stateContainer.add(this.titleText);

        // Mode selector
        const modeOptions: SelectOption[] = [
            { name: 'Login', description: 'Login with existing account', value: 'login' },
            { name: 'Register', description: 'Create a new account', value: 'register' },
            { name: 'Play as Guest', description: 'Play without an account', value: 'guest' },
        ];

        this.modeSelect = new SelectElement('mode-select', {
            x: centerX - 20,
            y: centerY - 5,
            width: 40,
            height: 8,
            options: modeOptions,
            zIndex: 102,
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
            title: 'Welcome',
            titleAlignment: 'center',
        });

        // Username input
        this.usernameInput = new InputElement('username-input', {
            x: centerX - 20,
            y: centerY - 2,
            width: 40,
            height: 3,
            zIndex: 103,
            backgroundColor: '#001122',
            textColor: '#FFFFFF',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            placeholder: 'Enter username...',
            placeholderColor: '#666666',
            cursorColor: '#FFFF00',
            maxLength: GAME_CONFIG.MAX_USERNAME_LENGTH,
            title: 'Username',
            titleAlignment: 'left',
        });

        // Password input
        this.passwordInput = new InputElement('password-input', {
            x: centerX - 20,
            y: centerY + 2,
            width: 40,
            height: 3,
            zIndex: 103,
            backgroundColor: '#001122',
            textColor: '#FFFFFF',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            placeholder: 'Enter password...',
            placeholderColor: '#666666',
            cursorColor: '#FFFF00',
            maxLength: GAME_CONFIG.MAX_PASSWORD_LENGTH,
            title: 'Password',
            titleAlignment: 'left',
        });

        // Confirm password input
        this.confirmPasswordInput = new InputElement('confirm-password-input', {
            x: centerX - 20,
            y: centerY + 6,
            width: 40,
            height: 3,
            zIndex: 103,
            backgroundColor: '#001122',
            textColor: '#FFFFFF',
            borderStyle: 'rounded',
            borderColor: '#666666',
            focusedBorderColor: '#00AAFF',
            placeholder: 'Confirm password...',
            placeholderColor: '#666666',
            cursorColor: '#FFFF00',
            maxLength: GAME_CONFIG.MAX_PASSWORD_LENGTH,
            title: 'Confirm Password',
            titleAlignment: 'left',
        });

        // Error text
        this.errorText = this.renderer.createStyledText('error-text', {
            fragment: t``,
            x: centerX - 20,
            y: centerY + 10,
            width: 40,
            height: 2,
            zIndex: 104,
            defaultFg: '#FF0000',
        });
        this.stateContainer.add(this.errorText);

        // Success text
        this.successText = this.renderer.createStyledText('success-text', {
            fragment: t``,
            x: centerX - 20,
            y: centerY + 10,
            width: 40,
            height: 2,
            zIndex: 104,
            defaultFg: '#00FF00',
        });
        this.stateContainer.add(this.successText);

        // Help text
        this.helpText = this.renderer.createStyledText('help-text', {
            fragment: t`${fg('#666666')('[Tab] Navigate  [Enter] Select  [Esc] Back')}`,
            x: centerX - 22,
            y: termHeight - 3,
            width: 44,
            height: 1,
            zIndex: 100,
        });
        this.stateContainer.add(this.helpText);

        // Setup event handlers
        this.setupEventHandlers();
    }

    private drawLogo(): void {
        if (!this.logoBuffer) return;

        const logo = [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓▓░░░░░░░░░░▓▓',
            '▓▓░░██░░██░░▓▓',
            '▓▓░░░░░░░░░░▓▓',
            '▓▓░░░░██░░░░▓▓',
            '▓▓░░██████░░▓▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        ];

        const buffer = this.logoBuffer.frameBuffer;
        buffer.clear();

        for (let y = 0; y < logo.length; y++) {
            const line = logo[y];
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                let color: RGBA;
                
                if (char === '▓') {
                    color = RGBA.fromHex(0x00FFFF);
                } else if (char === '░') {
                    color = RGBA.fromHex(0x006666);
                } else {
                    color = RGBA.fromHex(0xFFFF00);
                }
                
                buffer.setCell(x, y, char, color, RGBA.fromHex(0x000000));
            }
        }
    }

    private setupEventHandlers(): void {
        // Mode selector
        if (this.modeSelect) {
            this.modeSelect.on(SelectElementEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
                switch (option.value) {
                    case 'login':
                        this.showLoginForm();
                        break;
                    case 'register':
                        this.showRegisterForm();
                        break;
                    case 'guest':
                        this.playAsGuest();
                        break;
                }
            });
        }

        // Username input
        if (this.usernameInput) {
            this.usernameInput.on(InputElementEvents.ENTER, () => {
                if (this.mode === AuthMode.LOGIN && this.passwordInput) {
                    this.passwordInput.focus();
                } else if (this.mode === AuthMode.REGISTER && this.passwordInput) {
                    this.passwordInput.focus();
                }
            });
        }

        // Password input
        if (this.passwordInput) {
            this.passwordInput.on(InputElementEvents.ENTER, () => {
                if (this.mode === AuthMode.LOGIN) {
                    this.attemptLogin();
                } else if (this.mode === AuthMode.REGISTER && this.confirmPasswordInput) {
                    this.confirmPasswordInput.focus();
                }
            });
        }

        // Confirm password input
        if (this.confirmPasswordInput) {
            this.confirmPasswordInput.on(InputElementEvents.ENTER, () => {
                this.attemptRegister();
            });
        }
    }

    private showChoiceMenu(): void {
        this.mode = AuthMode.CHOICE;
        this.clearMessages();

        // Hide inputs
        if (this.usernameInput) {
            this.stateContainer.remove(this.usernameInput.id);
        }
        if (this.passwordInput) {
            this.stateContainer.remove(this.passwordInput.id);
        }
        if (this.confirmPasswordInput) {
            this.stateContainer.remove(this.confirmPasswordInput.id);
        }

        // Show mode selector
        if (this.modeSelect) {
            this.stateContainer.add(this.modeSelect);
            this.modeSelect.focus();
        }

        this.inputs = [];
        this.activeInputIndex = 0;

        if (this.helpText) {
            this.helpText.fragment = t`${fg('#666666')('[↑↓] Navigate  [Enter] Select  [Esc] Exit')}`;
        }
    }

    private showLoginForm(): void {
        this.mode = AuthMode.LOGIN;
        this.clearMessages();

        // Hide mode selector
        if (this.modeSelect) {
            this.stateContainer.remove(this.modeSelect.id);
        }

        // Show login inputs
        if (this.usernameInput) {
            this.stateContainer.add(this.usernameInput);
            this.usernameInput.setValue('');
        }
        if (this.passwordInput) {
            this.stateContainer.add(this.passwordInput);
            this.passwordInput.setValue('');
        }

        // Hide confirm password
        if (this.confirmPasswordInput) {
            this.stateContainer.remove(this.confirmPasswordInput.id);
        }

        this.inputs = [this.usernameInput!, this.passwordInput!];
        this.activeInputIndex = 0;
        this.inputs[0].focus();

        if (this.helpText) {
            this.helpText.fragment = t`${fg('#666666')('[Tab] Next Field  [Enter] Submit  [Esc] Back')}`;
        }
    }

    private showRegisterForm(): void {
        this.mode = AuthMode.REGISTER;
        this.clearMessages();

        // Hide mode selector
        if (this.modeSelect) {
            this.stateContainer.remove(this.modeSelect.id);
        }

        // Show all inputs
        if (this.usernameInput) {
            this.stateContainer.add(this.usernameInput);
            this.usernameInput.setValue('');
        }
        if (this.passwordInput) {
            this.stateContainer.add(this.passwordInput);
            this.passwordInput.setValue('');
        }
        if (this.confirmPasswordInput) {
            this.stateContainer.add(this.confirmPasswordInput);
            this.confirmPasswordInput.setValue('');
        }

        this.inputs = [this.usernameInput!, this.passwordInput!, this.confirmPasswordInput!];
        this.activeInputIndex = 0;
        this.inputs[0].focus();

        if (this.helpText) {
            this.helpText.fragment = t`${fg('#666666')('[Tab] Next Field  [Enter] Submit  [Esc] Back')}`;
        }
    }

    private clearMessages(): void {
        if (this.errorText) {
            this.errorText.fragment = t``;
        }
        if (this.successText) {
            this.successText.fragment = t``;
        }
    }

    private attemptLogin(): void {
        if (this.isProcessing) return;

        const username = this.usernameInput?.getValue() || '';
        const password = this.passwordInput?.getValue() || '';

        if (username.length < GAME_CONFIG.MIN_USERNAME_LENGTH) {
            this.showError(`Username must be at least ${GAME_CONFIG.MIN_USERNAME_LENGTH} characters`);
            return;
        }

        if (password.length < GAME_CONFIG.MIN_PASSWORD_LENGTH) {
            this.showError(`Password must be at least ${GAME_CONFIG.MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        this.isProcessing = true;
        this.showSuccess('Logging in... (Demo mode)');

        setTimeout(() => {
            this.isProcessing = false;
            this.stateManager.replace(new MainMenuState());
        }, 1000);
    }

    private attemptRegister(): void {
        if (this.isProcessing) return;

        const username = this.usernameInput?.getValue() || '';
        const password = this.passwordInput?.getValue() || '';
        const confirmPassword = this.confirmPasswordInput?.getValue() || '';

        if (username.length < GAME_CONFIG.MIN_USERNAME_LENGTH) {
            this.showError(`Username must be at least ${GAME_CONFIG.MIN_USERNAME_LENGTH} characters`);
            return;
        }

        if (password.length < GAME_CONFIG.MIN_PASSWORD_LENGTH) {
            this.showError(`Password must be at least ${GAME_CONFIG.MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        this.isProcessing = true;
        this.showSuccess('Creating account... (Demo mode)');

        setTimeout(() => {
            this.isProcessing = false;
            this.stateManager.replace(new MainMenuState());
        }, 1000);
    }

    private playAsGuest(): void {
        this.showSuccess('Playing as guest...');
        setTimeout(() => {
            this.stateManager.replace(new MainMenuState());
        }, 500);
    }

    private showError(message: string): void {
        this.clearMessages();
        if (this.errorText) {
            this.errorText.fragment = t`${fg('#FF0000')('✗ ' + message)}`;
        }
    }

    private showSuccess(message: string): void {
        this.clearMessages();
        if (this.successText) {
            this.successText.fragment = t`${fg('#00FF00')('✓ ' + message)}`;
        }
    }

    handleInput(key: ParsedKey): void {
        if (this.isProcessing) return;

        // Handle escape
        if (key.name === 'escape') {
            if (this.mode === AuthMode.CHOICE) {
                process.exit(0);
            } else {
                this.showChoiceMenu();
            }
            return;
        }

        // Handle tab navigation in forms
        if (key.name === 'tab' && this.mode !== AuthMode.CHOICE) {
            if (this.inputs.length > 0) {
                this.inputs[this.activeInputIndex].blur();
                
                if (key.shift) {
                    this.activeInputIndex = (this.activeInputIndex - 1 + this.inputs.length) % this.inputs.length;
                } else {
                    this.activeInputIndex = (this.activeInputIndex + 1) % this.inputs.length;
                }
                
                this.inputs[this.activeInputIndex].focus();
            }
        }
    }
}
