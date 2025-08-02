#!/usr/bin/env bun
import { Game } from './Game';

async function main() {
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
}

if (require.main === module) {
    main();
}