#!/usr/bin/env bun

import {
  CliRenderer,
  createCliRenderer,
  TextRenderable,
  BoxRenderable,
  GroupRenderable,
  RGBA,
  type ParsedKey,
  type MouseEvent,
} from "../../index.ts"
import { getKeyHandler } from "../../ui/lib/KeyHandler.ts"
import { TileMap, TILE_SIZE } from "./tilemap/TileMap.ts"
import { LayeredRenderer, type Entity } from "./tilemap/LayeredRenderer.ts"
import { Level } from "./Level.ts"

// Game constants
const MAP_WIDTH = 50
const MAP_HEIGHT = 50
const VIEWPORT_WIDTH = 20 // Viewport width in tiles
const VIEWPORT_HEIGHT = 15 // Viewport height in tiles

class Player implements Entity {
  gridX: number = 25
  gridY: number = 25
  width: number = 1
  height: number = 1
  tileName: string = "player"
  layer: "sprite" = "sprite"

  hp: number = 100
  maxHp: number = 100
  mana: number = 50
  maxMana: number = 50
}

class Camera {
  x: number = 0
  y: number = 0

  update(playerX: number, playerY: number): void {
    // Calculate ideal camera position to center player
    const idealX = playerX - Math.floor(VIEWPORT_WIDTH / 2)
    const idealY = playerY - Math.floor(VIEWPORT_HEIGHT / 2)

    // Clamp to map bounds
    this.x = Math.max(0, Math.min(idealX, MAP_WIDTH - VIEWPORT_WIDTH))
    this.y = Math.max(0, Math.min(idealY, MAP_HEIGHT - VIEWPORT_HEIGHT))
  }
}

class DungeonCrawlerGame {
  private renderer: CliRenderer
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

  constructor(renderer: CliRenderer) {
    this.renderer = renderer
    this.player = new Player()
    this.level = new Level(MAP_WIDTH, MAP_HEIGHT)
    this.camera = new Camera()

    // Initialize tile map (will be loaded from PNG later)
    this.tileMap = new TileMap(16, 16) // Assuming 16x16 tile sheet
    this.setupTileDefinitions()

    this.gameContainer = new GroupRenderable("game-container", { x: 0, y: 0, zIndex: 0, visible: true })
    this.renderer.add(this.gameContainer)

    this.setupUI()
    this.setupLayeredRenderer()
    this.setupInput()

    // Generate test level and add player
    this.level.generateTestLevel()
    this.level.addEntity(this.player)

    // Center camera on player
    this.camera.update(this.player.gridX, this.player.gridY)

    this.update()
  }

