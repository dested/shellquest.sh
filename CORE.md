🎮 OpenTUI Framework: Complete Nerd's Guide

Core Architecture

The OpenTUI framework is a terminal-based UI rendering system built on top of a Zig-based rendering library with JavaScript/TypeScript bindings. At its heart:

1. CliRenderer (src/index.ts:163) - The main renderer class that manages the entire terminal interface
   - Extends Renderable base class
   - Manages frame updates, input handling, and the render loop
   - Uses FFI bindings to a Zig library for optimized rendering
   - Supports threading (disabled on Linux)
   - Handles terminal resizing, mouse events, and keyboard input
2. Renderable (src/Renderable.ts:15) - Abstract base class for all visual elements
   - Tree-based hierarchy with parent/child relationships
   - Automatic z-index sorting for layering
   - Event propagation system
   - Position can be relative to parent (nested coordinates)
   - Selection support for text-based elements
3. OptimizedBuffer (src/buffer.ts:40) - Low-level pixel/character buffer
   - Direct memory access via TypedArrays
   - Alpha blending support
   - FFI and local rendering paths
   - Character grid with foreground/background colors and text attributes

Rendering Pipeline

CliRenderer.loop() →
└→ Renderable.render() [recursive tree traversal]
└→ renderSelf() [each element draws to buffer]
└→ OptimizedBuffer operations [cell-by-cell drawing]
└→ Zig library render() [native terminal output]

Core Components

Basic Renderables (src/objects.ts)

1. TextRenderable - Single-line text with styling
   - Foreground/background colors (RGBA)
   - Text attributes (bold, italic, underline, etc.)
   - Selection support with TextSelectionHelper
   - Tab stop handling
2. BoxRenderable - Rectangular areas with borders
   - Multiple border styles (single, double, rounded, custom)
   - Partial borders support
   - Background fill
   - Title with alignment options
   - Custom border characters
3. FrameBufferRenderable - Renders an OptimizedBuffer
   - Used for complex drawing operations
   - Supports alpha blending
   - Can be used as a canvas for custom graphics
4. GroupRenderable - Container for organizing renderables
   - No visual representation
   - Used for logical grouping and transforms
5. StyledTextRenderable - Multi-style text with fragments
   - Supports complex text styling with Fragment system
   - Multi-line text with proper selection
   - Per-character styling

Input System

Mouse Events (src/index.ts:56)

- Event types: down, up, drag, move, over, out, drop, drag-end
- Hit testing via spatial grid
- Capture mechanism for drag operations
- Event bubbling and preventDefault support

Keyboard (src/parse.keypress.ts)

- Raw stdin processing
- Parsed key events with modifiers
- Ctrl+C handling for exit

Advanced Features

3D Rendering (src/3d/)

- Three.js integration via ThreeCliRenderer
- WebGPU support for terminal rendering
- Sprite animation system
- Physics integration (Rapier2D, Planck)
- Explosion effects and particle systems

UI Framework (src/ui/)

- Flexbox layout via Yoga library
- Layout class for responsive designs
- LayoutElement base for UI components
- Tab controllers, input fields, select boxes

Animation (src/animation/Timeline.ts)

- Timeline-based animation system
- Multiple easing functions
- Property interpolation
- Callbacks and loops

Color System

RGBA class (src/types.ts:3)
- Float32Array backed (0.0-1.0 range)
- Conversion utilities (hex, ints)
- Alpha blending algorithms

Performance Optimizations

1. Double buffering - Render to next buffer while displaying current
2. Dirty region tracking - Only update changed areas
3. Z-index sorting - Sort only when needed
4. FFI path - Native Zig functions for heavy operations
5. Threading support - Background rendering (when available)

Asset Management

For sprites/textures (src/3d/SpriteResourceManager.ts):
- Texture atlas support
- Frame-based sprite sheets
- Resource pooling for effects

Key Patterns for Game Development

Game Loop Structure

renderer.setFrameCallback(async (deltaTime: number) => {
// Update game state
updateGameLogic(deltaTime)

    // Update animations
    animationSystem.update(deltaTime)

    // Render to framebuffer
    gameFrameBuffer.clear()
    renderGameWorld(gameFrameBuffer)

    // Draw UI overlay
    renderUI()
})

Entity Management

class GameEntity extends Renderable {
protected renderSelf(buffer: OptimizedBuffer): void {
// Draw sprite/character
buffer.drawText(this.sprite, this.x, this.y, this.color)
}

    protected onMouseEvent(event: MouseEvent): void {
      // Handle interactions
    }
}

Collision Detection

