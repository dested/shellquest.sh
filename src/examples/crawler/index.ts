#!/usr/bin/env bun

import {
  CliRenderer,
  createCliRenderer,
  TextRenderable,
  BoxRenderable,
  GroupRenderable,
  FrameBufferRenderable,
  RGBA,
  type ParsedKey,
  type MouseEvent,
} from "../../index.ts"
import { getKeyHandler } from "../../ui/lib/KeyHandler.ts"
import { TileMap, TILE_SIZE } from "./tilemap/TileMap.ts"
import { LayeredRenderer, type Entity } from "./tilemap/LayeredRenderer.ts"
import { Level } from "./Level.ts"
import { renderFontToFrameBuffer, measureText } from "../../ui/ascii.font.ts"

// Game constants
const MAP_WIDTH = 200
const MAP_HEIGHT = 200

class Player implements Entity {
  gridX: number = 10
  gridY: number = 10
  width: number = 1
  height: number = 1
  tileName: string = "player"
  layer: "sprite" = "sprite"

  hp: number = 70
  maxHp: number = 100
  mana: number = 20
  maxMana: number = 50
}

class Camera {
  constructor(private game: DungeonCrawlerGame) {}

  x: number = 0
  y: number = 0

  get viewportWidth(): number {
    // Each 16x16 tile is 16 characters wide
    return Math.floor(this.game.renderer.terminalWidth / TILE_SIZE) - 1
  }
  get viewportHeight(): number {
    // Each 16x16 tile is 8 characters tall with half-block rendering
    // Subtract UI space (16 lines for larger UI), then divide by 8 chars per tile
    return Math.floor((this.game.renderer.terminalHeight - 16) / (TILE_SIZE / 2))
  }

  update(playerX: number, playerY: number): void {
    // Calculate ideal camera position to center player
    const idealX = playerX - Math.floor(this.viewportWidth / 2)
    const idealY = playerY - Math.floor(this.viewportHeight / 2)

    // Clamp to map bounds
    this.x = Math.max(0, Math.min(idealX, MAP_WIDTH - this.viewportWidth))
    this.y = Math.max(0, Math.min(idealY, MAP_HEIGHT - this.viewportHeight))
  }
}

class DungeonCrawlerGame {
  renderer: CliRenderer
  private player: Player
  private level: Level
  private camera: Camera
  private tileMap: TileMap
  private layeredRenderer: LayeredRenderer

  // UI elements
  private gameContainer: GroupRenderable
  private mapBorder: BoxRenderable
  private healthBar: GroupRenderable
  private manaBar: GroupRenderable

  // Movement state
  private moveDirection = { x: 0, y: 0 }
  private moveInterval: NodeJS.Timeout | null = null
  private moveSpeed = 50 // ms between moves when holding key

  constructor(renderer: CliRenderer) {
    this.renderer = renderer
    this.player = new Player()
    this.level = new Level(MAP_WIDTH, MAP_HEIGHT)
    this.camera = new Camera(this)

    // Initialize tile map (will be loaded from PNG later)
    this.tileMap = new TileMap()
    this.level.setupTileDefinitions(this.tileMap)

    this.gameContainer = new GroupRenderable("game-container", { x: 0, y: 0, zIndex: 0, visible: true })
    this.renderer.add(this.gameContainer)

    this.setupUI()
    this.setupLayeredRenderer()
    this.setupInput()

    // Generate procedural dungeon level and add player
    this.level.procedurallyGenerateLevel()
    this.level.addEntity(this.player)

    // Center camera on player
    this.camera.update(this.player.gridX, this.player.gridY)

    this.update()
    this.tileMap.onReady = () => {
      this.update()
    }
    renderer.on("resize", () => {
      this.gameContainer.clear()
      this.setupUI()
      this.update()
    })
  }

  private setupLayeredRenderer(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight
    const gameAreaY = 16 // Updated to account for larger UI with block font
    // Each 16x16 tile is 16 chars wide
    const gameAreaX = Math.floor((width - (this.camera.viewportWidth * TILE_SIZE + 4)) / 2)

    this.layeredRenderer = new LayeredRenderer(
      this.renderer,
      this.tileMap,
      this.camera.viewportWidth,
      this.camera.viewportHeight,
      gameAreaX + 2,
      gameAreaY + 0,
    )

    this.gameContainer.add(this.layeredRenderer.getContainer())
  }

