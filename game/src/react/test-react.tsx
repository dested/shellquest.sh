#!/usr/bin/env bun
import {createReactApp} from './index';
import {App} from './demos';

// Run the React demos
async function main() {
  console.log('Starting React Terminal Framework demos...');
  console.log('Press ESC to switch between demos');
  console.log('Press Ctrl+C to exit\n');

  try {
    await createReactApp(App, {
      exitOnCtrlC: true,
      targetFps: 30,
      enableMouseMovement: true,
      useMouse: true,
    });
  } catch (error) {
    console.error('Failed to start React app:', error);
    process.exit(1);
  }
}

main();