- Use ctx.addToHitGrid() for mouse picking
- Manual AABB checks for game collisions
- Physics engine integration for complex scenarios

Terminal Constraints

- Character Grid: Everything snaps to character cells
- Aspect Ratio: Characters are ~2:1 (height:width)
- Color Limitations: Full RGB but may vary by terminal
- Update Rate: Target 30-60 FPS max
- Input Lag: Mouse events may cluster

Best Practices

1. Use FrameBuffers for complex scenes to reduce draw calls
2. Batch similar operations (all text, then all boxes)
3. Leverage GroupRenderable for scene management
4. Implement dirty flagging with needsUpdate
5. Profile with debug overlay (renderer.toggleDebugOverlay())
6. Use the animation Timeline for smooth transitions
7. Respect the z-index for proper layering

Dungeon Crawler Specific Considerations

For your dungeon crawler, consider:

1. Tile Size: Probably 1x1 characters for maximum detail, or 2x2 for more visual space
2. Map Rendering: Use a FrameBufferRenderable for the game world
3. FOV/Lighting: Implement via alpha blending on cells
4. Sprites: ASCII characters or Unicode box-drawing for walls
5. HUD: Separate GroupRenderable with high z-index
6. Input: Arrow keys for movement, mouse for targeting/interaction
7. Animation: Use Timeline for smooth character movement between tiles
8. Inventory: Modal BoxRenderable with grid layout

The framework is incredibly capable - you can build anything from simple roguelikes to complex animated experiences. The key is understanding the rendering pipeline and working within the terminal's constraints.

● Update Todos
⎿  ☒ Analyze core framework components and dependencies from index.ts
☒ Examine key imported modules (Renderable, types, objects, etc.)
☒ Review example files to understand usage patterns
☒ Create comprehensive guide on framework architecture and usage
☐ Design dungeon crawler architecture using framework knowledge

✻ Thinking…

Now let me design the dungeon crawler architecture based on what I've learned about the framework.

● 🏰 Dungeon Crawler Architecture Design

Now let's design our dungeon crawler called "TUI Dungeon" using OpenTUI:

Core Game Structure

// src/examples/dungeon-crawler/index.ts
class DungeonCrawlerGame {
private renderer: CliRenderer
private gameWorld: GameWorld           // Main game logic
private renderEngine: DungeonRenderer  // Rendering system
private inputHandler: InputController  // Input management
private uiManager: UIManager          // HUD and menus

    // Frame buffers for layered rendering
    private worldBuffer: FrameBufferRenderable    // Tiles & entities
    private lightingBuffer: FrameBufferRenderable // FOV & lighting
    private effectsBuffer: FrameBufferRenderable  // Particles & effects
    private uiBuffer: FrameBufferRenderable       // UI overlay
}

World Representation

// Tile-based world with multi-layer rendering
interface Tile {
type: TileType           // floor, wall, door, stairs
sprite: string           // Unicode character
fg: RGBA                 // Foreground color
bg: RGBA                 // Background color
solid: boolean           // Collision
opacity: number          // Light blocking (0-1)
revealed: boolean        // Has been seen
visible: boolean         // Currently in FOV
items: Item[]           // Items on this tile
}

class DungeonMap {
private tiles: Tile[][]
private width: number
private height: number

    // Rendering tiles as 2x2 blocks for better visuals
    private readonly TILE_WIDTH = 2
    private readonly TILE_HEIGHT = 2
}

Entity System

abstract class Entity extends Renderable {
// Game properties
hp: number
maxHp: number
attack: number
defense: number
speed: number

    // Grid position (different from pixel position)
    gridX: number
    gridY: number

    // Animation state
    private moveAnimation?: TimelineAnimation

    moveToGrid(x: number, y: number) {
      // Smooth animation between grid positions
      this.moveAnimation = new Timeline()
        .to(this, {
          x: x * TILE_WIDTH,
          y: y * TILE_HEIGHT
        }, {
          duration: 200,
          ease: 'outQuad'
        })
    }
}

class Player extends Entity {
inventory: Item[]
level: number
exp: number

    protected renderSelf(buffer: OptimizedBuffer): void {
      // Render player sprite
      buffer.drawText("@", this.x, this.y, this.fg, this.bg, TextAttributes.BOLD)
    }
}

class Monster extends Entity {
ai: AIBehavior
lootTable: LootTable

    protected renderSelf(buffer: OptimizedBuffer): void {
      const sprite = this.getSprite() // e.g., "g" for goblin
      buffer.drawText(sprite, this.x, this.y, this.fg)
    }
}