  private setupTileDefinitions(): void {
    // Define tiles based on your sprite map positions
    // These are placeholder definitions - you'll update with actual positions

    // Bottom layer tiles (grass variations)
    this.tileMap.defineTile("grass", 0, 0, { layer: "bottom" })
    this.tileMap.defineTile("grass_border_top", 1, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_border_bottom", 2, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_border_left", 3, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_border_right", 4, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_corner_tl", 5, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_corner_tr", 6, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_corner_bl", 7, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("grass_corner_br", 8, 0, { layer: "bottom", solid: true })
    this.tileMap.defineTile("dirt", 0, 1, { layer: "bottom" })

    // Sprite layer tiles (entities)
    this.tileMap.defineTile("player", 0, 2, { layer: "sprite" })
    this.tileMap.defineTile("rock", 1, 2, { layer: "sprite", solid: true })
    this.tileMap.defineTile("bush", 2, 2, { layer: "sprite" })

    // Top layer tiles (effects, overlays)
    this.tileMap.defineTile("shadow", 0, 3, { layer: "top" })

    // Set temporary colored pixels for testing
    // Grass - green with some texture
    this.tileMap.setTemporaryTilePixels("grass", RGBA.fromHex("#2d5a2d"), [
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ])

    // Grass borders - darker green
    const borderPattern = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]
    this.tileMap.setTemporaryTilePixels("grass_border_top", RGBA.fromHex("#1a3a1a"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_border_bottom", RGBA.fromHex("#1a3a1a"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_border_left", RGBA.fromHex("#1a3a1a"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_border_right", RGBA.fromHex("#1a3a1a"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_corner_tl", RGBA.fromHex("#0f2a0f"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_corner_tr", RGBA.fromHex("#0f2a0f"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_corner_bl", RGBA.fromHex("#0f2a0f"), borderPattern)
    this.tileMap.setTemporaryTilePixels("grass_corner_br", RGBA.fromHex("#0f2a0f"), borderPattern)

    // Dirt - brown
    this.tileMap.setTemporaryTilePixels("dirt", RGBA.fromHex("#6b4423"), [
      [1, 1, 0, 1],
      [1, 0, 1, 1],
      [0, 1, 1, 1],
      [1, 1, 1, 0],
    ])

    // Player - yellow
    this.tileMap.setTemporaryTilePixels("player", RGBA.fromHex("#ffff00"), [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
    ])

    // Rock - gray
    this.tileMap.setTemporaryTilePixels("rock", RGBA.fromHex("#808080"), [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [0, 1, 1, 0],
    ])

    // Bush - dark green
    this.tileMap.setTemporaryTilePixels("bush", RGBA.fromHex("#0f4f0f"), [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [0, 0, 1, 0],
    ])

    // Shadow - semi-transparent black
    this.tileMap.setTemporaryTilePixels("shadow", RGBA.fromValues(0, 0, 0, 0.5))
  }

  private setupLayeredRenderer(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight
    const gameAreaY = 6
    const gameAreaX = Math.floor((width - (VIEWPORT_WIDTH * TILE_SIZE + 4)) / 2)

    this.layeredRenderer = new LayeredRenderer(
      this.renderer,
      this.tileMap,
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      gameAreaX + 2,
      gameAreaY + 1,
    )

    this.gameContainer.add(this.layeredRenderer.getContainer())
  }

  private setupUI(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight

    // Create health bar at top
    this.healthBar = new GroupRenderable("health-bar", { x: 0, y: 0, zIndex: 1, visible: true })
    this.healthBar.x = 0
    this.healthBar.y = 0

    const healthBg = new BoxRenderable("health-bg", {
      x: 0,
      y: 0,
      width: width,
      height: 3,
      borderStyle: "double",
      borderColor: "#ff0000",
      bg: "#1a0000",
      title: " HEALTH ",
      titleAlignment: "center",
      zIndex: 1,
    })
    this.healthBar.add(healthBg)

    const healthFill = new BoxRenderable("health-fill", {
      x: 2,
      y: 1,
      width: Math.floor((width - 4) * (this.player.hp / this.player.maxHp)),
      height: 1,
      bg: "#ff0000",
      zIndex: 1,
    })
    this.healthBar.add(healthFill)

    const healthText = new TextRenderable("health-text", {
      x: Math.floor(width / 2) - 5,
      y: 1,
      content: `${this.player.hp}/${this.player.maxHp}`,
      fg: "#ffffff",
      zIndex: 1,
    })
    this.healthBar.add(healthText)

    this.gameContainer.add(this.healthBar)

    // Create mana bar below health
    this.manaBar = new GroupRenderable("mana-bar", { x: 0, y: 3, zIndex: 1, visible: true })
    this.manaBar.x = 0
    this.manaBar.y = 3

    const manaBg = new BoxRenderable("mana-bg", {
      x: 0,
      y: 0,
      width: width,
      height: 3,
      borderStyle: "double",
      borderColor: "#0099ff",
      bg: "#001a33",
      title: " MANA ",
      titleAlignment: "center",
      zIndex: 1,
    })
    this.manaBar.add(manaBg)

    const manaFill = new BoxRenderable("mana-fill", {
      x: 2,
      y: 1,
      width: Math.floor((width - 4) * (this.player.mana / this.player.maxMana)),
      height: 1,
      bg: "#0099ff",
      zIndex: 1,
    })
    this.manaBar.add(manaFill)

    const manaText = new TextRenderable("mana-text", {
      x: Math.floor(width / 2) - 5,
      y: 1,
      content: `${this.player.mana}/${this.player.maxMana}`,
      fg: "#ffffff",
      zIndex: 1,
    })
    this.manaBar.add(manaText)

    this.gameContainer.add(this.manaBar)

    // Create game world view with border
    const gameAreaY = 6
    const gameAreaHeight = height - gameAreaY - 2
    const gameAreaWidth = Math.min(width - 4, VIEWPORT_WIDTH * TILE_SIZE + 4)
    const gameAreaX = Math.floor((width - gameAreaWidth) / 2)

    this.mapBorder = new BoxRenderable("map-border", {
      x: gameAreaX,
      y: gameAreaY,
      width: gameAreaWidth,
      height: gameAreaHeight,
      borderStyle: "rounded",
      borderColor: "#8a7f76",
      bg: "#000000",
      title: " DUNGEON DEPTHS ",
      titleAlignment: "center",
      zIndex: 2,
    })
    this.gameContainer.add(this.mapBorder)
  }

  private setupInput(): void {
    getKeyHandler().on("keypress", (key: ParsedKey) => {
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
        this.movePlayer(dx, dy)
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
debugger;
    // Render bottom layer (tiles)
    this.layeredRenderer.renderBottomLayer(this.level.getBottomLayerTiles(), this.camera.x, this.camera.y)

    // Render sprite layer (entities including player)
    // this.layeredRenderer.renderSpriteLayer(this.level.getEntities(), this.camera.x, this.camera.y)

    // Render top layer (overlays)
    // this.layeredRenderer.renderTopLayer(this.level.getTopLayerTiles(), this.camera.x, this.camera.y)

    this.renderer.renderOnce()
  }

  destroy(): void {
    this.layeredRenderer.destroy()
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
