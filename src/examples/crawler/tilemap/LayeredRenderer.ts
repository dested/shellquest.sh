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

    // Adjust dimensions for half-block rendering
    // Each tile is 4 chars wide and 2 chars tall
    const pixelWidth = viewportWidth * TILE_SIZE
    const pixelHeight = viewportHeight * 2 // Now tiles are 2 chars tall

    // Create OptimizedBuffers using the renderer's lib
    const bottomBuffer = renderer.lib.createOptimizedBuffer(pixelWidth, pixelHeight, false)
    const spriteBuffer = renderer.lib.createOptimizedBuffer(pixelWidth, pixelHeight, true)
    const topBuffer = renderer.lib.createOptimizedBuffer(pixelWidth, pixelHeight, true)

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
   * Render a tile at a specific grid position using half-block characters
   * Each tile is 4x4 pixels, rendered as 4x2 characters
   * Each character represents 2 pixels vertically using ▀ (upper) and ▄ (lower) blocks
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

    // Calculate character position (4x2 chars per tile)
    const charX = gridX * TILE_SIZE + offsetX
    const charY = gridY * 2 + Math.floor(offsetY / 2) // Now tiles are 2 chars tall

    // Process the 4x4 pixel tile as 4x2 characters
    // Each character combines 2 vertical pixels
    for (let cy = 0; cy < 2; cy++) { // 2 character rows
      for (let cx = 0; cx < TILE_SIZE; cx++) { // 4 character columns
        // Get the two pixels that this character represents
        const topPixelY = cy * 2 // Top pixel row (0 or 2)
        const bottomPixelY = cy * 2 + 1 // Bottom pixel row (1 or 3)
        
        const topPixelIndex = topPixelY * TILE_SIZE + cx
        const bottomPixelIndex = bottomPixelY * TILE_SIZE + cx
        
        const topColor = pixels[topPixelIndex]
        const bottomColor = pixels[bottomPixelIndex]
        
        const topAlpha = topColor.buffer[3]
        const bottomAlpha = bottomColor.buffer[3]
        
        // Determine which character to use based on transparency
        if (topAlpha > 0 && bottomAlpha > 0) {
          // Both pixels visible - use upper half block with top as foreground, bottom as background
          layer.frameBuffer.setCell(charX + cx, charY + cy, '▀', topColor, bottomColor)
        } else if (topAlpha > 0 && bottomAlpha === 0) {
          // Only top pixel visible - use upper half block
          layer.frameBuffer.setCell(charX + cx, charY + cy, '▀', topColor, RGBA.fromValues(0, 0, 0, 0))
        } else if (topAlpha === 0 && bottomAlpha > 0) {
          // Only bottom pixel visible - use lower half block
          layer.frameBuffer.setCell(charX + cx, charY + cy, '▄', bottomColor, RGBA.fromValues(0, 0, 0, 0))
        }
        // If both are transparent, don't draw anything
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
