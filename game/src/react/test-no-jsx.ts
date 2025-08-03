#!/usr/bin/env bun
import * as React from 'react';
import { createCliRenderer } from '../core';
import { ReactTerminalRoot } from './root';
import { RendererProvider } from './context/RendererContext';

// Test without JSX - using React.createElement directly
async function main() {
  console.log('Starting React Terminal Framework test (no JSX)...');
  
  try {
    const renderer = await createCliRenderer({
      exitOnCtrlC: true,
      targetFps: 30,
    });
    
    const root = new ReactTerminalRoot(renderer);
    renderer.start();
    
    // Create a simple component tree without JSX
    const app = React.createElement(
      RendererProvider,
      { renderer },
      React.createElement('group', { x: 0, y: 0 },
        React.createElement('box', {
          x: 5,
          y: 5,
          width: 40,
          height: 10,
          borderStyle: 'double',
          borderColor: '#00FF00',
          title: 'React Terminal Test'
        },
          React.createElement('text', {
            x: 2,
            y: 2,
            fg: '#FFFF00',
            bold: true
          }, 'Hello from React without JSX!'),
          React.createElement('text', {
            x: 2,
            y: 4,
            fg: '#00FFFF'
          }, 'If you see this, the reconciler works!')
        )
      )
    );
    
    root.render(app);
    
    console.log('React app started successfully!');
  } catch (error) {
    console.error('Failed to start React app:', error);
    process.exit(1);
  }
}

main();