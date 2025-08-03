import React from 'react';
import {TerminalReconciler} from './reconciler';
import type {CliRenderer} from '../core';
import type {OpaqueRoot} from 'react-reconciler';

export class ReactTerminalRoot {
  private container: OpaqueRoot;
  private renderer: CliRenderer;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
    this.container = TerminalReconciler.createContainer(
      renderer,
      0, // tag
      null, // hydrationCallbacks
      false, // isStrictMode
      null, // concurrentUpdatesByDefaultOverride
      '', // identifierPrefix
      () => {}, // onRecoverableError
      null, // transitionCallbacks
    );
  }

  render(element: React.ReactElement) {
    TerminalReconciler.updateContainer(element, this.container, null, () => {});
  }

  unmount() {
    TerminalReconciler.updateContainer(null, this.container, null, () => {});
  }
}
