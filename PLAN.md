# shellquest.sh - Production Implementation Plan

## Executive Summary
shellquest.sh is a terminal-based dungeon crawler game designed for engineers to play during idle time (compilation, AI waiting, etc.). The game features procedurally generated dungeons, real-time combat, character progression, and competitive ladders. It runs directly in the terminal using `bunx shellquest` and includes server-side verification, user accounts, and social features.

## Architecture Overview

### Core Components

#### 1. Game Engine (OpenTUI)
- **Current State**: Functional proof-of-concept with basic rendering, input handling, and layered sprite system
- **Location**: `game/src/core/`
- **Key Features**:
  - Optimized terminal buffer rendering with Zig backend
  - Layer-based rendering (bottom, sprite, particle, overlay)
  - Sub-pixel movement system (4x4 sub-tiles per tile)
  - UI component system with layout management (Yoga)
  - Mouse and keyboard input handling
  - Frame buffer compositing

#### 2. Game Client
- **Current State**: Basic dungeon exploration demo
- **Location**: `game/src/crawler/`
- **Key Systems Needed**:
  - Complete game state management
  - Combat system
  - Inventory and equipment
  - Character progression
  - Network synchronization
  - Replay recording/verification

#### 3. Backend API
- **Current State**: Basic Express/tRPC setup with Prisma
- **Location**: `web/server/`
- **Key Systems Needed**:
  - User authentication/authorization
  - Dungeon generation service
  - Game session management
  - Replay verification
  - Ladder/leaderboard system
  - Real-time updates (WebSockets)

#### 4. Web Interface
- **Current State**: Basic React/Vite setup
- **Location**: `web/src/`
- **Key Features Needed**:
  - Landing page with game info
  - User profiles
  - Leaderboards
  - Replay viewer
  - Payment integration

## Detailed Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Project Structure Refactoring
- Reorganize game directory structure:
  ```
  game/
    src/
      core/           (engine - no changes)
      game/
        main.ts       (entry point)
        Game.ts       (main game class)
        states/       (game state management)
        entities/     (player, enemies, items)
        systems/      (combat, inventory, etc.)
        ui/           (game-specific UI)
        network/      (API client)
        utils/        (helpers)
  ```

#### 1.2 State Management System
- Implement finite state machine for game flow:
  - SplashState (logo display)
  - AuthState (login/register)
  - MainMenuState (character selection)
  - CharacterCreateState
  - GameplayState (dungeon exploration)
  - GameOverState
  - LeaderboardState

#### 1.3 Database Schema
```prisma
model User {
  id              String     @id @default(cuid())
  username        String     @unique
  email           String     @unique
  passwordHash    String
  createdAt       DateTime   @default(now())
  lastActiveAt    DateTime   @updatedAt
  
  characters      Character[]
  sessions        GameSession[]
  leaderboardEntries LeaderboardEntry[]
}

model Character {
  id              String     @id @default(cuid())
  userId          String
  name            String
  class           CharacterClass
  level           Int        @default(1)
  experience      Int        @default(0)
  
  // Stats
  maxHp           Int        @default(5)
  maxMana         Int        @default(5)
  
  // Progress
  dungeonsCompleted Json     // { "30s": 0, "60s": 0, "120s": 0 }
  
  user            User       @relation(fields: [userId], references: [id])
  equipment       Equipment[]
  sessions        GameSession[]
}

model GameSession {
  id              String     @id @default(cuid())
  characterId     String
  dungeonSeed     String
  dungeonType     DungeonType // THIRTY_SEC, SIXTY_SEC, ONE_TWENTY_SEC
  startedAt       DateTime   @default(now())
  endedAt         DateTime?
  
  // Results
  completed       Boolean    @default(false)
  keysCollected   Int        @default(0)
  coinsCollected  Int        @default(0)
  enemiesKilled   Int        @default(0)
  experienceGained Int       @default(0)
  
  // Verification
  inputLog        Json       // Compressed keystroke log
  verificationHash String?
  verified        Boolean    @default(false)
  
  character       Character  @relation(fields: [characterId], references: [id])
  leaderboardEntry LeaderboardEntry?
}

model LeaderboardEntry {
  id              String     @id @default(cuid())
  userId          String
  sessionId       String     @unique
  period          LeaderboardPeriod // HOURLY, DAILY, WEEKLY, MONTHLY
  score           Int
  rank            Int
  createdAt       DateTime   @default(now())
  
  user            User       @relation(fields: [userId], references: [id])
  session         GameSession @relation(fields: [sessionId], references: [id])
}

enum CharacterClass {
  WIZARD
  FIGHTER
}

enum DungeonType {
  THIRTY_SEC
  SIXTY_SEC
  ONE_TWENTY_SEC
}

enum LeaderboardPeriod {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
}
```