Rendering Layers

class DungeonRenderer {
private readonly VIEWPORT_WIDTH = 80
private readonly VIEWPORT_HEIGHT = 40

    render(world: GameWorld, buffer: OptimizedBuffer) {
      // Layer 1: Base tiles
      this.renderTiles(world.map, buffer)

      // Layer 2: Items
      this.renderItems(world.items, buffer)

      // Layer 3: Entities (sorted by y-position)
      this.renderEntities(world.entities, buffer)

      // Layer 4: Effects
      this.renderEffects(world.effects, buffer)

      // Layer 5: Lighting/FOV overlay
      this.applyLighting(world.lighting, buffer)
    }

    private renderTiles(map: DungeonMap, buffer: OptimizedBuffer) {
      // Use box-drawing characters for walls
      const WALL_CHARS = {
        horizontal: '═',
        vertical: '║',
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        cross: '╬'
      }

      // Smart wall rendering based on neighbors
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.getTile(x, y)
          if (tile.type === TileType.Wall) {
            const char = this.getWallChar(map, x, y, WALL_CHARS)
            buffer.drawText(char, x * 2, y * 2, tile.fg, tile.bg)
          }
        }
      }
    }
}

FOV & Lighting System

class LightingSystem {
// Recursive shadowcasting for FOV
calculateFOV(origin: Point, radius: number, map: DungeonMap): Set<Point> {
const visible = new Set<Point>()

      // Cast shadows in 8 octants
      for (let octant = 0; octant < 8; octant++) {
        this.castShadows(origin, radius, octant, 1, 0, 1, map, visible)
      }

      return visible
    }

    renderLighting(buffer: OptimizedBuffer, fov: Set<Point>, map: DungeonMap) {
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const point = { x, y }
          const tile = map.getTile(x, y)

          if (!fov.has(point)) {
            if (tile.revealed) {
              // Previously seen - render dark
              const overlay = RGBA.fromValues(0, 0, 0, 0.7)
              buffer.fillRect(x * 2, y * 2, 2, 2, overlay)
            } else {
              // Never seen - render black
              const overlay = RGBA.fromValues(0, 0, 0, 1)
              buffer.fillRect(x * 2, y * 2, 2, 2, overlay)
            }
          } else {
            // Apply distance-based lighting falloff
            const dist = distance(origin, point)
            const brightness = Math.max(0, 1 - (dist / radius))
            if (brightness < 1) {
              const overlay = RGBA.fromValues(0, 0, 0, 1 - brightness)
              buffer.fillRect(x * 2, y * 2, 2, 2, overlay)
            }
          }
        }
      }
    }
}

UI System

class UIManager extends GroupRenderable {
private statusBar: StatusBar
private messageLog: MessageLog
private inventoryModal?: InventoryModal

    constructor(renderer: CliRenderer) {
      super("ui-manager")

      // Status bar at top
      this.statusBar = new StatusBar({
        x: 0,
        y: 0,
        width: renderer.terminalWidth,
        height: 3
      })

      // Message log at bottom
      this.messageLog = new MessageLog({
        x: 0,
        y: renderer.terminalHeight - 5,
        width: renderer.terminalWidth,
        height: 5
      })
    }
}

class StatusBar extends BoxRenderable {
update(player: Player) {
// Clear and redraw status
this.children.clear()

      // HP bar
      const hpBar = new ProgressBar({
        x: 2,
        y: 1,
        width: 20,
        value: player.hp,
        max: player.maxHp,
        fg: RGBA.fromHex("#ff0000"),
        label: `HP: ${player.hp}/${player.maxHp}`
      })
      this.add(hpBar)

      // Stats
      const stats = new TextRenderable("stats", {
        content: `LVL:${player.level} ATK:${player.attack} DEF:${player.defense}`,
        x: 25,
        y: 1,
        fg: "#ffffff"
      })
      this.add(stats)
    }
}

Input Handling

class InputController {
private moveQueue: Direction[] = []
private readonly keyMap = {
'w': Direction.North,
'a': Direction.West,
's': Direction.South,
'd': Direction.East,
'ArrowUp': Direction.North,
'ArrowLeft': Direction.West,
'ArrowDown': Direction.South,
'ArrowRight': Direction.East,

      // Diagonal movement
      'q': Direction.NorthWest,
      'e': Direction.NorthEast,
      'z': Direction.SouthWest,
      'c': Direction.SouthEast,

      // Actions
      'i': Action.Inventory,
      ' ': Action.Interact,
      'Enter': Action.Confirm,
      'Escape': Action.Cancel,
      'Tab': Action.NextTarget,
      '.': Action.Wait
    }

