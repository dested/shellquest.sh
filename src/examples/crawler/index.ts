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
    return this.game.renderer.terminalWidth / 4 - 1
  }
  get viewportHeight(): number {
    return this.game.renderer.terminalHeight / 4 - 2 // 3px for each UI bar + 1px gap
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
      debugger;
      this.gameContainer.clear()
      this.setupUI()
      this.update()
    })
  }

  private setupLayeredRenderer(): void {
    const width = this.renderer.terminalWidth
    const height = this.renderer.terminalHeight
    const gameAreaY = 6
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
    const barHeight = 3
    const barWidth = Math.floor((width - 6) / 2) // 2 bars, 2px padding each side, 2px between
    const barY = 0
    const barPadding = 2

    // --- HEALTH BAR (LEFT) ---
    this.healthBar = new GroupRenderable("health-bar", { x: barPadding, y: barY, zIndex: 10, visible: true })

    const healthBg = new BoxRenderable("health-bg", {
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight,
      borderStyle: "double",
      borderColor: "#ff0000",
      bg: "#1a0000",
      title: " HEALTH ",
      titleAlignment: "center",
      zIndex: 10,
    })
    this.healthBar.add(healthBg)

    const healthFill = new BoxRenderable("health-fill", {
      x: 2,
      y: 1,
      width: Math.max(0, Math.floor((barWidth - 4) * (this.player.hp / this.player.maxHp))),
      height: 1,
      bg: "#ff0000",
      zIndex: 11,
    })
    this.healthBar.add(healthFill)

    const healthText = new TextRenderable("health-text", {
      x: Math.floor(barWidth / 2) - 5,
      y: 1,
      content: `${this.player.hp}/${this.player.maxHp}`,
      fg: "#ffffff",
      zIndex: 12,
    })
    this.healthBar.add(healthText)

    this.gameContainer.add(this.healthBar)

    // --- MANA BAR (RIGHT) ---
    this.manaBar = new GroupRenderable("mana-bar", {
      x: barPadding + barWidth + barPadding,
      y: barY,
      zIndex: 10,
      visible: true,
    })

    const manaBg = new BoxRenderable("mana-bg", {
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight,
      borderStyle: "double",
      borderColor: "#0099ff",
      bg: "#001a33",
      title: " MANA ",
      titleAlignment: "center",
      zIndex: 10,
    })
    this.manaBar.add(manaBg)

    const manaFill = new BoxRenderable("mana-fill", {
      x: 2,
      y: 1,
      width: Math.max(0, Math.floor((barWidth - 4) * (this.player.mana / this.player.maxMana))),
      height: 1,
      bg: "#0099ff",
      zIndex: 11,
    })
    this.manaBar.add(manaFill)

    const manaText = new TextRenderable("mana-text", {
      x: Math.floor(barWidth / 2) - 5,
      y: 1,
      content: `${this.player.mana}/${this.player.maxMana}`,
      fg: "#ffffff",
      zIndex: 12,
    })
    this.manaBar.add(manaText)

    this.gameContainer.add(this.manaBar)

    // --- GAME WORLD BORDER (FULL WIDTH/HEIGHT, BELOW BARS) ---
    const mapBorderY = barHeight + 1 // 1px gap below bars
    const mapBorderHeight = height - mapBorderY
    const mapBorderWidth = width
    const mapBorderX = 0

    this.mapBorder = new BoxRenderable("map-border", {
      x: mapBorderX,
      y: mapBorderY,
      width: mapBorderWidth,
      height: mapBorderHeight,
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
    // Render bottom layer (tiles)
    this.layeredRenderer.renderBottomLayer(this.level.getBottomLayerTiles(), this.camera.x, this.camera.y)

    // Render sprite layer (entities including player)
    this.layeredRenderer.renderSpriteLayer(this.level.getEntities(), this.camera.x, this.camera.y)

    // Render top layer (overlays)
    this.layeredRenderer.renderTopLayer(this.level.getTopLayerTiles(), this.camera.x, this.camera.y)

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