### Phase 2: Game Systems (Week 2-3)

#### 2.1 Combat System
- **Real-time combat** at 10 FPS game tick rate
- **Weapon types**:
  - Swords: Medium damage, medium speed
  - Axes: High damage, slow speed
  - Wands: Low melee, ranged magic attacks
- **Combat mechanics**:
  - Swing animation (2 frames)
  - Hit detection using collision boxes
  - Damage calculation with weapon modifiers
  - Knockback and invulnerability frames
  - Mana consumption for spells

#### 2.2 Enemy AI System
- **Basic behaviors**:
  - Patrol: Random movement in area
  - Chase: Direct path to player when in range
  - Attack: Melee or ranged based on type
- **Enemy types**:
  - Skeleton: Basic melee
  - Goblin: Fast, weak
  - Orc: Slow, strong
  - Wizard: Ranged attacks
  - Boss variants with special abilities

#### 2.3 Inventory & Equipment
- **Two-weapon system**:
  - Main weapon slot
  - Swap weapon slot
  - Tab to swap between
- **Item generation**:
  - Rarity tiers (Common, Rare, Epic, Legendary)
  - Random stat modifiers
  - Level-appropriate drops
- **Consumables**:
  - Health potions
  - Mana potions
  - One slot max per type

#### 2.4 Procedural Generation Enhancement
- **Room types**:
  - Spawn room (safe start)
  - Combat rooms (enemy encounters)
  - Treasure rooms (loot focus)
  - Boss rooms (every 5th level)
  - Prize rooms (every 10th level)
- **Generation parameters**:
  - Difficulty scaling with player level
  - Guaranteed path to all keys
  - Strategic item placement
  - Enemy density balancing

### Phase 3: UI/UX Implementation (Week 3-4)

#### 3.1 Non-Game Screens

##### Login/Register Screen
```
╔══════════════════════════════════════════════════════╗
║                   shellquest.sh                         ║
║                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       ║
║                ▓▓░░░░░░░░░░░░▓▓                      ║
║                ▓▓░░██░░░░██░░▓▓                      ║
║                ▓▓░░░░░░░░░░░░▓▓                      ║
║                ▓▓░░░░████░░░░▓▓                      ║
║                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       ║
╠══════════════════════════════════════════════════════╣
║  Username: [________________]                        ║
║  Password: [________________]                        ║
║                                                       ║
║  [ Login ]  [ Register ]  [ Play as Guest ]          ║
╚══════════════════════════════════════════════════════╝
```

##### Character Selection
```
╔══════════════════════════════════════════════════════╗
║                CHARACTER SELECT                       ║
╠══════════════════════════════════════════════════════╣
║  ▶ Gandalf      Wizard  Lvl 15  ⚔️ 45  🏆 #234       ║
║    Conan        Fighter Lvl 8   ⚔️ 23  🏆 #567       ║
║    Merlin       Wizard  Lvl 22  ⚔️ 87  🏆 #123       ║
║                                                       ║
║  [ Create New ]  [ Delete ]  [ Leaderboard ]         ║
╚══════════════════════════════════════════════════════╝
```

#### 3.2 In-Game HUD
- **Enhanced health/mana bars** with gradient effects
- **Timer display** with urgency indicators
- **Key counter** (3/5 keys collected)
- **Coin counter**
- **Mini-map** (optional, fog of war)
- **Equipment slots** showing current weapons
- **Run meter** showing stamina

### Phase 4: Networking & API (Week 4-5)

#### 4.1 API Routes (tRPC)

```typescript
// User Management
user.register({ username, email, password })
user.login({ username, password })
user.logout()
user.getProfile()
user.updateProfile({ email })

// Character Management
character.create({ name, class })
character.delete({ characterId })
character.getAll()
character.getDetails({ characterId })

// Game Sessions
game.requestDungeon({ characterId, dungeonType })
game.submitResults({ sessionId, inputLog, results })
game.verifySession({ sessionId })

// Leaderboards
leaderboard.get({ period, offset, limit })
leaderboard.getPlayerRank({ userId, period })

// Social Features
social.getPlayerProfile({ username })
social.shareReplay({ sessionId })
```

#### 4.2 Real-time Features
- WebSocket connection for:
  - Live leaderboard updates
  - Achievement notifications
  - Server announcements
  - Anti-cheat monitoring

#### 4.3 Security & Verification
- **Input recording**:
  - Record all keystrokes with timestamps
  - Compress using zlib
  - Send with game results
- **Server-side verification**:
  - Replay inputs through deterministic simulation
  - Verify final state matches
  - Check for impossible sequences
  - Rate limiting and timing checks

