import { FrameBufferRenderable, GroupRenderable } from "../../../objects"
import { CliRenderer } from "../../../index"
import { RGBA } from "../../../types"
import { TileMap, TILE_SIZE } from "./TileMap"

export interface Entity {
  gridX: number
  gridY: number
  width: number // Width in tiles (e.g., 2 for 2x1 entity)
  height: number // Height in tiles
  tileName: string
  layer: "sprite"
}

export class LayeredRenderer {
  private bottomLayer: FrameBufferRenderable
  private spriteLayer: FrameBufferRenderable
  private topLayer: FrameBufferRenderable
  private container: GroupRenderable

  constructor(
    private renderer: CliRenderer,
    private tileMap: TileMap,
    private viewportWidth: number, // Viewport width in tiles
    private viewportHeight: number, // Viewport height in tiles
    x: number = 0,
    y: number = 0,
  ) {
    // Create container for all layers
    this.container = new GroupRenderable("layered-renderer", { x: x, y: y, zIndex: 2, visible: true })

    const pixelWidth = viewportWidth * TILE_SIZE
    const pixelHeight = viewportHeight * TILE_SIZE

    // Create OptimizedBuffers using the renderer's lib
    const bottomBuffer = (renderer as any).lib.createOptimizedBuffer(pixelWidth, pixelHeight, false)
    const spriteBuffer = (renderer as any).lib.createOptimizedBuffer(pixelWidth, pixelHeight, true)
    const topBuffer = (renderer as any).lib.createOptimizedBuffer(pixelWidth, pixelHeight, true)

    // Create FrameBufferRenderables from the buffers
    this.bottomLayer = new FrameBufferRenderable("bottom-layer", bottomBuffer, {
      x: 0,
      y: 0,
      width: pixelWidth,
      height: pixelHeight,
      zIndex: 0,
    })

    this.spriteLayer = new FrameBufferRenderable("sprite-layer", spriteBuffer, {
      x: 0,
      y: 0,
      width: pixelWidth,
      height: pixelHeight,
      zIndex: 1,
    })

    this.topLayer = new FrameBufferRenderable("top-layer", topBuffer, {
      x: 0,
      y: 0,
      width: pixelWidth,
      height: pixelHeight,
      zIndex: 2,
    })

    // Add layers to container
    this.container.add(this.bottomLayer)
    this.container.add(this.spriteLayer)
    this.container.add(this.topLayer)
  }

  /**
   * Render a tile at a specific grid position
   */
  private renderTile(
    layer: FrameBufferRenderable,
    tileName: string,
    gridX: number,
    gridY: number,
    offsetX: number = 0,
    offsetY: number = 0,
  ): void {
    const pixels = this.tileMap.getTilePixels(tileName)
    if (!pixels) return

    // Calculate pixel position
    const pixelX = gridX * TILE_SIZE + offsetX
    const pixelY = gridY * TILE_SIZE + offsetY

    // Draw each pixel of the tile
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const pixelIndex = py * TILE_SIZE + px
        const color = pixels[pixelIndex]

        // Only draw if not fully transparent
        if (color.buffer[3] > 0) {
          // Use a solid block character to show the color
          layer.frameBuffer.setCell(pixelX + px, pixelY + py, '█', color, RGBA.fromValues(0, 0, 0, 0))
        }
      }
    }
  }

  /**
   * Clear all layers
   */
  clear(): void {
    // Clear with a dark background for bottom layer
    this.bottomLayer.frameBuffer.clear(RGBA.fromHex("#0a0a0a"))
    this.spriteLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0)) // Transparent
    this.topLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0)) // Transparent
    
    // Debug: Draw a test message to verify rendering
    this.bottomLayer.frameBuffer.drawText("GAME WORLD", 2, 2, RGBA.fromHex("#ffffff"), RGBA.fromHex("#000000"))
  }

  /**
   * Render the bottom layer (full grid of tiles)
   */
  renderBottomLayer(tiles: string[][], cameraX: number = 0, cameraY: number = 0): void {
    // Clear with a dark background
    this.bottomLayer.frameBuffer.clear(RGBA.fromHex("#0a0a0a"))

    // Draw tiles
    for (let y = 0; y < this.viewportHeight; y++) {
      for (let x = 0; x < this.viewportWidth; x++) {
        const worldX = x + cameraX
        const worldY = y + cameraY

        if (worldY >= 0 && worldY < tiles.length && worldX >= 0 && worldX < tiles[worldY].length) {
          const tileName = tiles[worldY][worldX]
          if (tileName) {
            this.renderTile(this.bottomLayer, tileName, x, y)
          }
        }
      }
    }
    
    // Force a refresh of the framebuffer
    this.bottomLayer.needsUpdate = true
  }

  /**
   * Render entities on the sprite layer
   */
  renderSpriteLayer(entities: Entity[], cameraX: number = 0, cameraY: number = 0): void {
    this.spriteLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    // Sort entities by Y position for proper depth
    const sortedEntities = [...entities].sort((a, b) => a.gridY - b.gridY)

    for (const entity of sortedEntities) {
      // Check if entity is visible in viewport
      const screenX = entity.gridX - cameraX
      const screenY = entity.gridY - cameraY

      if (
        screenX >= -entity.width &&
        screenX < this.viewportWidth &&
        screenY >= -entity.height &&
        screenY < this.viewportHeight
      ) {
        // Render multi-tile entities
        for (let ty = 0; ty < entity.height; ty++) {
          for (let tx = 0; tx < entity.width; tx++) {
            this.renderTile(this.spriteLayer, entity.tileName, screenX + tx, screenY + ty)
          }
        }
      }
    }
    
    // Force a refresh
    this.spriteLayer.needsUpdate = true
  }

  /**
   * Render overlay effects on the top layer
   */
  renderTopLayer(
    overlayTiles: Array<{ tileName: string; gridX: number; gridY: number }>,
    cameraX: number = 0,
    cameraY: number = 0,
  ): void {
    this.topLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    for (const overlay of overlayTiles) {
      const screenX = overlay.gridX - cameraX
      const screenY = overlay.gridY - cameraY

      if (screenX >= 0 && screenX < this.viewportWidth && screenY >= 0 && screenY < this.viewportHeight) {
        this.renderTile(this.topLayer, overlay.tileName, screenX, screenY)
      }
    }
  }

  /**
   * Get the container renderable
   */
  getContainer(): GroupRenderable {
    return this.container
  }

  /**
   * Update position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x
    this.container.y = y
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    // Destroy the framebuffers
    this.bottomLayer.frameBuffer.destroy()
    this.spriteLayer.frameBuffer.destroy()
    this.topLayer.frameBuffer.destroy()
    
    // Remove the container from the renderer
    this.renderer.remove(this.container.id)
  }
}
