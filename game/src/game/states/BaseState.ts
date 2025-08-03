import {CliRenderer, GroupRenderable, type ParsedKey, type MouseEvent} from '../../core';
import {StateManager} from '@states/StateManager.ts';

export abstract class BaseState {
  protected renderer: CliRenderer;
  protected rootContainer: GroupRenderable;
  public stateContainer: GroupRenderable;
  protected stateManager: StateManager;

  constructor() {}

  init(renderer: CliRenderer, rootContainer: GroupRenderable, stateManager: StateManager): void {
    this.renderer = renderer;
    this.rootContainer = rootContainer;
    this.stateManager = stateManager;

    // Create a container for this state
    this.stateContainer = new GroupRenderable(`state-${Date.now()}`, {
      x: 0,
      y: 0,
      zIndex: 10,
      visible: true,
    });
    this.rootContainer.add(this.stateContainer);

    this.onEnter();
  }

  abstract onEnter(): void;

  abstract onExit(): void;

  abstract handleInput(key: ParsedKey): void;

  handleMouse(event: MouseEvent): void {
    // Override in subclasses if needed
  }

  cleanup(): void {
    this.onExit();
    if (this.stateContainer && this.rootContainer) {
      this.rootContainer.remove(this.stateContainer.id);
    }
  }
}