  private setupUI(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight

    // --- UI BAR HEIGHTS ---
    const barHeight = 12 // Much taller bars to fit block font (5 lines tall)
    const barWidth = Math.floor((width - 8) / 2) // 2 bars with spacing
    const barY = 1
    const barPadding = 3

    // --- HEALTH BAR (LEFT) ---
    this.healthBar = new GroupRenderable("health-bar", { x: barPadding, y: barY, zIndex: 10, visible: true })

    // Fancy health container with gradient-like background
    const healthBg = new BoxRenderable("health-bg", {
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight,
      borderStyle: "heavy",
      borderColor: "#ff4444",
      bg: "#2a0000",
      zIndex: 10,
    })
    this.healthBar.add(healthBg)

    // Decorative corner elements
    const healthCornerTL = new TextRenderable("health-corner-tl", {
      x: 1,
      y: 0,
      content: "♦",
      fg: "#ff6666",
      zIndex: 13,
    })
    this.healthBar.add(healthCornerTL)

    const healthCornerTR = new TextRenderable("health-corner-tr", {
      x: barWidth - 2,
      y: 0,
      content: "♦",
      fg: "#ff6666",
      zIndex: 13,
    })
    this.healthBar.add(healthCornerTR)

    // Title with block font using FrameBufferRenderable
    const healthTitleText = "HEALTH"
    const { width: healthTitleWidth, height: healthTitleHeight } = measureText({ 
      text: healthTitleText, 
      font: "block" 
    })
    const healthTitleX = Math.floor((barWidth - healthTitleWidth) / 2)
    
    const healthTitle = this.renderer.createFrameBuffer("health-title", {
      width: healthTitleWidth,
      height: healthTitleHeight,
      x: healthTitleX,
      y: 1,
      zIndex: 11,
    })
    healthTitle.frameBuffer.clear(RGBA.fromInts(42, 0, 0, 0))
    
    renderFontToFrameBuffer(healthTitle.frameBuffer, {
      text: healthTitleText,
      x: 0,
      y: 0,
      fg: [RGBA.fromInts(255, 120, 120, 255), RGBA.fromInts(255, 80, 80, 255)],
      bg: RGBA.fromInts(42, 0, 0, 255),
      font: "block",
    })
    this.healthBar.add(healthTitle)

    // Health bar background track (positioned below block font text)
    const healthTrackBg = new BoxRenderable("health-track-bg", {
      x: 3,
      y: 7,  // Below the 5-line tall block font
      width: barWidth - 6,
      height: 3,
      bg: "#330000",
      borderStyle: "single",
      borderColor: "#660000",
      zIndex: 11,
    })
    this.healthBar.add(healthTrackBg)

    // Animated health fill with gradient effect
    const healthPercent = this.player.hp / this.player.maxHp
    const healthFillWidth = Math.max(0, Math.floor((barWidth - 8) * healthPercent))
    
    // Main fill
    const healthFill = new BoxRenderable("health-fill", {
      x: 4,
      y: 8,
      width: healthFillWidth,
      height: 1,
      bg: "#ff3333",
      zIndex: 12,
    })
    this.healthBar.add(healthFill)

    // Highlight on top of fill
    if (healthFillWidth > 0) {
      const healthFillHighlight = new BoxRenderable("health-fill-highlight", {
        x: 4,
        y: 8,
        width: Math.min(healthFillWidth, Math.floor(healthFillWidth * 0.7)),
        height: 1,
        bg: "#ff6666",
        zIndex: 13,
      })
      this.healthBar.add(healthFillHighlight)
    }

    this.gameContainer.add(this.healthBar)

    // --- MANA BAR (RIGHT) ---
    this.manaBar = new GroupRenderable("mana-bar", {
      x: barPadding + barWidth + 2,
      y: barY,
      zIndex: 10,
      visible: true,
    })

    // Fancy mana container
    const manaBg = new BoxRenderable("mana-bg", {
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight,
      borderStyle: "heavy",
      borderColor: "#4499ff",
      bg: "#001a3a",
      zIndex: 10,
    })
    this.manaBar.add(manaBg)

    // Decorative corner elements
    const manaCornerTL = new TextRenderable("mana-corner-tl", {
      x: 1,
      y: 0,
      content: "◊",
      fg: "#66aaff",
      zIndex: 13,
    })
    this.manaBar.add(manaCornerTL)

    const manaCornerTR = new TextRenderable("mana-corner-tr", {
      x: barWidth - 2,
      y: 0,
      content: "◊",
      fg: "#66aaff",
      zIndex: 13,
    })
    this.manaBar.add(manaCornerTR)

    // Title with block font using FrameBufferRenderable
    const manaTitleText = "MANA"
    const { width: manaTitleWidth, height: manaTitleHeight } = measureText({ 
      text: manaTitleText, 
      font: "block" 
    })
    const manaTitleX = Math.floor((barWidth - manaTitleWidth) / 2)
    
    const manaTitle = this.renderer.createFrameBuffer("mana-title", {
      width: manaTitleWidth,
      height: manaTitleHeight,
      x: manaTitleX,
      y: 1,
      zIndex: 11,
    })
    manaTitle.frameBuffer.clear(RGBA.fromInts(0, 26, 58, 0))
    
    renderFontToFrameBuffer(manaTitle.frameBuffer, {
      text: manaTitleText,
      x: 0,
      y: 0,
      fg: [RGBA.fromInts(120, 180, 255, 255), RGBA.fromInts(80, 140, 255, 255)],
      bg: RGBA.fromInts(0, 26, 58, 255),
      font: "block",
    })
    this.manaBar.add(manaTitle)

    // Mana bar background track (positioned below block font text)
    const manaTrackBg = new BoxRenderable("mana-track-bg", {
      x: 3,
      y: 7,  // Below the 5-line tall block font
      width: barWidth - 6,
      height: 3,
      bg: "#001133",
      borderStyle: "single",
      borderColor: "#003366",
      zIndex: 11,
    })
    this.manaBar.add(manaTrackBg)

    // Animated mana fill with gradient effect
    const manaPercent = this.player.mana / this.player.maxMana
    const manaFillWidth = Math.max(0, Math.floor((barWidth - 8) * manaPercent))
    
    // Main fill
    const manaFill = new BoxRenderable("mana-fill", {
      x: 4,
      y: 8,
      width: manaFillWidth,
      height: 1,
      bg: "#0099ff",
      zIndex: 12,
    })
    this.manaBar.add(manaFill)

    // Highlight on top of fill
    if (manaFillWidth > 0) {
      const manaFillHighlight = new BoxRenderable("mana-fill-highlight", {
        x: 4,
        y: 8,
        width: Math.min(manaFillWidth, Math.floor(manaFillWidth * 0.7)),
        height: 1,
        bg: "#33bbff",
        zIndex: 13,
      })
      this.manaBar.add(manaFillHighlight)
    }

    this.gameContainer.add(this.manaBar)

    // --- DECORATIVE DIVIDER ---
    const dividerY = barHeight + 2
    const divider = new TextRenderable("divider", {
      x: 0,
      y: dividerY,
      content: "═".repeat(width),
      fg: "#666666",
      zIndex: 5,
    })
    this.gameContainer.add(divider)

    // --- GAME WORLD BORDER (FULL WIDTH/HEIGHT, BELOW BARS) ---
    const mapBorderY = dividerY + 1
    const mapBorderHeight = height - mapBorderY
    const mapBorderWidth = width
    const mapBorderX = 0

    this.mapBorder = new BoxRenderable("map-border", {
      x: mapBorderX,
      y: mapBorderY,
      width: mapBorderWidth,
      height: mapBorderHeight,
      borderStyle: "heavy",
      borderColor: "#8a7f76",
      bg: "#000000",
      title: "",
      titleAlignment: "center",
      zIndex: 2,
    })
    this.gameContainer.add(this.mapBorder)

    // Additional decorative elements on the border
    const leftDecor = new TextRenderable("left-decor", {
      x: 2,
      y: mapBorderY,
      content: "╬═══╬",
      fg: "#aa9988",
      zIndex: 3,
    })
    this.gameContainer.add(leftDecor)

    const rightDecor = new TextRenderable("right-decor", {
      x: width - 7,
      y: mapBorderY,
      content: "╬═══╬",
      fg: "#aa9988",
      zIndex: 3,
    })
    this.gameContainer.add(rightDecor)
  }

