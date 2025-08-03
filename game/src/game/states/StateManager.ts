import {CliRenderer, GroupRenderable, type ParsedKey, type MouseEvent} from '../../core';
import {BaseState} from './BaseState';
import {TransitionManager, TransitionType} from './TransitionManager';

export interface StateTransitionOptions {
  type?: TransitionType;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export class StateManager {
  private states: BaseState[] = [];
  private renderer: CliRenderer;
  private rootContainer: GroupRenderable;
  private transitioning: boolean = false;
  private transitionManager: TransitionManager;
  private defaultTransition: TransitionType = 'swipe-left';

  constructor(renderer: CliRenderer, rootContainer: GroupRenderable) {
    this.renderer = renderer;
    this.rootContainer = rootContainer;
    this.transitionManager = new TransitionManager(renderer);
  }

  setDefaultTransition(type: TransitionType): void {
    this.defaultTransition = type;
  }

  push(state: BaseState, options?: StateTransitionOptions): void {
    this.transitioning = true;

    const previousState = this.getCurrentState();

    // Initialize the new state (but keep it hidden initially)
    state.init(this.renderer, this.rootContainer, this);
    this.states.push(state);

    if (previousState && previousState.stateContainer && state.stateContainer) {
      // Apply transition
      const transitionType = options?.type ?? this.defaultTransition;

      if (transitionType !== 'none') {
        state.stateContainer.visible = false;

        this.transitionManager.transition(
          previousState.stateContainer,
          state.stateContainer,
          transitionType,
          {
            duration: options?.duration,
            easing: options?.easing,
          },
          () => {
            // Ensure new state is visible before cleaning up old state
            state.stateContainer.visible = true;
            previousState.onExit();
            this.transitioning = false;
          },
        );
      } else {
        previousState.onExit();
        this.transitioning = false;
      }
    } else {
      this.transitioning = false;
    }
  }

  pop(options?: StateTransitionOptions): BaseState | undefined {
    if (this.states.length === 0) {
      return undefined;
    }

    this.transitioning = true;

    const poppedState = this.states.pop();
    const newCurrentState = this.getCurrentState();

    if (
      poppedState &&
      newCurrentState &&
      poppedState.stateContainer &&
      newCurrentState.stateContainer
    ) {
      const transitionType = options?.type ?? 'swipe-right'; // Reverse of default

      if (transitionType !== 'none') {
        newCurrentState.stateContainer.visible = false;
        newCurrentState.onEnter();

        this.transitionManager.transition(
          poppedState.stateContainer,
          newCurrentState.stateContainer,
          transitionType,
          {
            duration: options?.duration,
            easing: options?.easing,
          },
          () => {
            poppedState.cleanup();
            newCurrentState.stateContainer.visible = true;
            this.transitioning = false;
          },
        );
      } else {
        poppedState.cleanup();
        newCurrentState.onEnter();
        this.transitioning = false;
      }
    } else {
      if (poppedState) {
        poppedState.cleanup();
      }
      if (newCurrentState) {
        newCurrentState.onEnter();
      }
      this.transitioning = false;
    }

    return poppedState;
  }

  replace(state: BaseState, options?: StateTransitionOptions): void {
    if (this.states.length === 0) {
      this.push(state, options);
      return;
    }

    this.transitioning = true;

    const currentState = this.states.pop();

    // Initialize the new state
    state.init(this.renderer, this.rootContainer, this);
    this.states.push(state);

    if (currentState && currentState.stateContainer && state.stateContainer) {
      const transitionType = options?.type ?? this.defaultTransition;

      if (transitionType !== 'none') {
        state.stateContainer.visible = false;

        this.transitionManager.transition(
          currentState.stateContainer,
          state.stateContainer,
          transitionType,
          {
            duration: options?.duration,
            easing: options?.easing,
          },
          () => {
            // Clean up old state after transition
            currentState.cleanup();
            // Ensure new state is visible
            state.stateContainer.visible = true;
            this.transitioning = false;
          },
        );
      } else {
        currentState.cleanup();
        this.transitioning = false;
      }
    } else {
      if (currentState) {
        currentState.cleanup();
      }
      this.transitioning = false;
    }
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
    if (currentState && !this.transitioning && !this.transitionManager.transitioning) {
      currentState.handleInput(key);
    }
  }

  handleMouse(event: MouseEvent): void {
    const currentState = this.getCurrentState();
    if (currentState && !this.transitioning && !this.transitionManager.transitioning) {
      currentState.handleMouse(event);
    }
  }

  cleanup(): void {
    this.clear();
  }
}