    handleKeyPress(key: ParsedKey): GameCommand? {
      if (this.keyMap[key.name]) {
        return {
          type: 'move',
          direction: this.keyMap[key.name]
        }
      }
      // Handle other inputs...
    }

    handleMouse(event: MouseEvent): GameCommand? {
      if (event.type === 'down') {
        // Convert screen coords to grid
        const gridX = Math.floor(event.x / TILE_WIDTH)
        const gridY = Math.floor(event.y / TILE_HEIGHT)

        return {
          type: 'examine',
          target: { x: gridX, y: gridY }
        }
      }
    }
}

Game Loop

class GameLoop {
private turnQueue: Entity[] = []
private currentTurn: number = 0

    async processTurn() {
      const entity = this.turnQueue[0]

      if (entity instanceof Player) {
        // Wait for player input
        const command = await this.waitForPlayerInput()
        this.executeCommand(entity, command)
      } else {
        // AI turn
        const action = entity.ai.decideAction(this.world)
        this.executeAction(entity, action)
      }

      // Rotate queue
      this.turnQueue.push(this.turnQueue.shift()!)
      this.currentTurn++

      // Update animations
      await this.waitForAnimations()
    }
}

Special Effects

class EffectSystem {
// Particle effects for spells
createFireball(start: Point, end: Point) {
const particles = new ParticleGenerator({
position: start,
velocity: vectorTo(start, end),
count: 20,
lifetime: 500,
colors: [
RGBA.fromHex("#ff0000"),
RGBA.fromHex("#ff6600"),
RGBA.fromHex("#ffaa00")
],
characters: ['*', '•', '°'],
spread: 0.3
})

      return particles
    }

    // Screen shake for impacts
    shake(renderer: CliRenderer, intensity: number = 5) {
      const timeline = new Timeline()
      const original = { x: 0, y: 0 }

      for (let i = 0; i < 5; i++) {
        timeline.to(renderer, {
          x: original.x + randInt(-intensity, intensity),
          y: original.y + randInt(-intensity, intensity)
        }, { duration: 50 })
      }

      timeline.to(renderer, original, { duration: 50 })
    }
}

Asset Definitions

const TILE_SPRITES = {
floor: { char: '·', fg: '#444444', bg: '#111111' },
wall: { char: '#', fg: '#888888', bg: '#222222' },
door_closed: { char: '+', fg: '#8B4513', bg: '#111111' },
door_open: { char: '/', fg: '#8B4513', bg: '#111111' },
stairs_down: { char: '>', fg: '#FFFF00', bg: '#111111' },
stairs_up: { char: '<', fg: '#FFFF00', bg: '#111111' },
water: { char: '~', fg: '#0099FF', bg: '#003366' },
lava: { char: '~', fg: '#FF4400', bg: '#660000' }
}

const ENTITY_SPRITES = {
player: { char: '@', fg: '#FFFFFF' },
goblin: { char: 'g', fg: '#00FF00' },
orc: { char: 'o', fg: '#008800' },
dragon: { char: 'D', fg: '#FF0000' },
chest: { char: '■', fg: '#FFD700' },
potion: { char: '!', fg: '#FF00FF' },
sword: { char: '/', fg: '#C0C0C0' },
gold: { char: '$', fg: '#FFD700' }
}

File Structure

src/examples/dungeon-crawler/
├── index.ts                 # Main entry point
├── game/
│   ├── GameWorld.ts        # Core game state
│   ├── GameLoop.ts         # Turn-based logic
│   ├── Entity.ts           # Base entity class
│   ├── Player.ts           # Player implementation
│   └── Monster.ts          # Enemy implementations
├── rendering/
│   ├── DungeonRenderer.ts  # Main renderer
│   ├── LightingSystem.ts   # FOV/lighting
│   └── EffectSystem.ts     # Particles/effects
├── ui/
│   ├── UIManager.ts        # UI orchestration
│   ├── StatusBar.ts        # Player stats
│   ├── MessageLog.ts       # Game messages
│   └── InventoryModal.ts   # Inventory screen
├── input/
│   └── InputController.ts  # Input handling
├── generation/
│   ├── DungeonGenerator.ts # Procedural dungeons
│   └── RoomTemplates.ts    # Prefab rooms
└── assets/
└── sprites.ts          # Sprite definitions

This architecture leverages OpenTUI's strengths while building a proper roguelike dungeon crawler. The layered rendering approach with FrameBuffers ensures smooth performance, while the entity system provides flexibility for different creature
types and behaviors.
