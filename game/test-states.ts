#!/usr/bin/env bun
import { Game } from './src/game/Game';

console.log('Starting shellquest.sh test...');
console.log('Terminal size:', process.stdout.columns, 'x', process.stdout.rows);
console.log('');
console.log('Note: The game is designed for 120x80 terminals.');
console.log('Some UI elements may not display correctly in smaller terminals.');
console.log('');
console.log('Press Ctrl+C to exit at any time.');
console.log('');

// Give user time to read the message
setTimeout(async () => {
    console.clear();
    
    const game = new Game();
    
    process.on('SIGINT', async () => {
        await game.cleanup();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await game.cleanup();
        process.exit(0);
    });
    
    try {
        await game.init();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        await game.cleanup();
        process.exit(1);
    }
}, 2000);
