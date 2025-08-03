import * as React from 'react';
import {ReactTerminalRoot} from './root';
import {RendererProvider} from './context/RendererContext';
import {createCliRenderer, type CliRendererConfig} from '../core';

export {ReactTerminalRoot} from './root';
export * from './components';
export * from './hooks';
export * from './context/RendererContext';

// JSX type declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: any;
      text: any;
      group: any;
      input: any;
      select: any;
      styledText: any;
    }
  }
}

// Create React app runner
export async function createReactApp(
  App: React.ComponentType,
  config?: CliRendererConfig,
): Promise<ReactTerminalRoot> {
  const renderer = await createCliRenderer(config);
  const root = new ReactTerminalRoot(renderer);

  renderer.start();

  root.render(
    React.createElement(
      RendererProvider,
      { renderer },
      React.createElement(App)
    )
  );

  return root;
}

// Default export for Bun
export default { createReactApp };
