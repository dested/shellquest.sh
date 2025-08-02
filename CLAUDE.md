# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL WARNING
**NEVER RUN THE PROJECT YOURSELF. IT CAN CORRUPT THE CONSOLE.**
- The game uses low-level terminal manipulation that may cause issues
- Always test in a sandboxed environment or virtual machine

## Project Overview

TUI Crawler is a terminal-based procedurally generated dungeon crawler designed for engineers to play during idle time (compilation, AI waiting, etc.). It features:
- Real-time combat with ASCII graphics
- Character progression and competitive ladders
- Server-side verification for anti-cheat
- Cross-platform terminal game running via `bunx tui-crawler`

### Core Documentation
- **Vision & Requirements**: See `BIBLE.md` for complete game design and business requirements
- **Implementation Plan**: See `PLAN.md` for detailed architecture and phases
- **Task Tracking**: See `TASKS.md` for prioritized implementation tasks

## Architecture

### Project Structure
```
tui-crawler/
├── game/               # Game client (Bun/TypeScript + Zig)
│   ├── src/
│   │   ├── core/      # OpenTUI engine (rendering, input, UI)
│   │   ├── crawler/   # Current game demo
│   │   └── zig/       # Low-level buffer rendering (Zig)
│   └── package.json
└── web/               # Backend API & website
    ├── server/        # Express + tRPC API
    │   └── routers/   # API endpoints
    ├── src/           # React frontend
    └── prisma/        # Database schema
```

### Technology Stack

**Game Client (game/)**:
- **Runtime**: Bun (primary) / Node.js
- **Language**: TypeScript
- **Engine**: OpenTUI (custom terminal rendering engine)
- **Native**: Zig for optimized buffer operations
- **Procedural Generation**: rot-js library
- **UI Layout**: Yoga (flexbox for terminal)

**Backend (web/)**:
- **Framework**: Express + tRPC
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Better Auth
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Real-time**: WebSockets for live updates

## Development Commands

### Game Client (in `game/` directory)
```bash
# Install dependencies
bun install

# Run the game locally
bun crawl

# Build for production
bun run build

# Build Zig native library
bun run build:zig
```

### Web Server (in `web/` directory)
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm run build

# Database commands
pnpm run push          # Push schema to database
pnpm run gen           # Generate Prisma client
pnpm run prisma-studio # Open Prisma Studio

# Run console for debugging
pnpm run console
```

## Key Systems & Implementation Status

### OpenTUI Engine (Functional)
- Multi-layer rendering system (bottom, sprite, particle, overlay)
- Sub-pixel movement (4x4 sub-tiles per tile)
- Input handling (keyboard + mouse)
- UI component system with layout management
- Optimized terminal buffer rendering via Zig

### Game Systems (In Progress)
- **State Management**: Need to implement game states (splash, auth, menu, gameplay)
- **Combat System**: Basic collision, needs full implementation
- **AI System**: Enemy behaviors not yet implemented
- **Inventory**: Two-weapon system planned
- **Level Generation**: Basic rot-js integration, needs room types
- **Networking**: tRPC setup exists, needs game endpoints

### Critical Implementation Notes

1. **Terminal Compatibility**:
   - Requires 120x80 character terminal minimum
   - True color (256 color) support required
   - Test across Windows Terminal, iTerm2, and Linux terminals

2. **Performance Targets**:
   - 30 FPS rendering, 10 FPS game logic
   - <100ms API response times
   - <100MB client memory usage

3. **Verification System**:
   - Record all keystrokes during gameplay
   - Server-side deterministic replay for anti-cheat
   - Input logs compressed with zlib

4. **Current Limitations**:
   - Browser version exists but is slow and has rendering issues
   - Game state management not yet implemented
   - No authentication or user accounts yet
   - Combat and inventory systems incomplete

## Database Schema

The database uses Prisma with models for:
- `User`: Player accounts with authentication
- `Character`: Player characters (Wizard/Fighter classes)
- `GameSession`: Dungeon runs with verification
- `LeaderboardEntry`: Competitive rankings (hourly/daily/weekly/monthly)
- `Equipment`: Weapons and items

See `web/prisma/schema/schema.prisma` for full schema.

## Environment Variables

Create `.env` file in `web/` directory:
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32+ character secret>
PORT=3000
NODE_ENV=development
```

## Testing & Development Tips

1. **Never run directly in your main terminal** - Use a VM or container
2. **Check terminal size** with `tput cols` and `tput lines`
3. **Use the console** (`pnpm run console` in web/) for database debugging
4. **Test cross-platform** early and often
5. **Monitor performance** - frame rate should stay above 30 FPS

## Next Steps

Based on `TASKS.md`, the critical path for MVP:
1. Implement state management system
2. Complete combat and AI systems
3. Build authentication and user management
4. Create level generation with room types
5. Implement verification system
6. Polish UI/UX and HUD

## Important Files to Review

- `game/src/core/`: OpenTUI engine implementation
- `game/src/crawler/level.ts`: Current dungeon generation
- `web/server/routers/`: API endpoint implementations
- `web/prisma/schema/`: Database models

## Contact & Resources

- Repository: https://github.com/dested/tui-crawler
- Issues: https://github.com/dested/tui-crawler/issues