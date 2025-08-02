import { FrameBufferRenderable, GroupRenderable } from "../../core/objects.ts"
import { CliRenderer } from "../../core"
import { RGBA } from "../../core/types.ts"
import { TileMap, TILE_SIZE } from "./TileMap"

// Additional block characters for more rendering options
const BLOCK_CHARS = {
  FULL: '█',      // █ Full block
  UPPER: '▀',     // ▀ Upper half block
  LOWER: '▄',     // ▄ Lower half block
  LEFT: '▌',      // ▌ Left half block  
  RIGHT: '▐',     // ▐ Right half block
  SHADE_LIGHT: '░', // ░ Light shade
  SHADE_MED: '▒',   // ▒ Medium shade
  SHADE_DARK: '▓',  // ▓ Dark shade
}

export interface Entity {
  gridX: number
  gridY: number
  subX?: number // Sub-tile X position (0-3)
  subY?: number // Sub-tile Y position (0-3)
  width: number // Width in tiles (e.g., 2 for 2x1 entity)
  height: number // Height in tiles
  tileName: string
  layer: "sprite"
  facingLeft?: boolean // Whether the sprite should be flipped horizontally
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
    // Each 16x16 tile is rendered as 16 chars wide and 8 chars tall (using half-blocks)
    const pixelWidth = viewportWidth * TILE_SIZE
    const pixelHeight = viewportHeight * (TILE_SIZE / 2) // 16x16 tiles = 8 chars tall with half-blocks

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
   * Each tile is 16x16 pixels, rendered as 16x8 characters
   * Each character represents 2 pixels vertically using ▀ (upper) and ▄ (lower) blocks
   */
  private renderTile(
    layer: FrameBufferRenderable,
    tileName: string,
    gridX: number,
    gridY: number,
    offsetX: number = 0,
    offsetY: number = 0,
    flipHorizontal: boolean = false,
  ): void {
    const pixels = this.tileMap.getTilePixels(tileName)
    if (!pixels) return

    // Calculate character position (16x8 chars per tile)
    // offsetX and offsetY are in pixels, need to convert to character units
    const charOffsetX = Math.floor(offsetX / 1) // 1 pixel = 1 character horizontally
    const charOffsetY = Math.floor(offsetY / 2) // 2 pixels = 1 character vertically (half-blocks)
    
    const charX = gridX * TILE_SIZE + charOffsetX
    const charY = gridY * (TILE_SIZE / 2) + charOffsetY // Tiles are 8 chars tall

    // Process the 16x16 pixel tile as 16x8 characters
    // Each character combines 2 vertical pixels
    const charRows = TILE_SIZE / 2 // 8 character rows for 16 pixel rows
    
    for (let cy = 0; cy < charRows; cy++) { // 8 character rows
      for (let cx = 0; cx < TILE_SIZE; cx++) { // 16 character columns
        // Get the two pixels that this character represents
        const topPixelY = cy * 2 // Top pixel row (0, 2, 4, 6, 8, 10, 12, 14)
        const bottomPixelY = cy * 2 + 1 // Bottom pixel row (1, 3, 5, 7, 9, 11, 13, 15)
        
        // Flip horizontally by reading from opposite side
        const pixelX = flipHorizontal ? (TILE_SIZE - 1 - cx) : cx
        
        const topPixelIndex = topPixelY * TILE_SIZE + pixelX
        const bottomPixelIndex = bottomPixelY * TILE_SIZE + pixelX
        
        const topColor = pixels[topPixelIndex]
        const bottomColor = pixels[bottomPixelIndex]
        
        const topAlpha = topColor.buffer[3]
        const bottomAlpha = bottomColor.buffer[3]
        
        // Advanced rendering with multiple optimization strategies
        if (topAlpha > 0 && bottomAlpha > 0) {
          // Both pixels visible - choose optimal rendering strategy
          const topBrightness = (topColor.buffer[0] + topColor.buffer[1] + topColor.buffer[2]) / 3
          const bottomBrightness = (bottomColor.buffer[0] + bottomColor.buffer[1] + bottomColor.buffer[2]) / 3
          const brightnessDiff = Math.abs(topBrightness - bottomBrightness)
          
          // Color similarity check for better rendering
          const rDiff = Math.abs(topColor.buffer[0] - bottomColor.buffer[0])
          const gDiff = Math.abs(topColor.buffer[1] - bottomColor.buffer[1])
          const bDiff = Math.abs(topColor.buffer[2] - bottomColor.buffer[2])
          const colorDiff = (rDiff + gDiff + bDiff) / 3
          
          if (colorDiff < 0.05 && topAlpha > 0.95 && bottomAlpha > 0.95) {
            // Very similar colors with high opacity - use full block with average
            const avgColor = RGBA.fromValues(
              (topColor.buffer[0] + bottomColor.buffer[0]) / 2,
              (topColor.buffer[1] + bottomColor.buffer[1]) / 2,
              (topColor.buffer[2] + bottomColor.buffer[2]) / 2,
              (topAlpha + bottomAlpha) / 2
            )
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.FULL, avgColor, RGBA.fromValues(0, 0, 0, 0))
          } else if (topAlpha < 0.3 && bottomAlpha > 0.7) {
            // Top is mostly transparent - prefer lower block
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.LOWER, bottomColor, RGBA.fromValues(0, 0, 0, topAlpha * 0.3))
          } else if (bottomAlpha < 0.3 && topAlpha > 0.7) {
            // Bottom is mostly transparent - prefer upper block
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.UPPER, topColor, RGBA.fromValues(0, 0, 0, bottomAlpha * 0.3))
          } else if (brightnessDiff > 0.7) {
            // High contrast - use half blocks for sharp edges
            if (topBrightness > bottomBrightness) {
              // Bright on top, dark on bottom
              layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.UPPER, topColor, bottomColor)
            } else {
              // Dark on top, bright on bottom - can still use upper block
              layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.UPPER, topColor, bottomColor)
            }
          } else {
            // Default case - standard half block rendering
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.UPPER, topColor, bottomColor)
          }
        } else if (topAlpha > 0 && bottomAlpha === 0) {
          // Only top pixel visible
          if (topAlpha < 0.3) {
            // Very transparent - use shade character for subtle effect
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.SHADE_LIGHT, topColor, RGBA.fromValues(0, 0, 0, 0))
          } else {
            // Normal upper half block
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.UPPER, topColor, RGBA.fromValues(0, 0, 0, 0))
          }
        } else if (topAlpha === 0 && bottomAlpha > 0) {
          // Only bottom pixel visible
          if (bottomAlpha < 0.3) {
            // Very transparent - use shade character
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.SHADE_LIGHT, bottomColor, RGBA.fromValues(0, 0, 0, 0))
          } else {
            // Normal lower half block
            layer.frameBuffer.setCell(charX + cx, charY + cy, BLOCK_CHARS.LOWER, bottomColor, RGBA.fromValues(0, 0, 0, 0))
          }
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
  renderBottomLayer(tiles: string[][], cameraX: number = 0, cameraY: number = 0, subX: number = 0, subY: number = 0): void {
    // Clear with a dark background
    this.bottomLayer.frameBuffer.clear(RGBA.fromHex("#0a0a0a"))

    // Calculate pixel offset from sub-tile position (each sub-tile is 4 pixels)
    const pixelOffsetX = -subX * 4
    const pixelOffsetY = -subY * 4
    
    // Render one extra tile in each direction to handle partial tiles at edges
    const startX = subX > 0 ? -1 : 0
    const startY = subY > 0 ? -1 : 0
    const endX = this.viewportWidth + (subX > 0 ? 1 : 0)
    const endY = this.viewportHeight + (subY > 0 ? 1 : 0)

    // Draw tiles with sub-tile offset
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const worldX = x + cameraX
        const worldY = y + cameraY

        if (worldY >= 0 && worldY < tiles.length && worldX >= 0 && worldX < tiles[worldY].length) {
          const tileName = tiles[worldY][worldX]
          if (tileName) {
            this.renderTile(this.bottomLayer, tileName, x, y, pixelOffsetX, pixelOffsetY)
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
  renderSpriteLayer(entities: Entity[], cameraX: number = 0, cameraY: number = 0, subX: number = 0, subY: number = 0): void {
    this.spriteLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    // Sort entities by Y position for proper depth
    const sortedEntities = [...entities].sort((a, b) => {
      const aY = a.gridY + (a.subY || 0) / 4
      const bY = b.gridY + (b.subY || 0) / 4
      return aY - bY
    })

    for (const entity of sortedEntities) {
      // Calculate entity position with sub-tile precision
      const entitySubX = entity.subX || 0
      const entitySubY = entity.subY || 0
      
      // Calculate screen position in tiles
      const screenX = entity.gridX - cameraX
      const screenY = entity.gridY - cameraY
      
      // Calculate pixel offset for this entity
      const entityPixelOffsetX = (entitySubX - subX) * 4
      const entityPixelOffsetY = (entitySubY - subY) * 4

      // Check if entity is visible in viewport (with some margin for sub-tile offsets)
      if (
        screenX >= -entity.width - 1 &&
        screenX <= this.viewportWidth + 1 &&
        screenY >= -entity.height - 1 &&
        screenY <= this.viewportHeight + 1
      ) {
        // Render multi-tile entities with optional horizontal flip
        for (let ty = 0; ty < entity.height; ty++) {
          for (let tx = 0; tx < entity.width; tx++) {
            this.renderTile(
              this.spriteLayer, 
              entity.tileName, 
              screenX + tx, 
              screenY + ty,
              entityPixelOffsetX,
              entityPixelOffsetY,
              entity.facingLeft || false
            )
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
    subX: number = 0,
    subY: number = 0,
  ): void {
    this.topLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    // Calculate pixel offset from sub-tile position
    const pixelOffsetX = -subX * 4
    const pixelOffsetY = -subY * 4

    for (const overlay of overlayTiles) {
      const screenX = overlay.gridX - cameraX
      const screenY = overlay.gridY - cameraY

      // Check with margin for sub-tile offsets
      if (screenX >= -1 && screenX <= this.viewportWidth && screenY >= -1 && screenY <= this.viewportHeight) {
        this.renderTile(this.topLayer, overlay.tileName, screenX, screenY, pixelOffsetX, pixelOffsetY)
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
