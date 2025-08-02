import { CliRenderer, GroupRenderable, type ParsedKey, type MouseEvent } from '../../core';
import { BaseState } from './BaseState';

export class StateManager {
    private states: BaseState[] = [];
    private renderer: CliRenderer;
    private rootContainer: GroupRenderable;
    private transitioning: boolean = false;

    constructor(renderer: CliRenderer, rootContainer: GroupRenderable) {
        this.renderer = renderer;
        this.rootContainer = rootContainer;
    }

    push(state: BaseState): void {
        this.transitioning = true;
        
        const previousState = this.getCurrentState();
        if (previousState) {
            previousState.onExit();
        }
        
        state.init(this.renderer, this.rootContainer, this);
        this.states.push(state);
        
        this.transitioning = false;
    }

    pop(): BaseState | undefined {
        if (this.states.length === 0) {
            return undefined;
        }
        
        this.transitioning = true;
        
        const poppedState = this.states.pop();
        if (poppedState) {
            poppedState.cleanup();
        }
        
        const newCurrentState = this.getCurrentState();
        if (newCurrentState) {
            newCurrentState.onEnter();
        }
        
        this.transitioning = false;
        
        return poppedState;
    }

    replace(state: BaseState): void {
        if (this.states.length > 0) {
            this.pop();
        }
        this.push(state);
    }

    clear(): void {
        while (this.states.length > 0) {
            this.pop();
        }
    }

    getCurrentState(): BaseState | undefined {
        return this.states[this.states.length - 1];
    }

    getStateCount(): number {
        return this.states.length;
    }

    handleInput(key: ParsedKey): void {
        const currentState = this.getCurrentState();
        if (currentState && !this.transitioning) {
            currentState.handleInput(key);
        }
    }

    handleMouse(event: MouseEvent): void {
        const currentState = this.getCurrentState();
        if (currentState && !this.transitioning) {
            currentState.handleMouse(event);
        }
    }

    cleanup(): void {
        this.clear();
    }
}