  private setupInput(): void {
    const keyHandler = getKeyHandler()

    keyHandler.on("keydown", (key: ParsedKey) => {
      let dx = 0
      let dy = 0

      switch (key.name) {
        case "w":
        case "up":
          dy = -1
          break
        case "s":
        case "down":
          dy = 1
          break
        case "a":
        case "left":
          dx = -1
          break
        case "d":
        case "right":
          dx = 1
          break
      }

      if (dx !== 0 || dy !== 0) {
        this.moveDirection.x = dx
        this.moveDirection.y = dy

        // Immediately move once
        this.movePlayer(dx, dy)

        // Start continuous movement if not already moving
        if (!this.moveInterval) {
          this.moveInterval = setInterval(() => {
            if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
              this.movePlayer(this.moveDirection.x, this.moveDirection.y)
            }
          }, this.moveSpeed)
        }
      }
    })

    keyHandler.on("keyup", (key: ParsedKey) => {
      // Check if this key was part of current movement
      switch (key.name) {
        case "w":
        case "up":
          if (this.moveDirection.y === -1) {
            this.moveDirection.y = 0
          }
          break
        case "s":
        case "down":
          if (this.moveDirection.y === 1) {
            this.moveDirection.y = 0
          }
          break
        case "a":
        case "left":
          if (this.moveDirection.x === -1) {
            this.moveDirection.x = 0
          }
          break
        case "d":
        case "right":
          if (this.moveDirection.x === 1) {
            this.moveDirection.x = 0
          }
          break
      }

      // Stop movement if no direction is active
      if (this.moveDirection.x === 0 && this.moveDirection.y === 0 && this.moveInterval) {
        clearInterval(this.moveInterval)
        this.moveInterval = null
      }
    })
  }

  private movePlayer(dx: number, dy: number): void {
    const newX = this.player.gridX + dx
    const newY = this.player.gridY + dy

    if (!this.level.isSolid(newX, newY)) {
      this.player.gridX = newX
      this.player.gridY = newY
      this.camera.update(this.player.gridX, this.player.gridY)
      this.update()
    }
  }

  private update(): void {
    // Clear all layers
    this.layeredRenderer.clear()
    // Render bottom layer (tiles)
    this.layeredRenderer.renderBottomLayer(this.level.getBottomLayerTiles(), this.camera.x, this.camera.y)

    // Render sprite layer (entities including player)
    this.layeredRenderer.renderSpriteLayer(this.level.getEntities(), this.camera.x, this.camera.y)

    // Render top layer (overlays)
    this.layeredRenderer.renderTopLayer(this.level.getTopLayerTiles(), this.camera.x, this.camera.y)

    this.renderer.renderOnce()
  }

  destroy(): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }
    this.layeredRenderer.destroy()
    
    // Clean up frame buffers
    this.renderer.remove("health-title")
    this.renderer.remove("mana-title")
    
    this.renderer.remove(this.gameContainer.id)
  }
}

export async function run(renderer: CliRenderer): Promise<void> {
  renderer.setBackgroundColor("#000000")
  const game = new DungeonCrawlerGame(renderer)

  // Store game instance for cleanup
  ;(renderer as any)._dungeonCrawlerGame = game
}

export function destroy(renderer: CliRenderer): void {
  const game = (renderer as any)._dungeonCrawlerGame as DungeonCrawlerGame | undefined
  if (game) {
    game.destroy()
    delete (renderer as any)._dungeonCrawlerGame
  }

  // Clear any remaining elements
  renderer.pause()
  renderer.clearTerminal()
}

// Allow direct execution
if (import.meta.main) {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  })

  renderer.setBackgroundColor("#000000")
  await run(renderer)
}