### Phase 5: Game Features (Week 5-6)

#### 5.1 Lighting System
- **Dynamic lighting**:
  - Player light radius (upgradeable)
  - Torch light sources
  - Spell effects lighting
  - Color temperature variations
- **Fog of war**:
  - Explored vs unexplored areas
  - Line of sight calculations
  - Memory of explored areas

#### 5.2 Particle Effects
- **Combat particles**:
  - Sword swings (arc trail)
  - Magic projectiles
  - Hit sparks
  - Blood/damage indicators
- **Environmental**:
  - Torch flames
  - Water drips
  - Dust motes
  - Portal effects

#### 5.3 Sound System
- **Console beeps/tones**:
  - Attack sounds
  - Hit confirms
  - Item pickups
  - Level completion
- **Music** (optional):
  - MIDI-style tracks
  - Dynamic intensity

#### 5.4 Animation System
- **Character animations**:
  - Walk cycle (2 frames)
  - Attack animation
  - Hit reaction
  - Death animation
- **Enemy animations**:
  - Unique per enemy type
  - Idle breathing
  - Attack telegraphs
- **Environmental**:
  - Torch flicker
  - Water flow
  - Door opening

### Phase 6: Polish & Launch (Week 6-7)

#### 6.1 Performance Optimization
- **Rendering optimizations**:
  - Dirty rectangle tracking
  - Frame buffer caching
  - Culling off-screen entities
- **Network optimizations**:
  - Request batching
  - Compression
  - Caching strategies
- **Memory management**:
  - Entity pooling
  - Texture atlas optimization

#### 6.2 NPM Package Setup
- **Build pipeline**:
  - TypeScript compilation
  - Asset bundling
  - Binary distribution for Zig library
- **Cross-platform support**:
  - Windows (PowerShell, CMD)
  - macOS (Terminal, iTerm)
  - Linux (various terminals)
- **Auto-updater**:
  - Version checking
  - Incremental updates

#### 6.3 Website Development
- **Landing page**:
  - Game trailer/demo
  - Feature list
  - Installation instructions
  - Screenshots
- **User profiles** (`/u/username`):
  - Character showcase
  - Achievement display
  - Play statistics
- **Leaderboards**:
  - Multiple time periods
  - Class-specific boards
  - Regional boards
- **Replay viewer** (`/g/game-id`):
  - Web-based replay
  - Speed controls
  - Share functionality

#### 6.4 Monetization
- **Donation system**:
  - Stripe integration
  - Supporter badges
  - Cosmetic rewards
- **Premium features** (optional):
  - Character slots
  - Cosmetic items
  - Early access to features

### Phase 7: Post-Launch (Ongoing)

#### 7.1 Content Updates
- New enemy types
- Additional dungeon themes
- Seasonal events
- New weapon types
- Boss mechanics

#### 7.2 Community Features
- Discord integration
- Tournaments
- Guild system
- Friend lists
- Chat system

#### 7.3 Analytics & Monitoring
- Player metrics
- Performance monitoring
- Error tracking
- A/B testing
- Feedback collection

## Technical Considerations

### Performance Targets
- **Frame rate**: 30 FPS rendering, 10 FPS game logic
- **Latency**: <100ms API responses
- **Memory**: <100MB client memory usage
- **CPU**: <10% idle, <30% active gameplay

### Compatibility
- **Node.js**: 18.0+
- **Bun**: 1.0+
- **Terminal**: 80x24 minimum, 120x80 recommended
- **Colors**: 256 color support required

### Security
- Password hashing with bcrypt
- JWT authentication
- Rate limiting on all endpoints
- Input sanitization
- SQL injection prevention
- XSS protection

## Risk Mitigation

### Technical Risks
1. **Terminal compatibility**: Test across multiple terminals early
2. **Performance on slow connections**: Implement offline mode
3. **Cheating/botting**: Server-side verification critical

### Business Risks
1. **Player retention**: Daily quests, events
2. **Monetization**: Keep core game free
3. **Competition**: Focus on unique terminal experience

## Success Metrics

### Launch Goals (First Month)
- 1,000 unique players
- 10,000 game sessions
- 100 paying supporters
- 4.5+ star npm rating

### Long-term Goals (First Year)
- 10,000 monthly active users
- 1,000 paying supporters
- Active community (Discord 500+ members)
- Regular content updates (monthly)


## Conclusion

shellquest.sh represents a unique opportunity to create a viral terminal-based game that appeals to the developer community. With careful attention to performance, user experience, and competitive features, it can become the go-to entertainment during compilation and deployment waits. The modular architecture allows for continuous improvement and community contribution post-launch.