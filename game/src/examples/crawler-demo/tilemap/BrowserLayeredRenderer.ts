import { FrameBufferRenderable, GroupRenderable } from "../../core/objects.ts"
import { RGBA } from "../../core/types.ts"
import { TileMap, TILE_SIZE } from "./TileMap"
import { OptimizedBuffer } from "../../core-browser/browser-buffer"

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

export class BrowserLayeredRenderer {
  private bottomLayer: FrameBufferRenderable
  private spriteLayer: FrameBufferRenderable
  private topLayer: FrameBufferRenderable
  private container: GroupRenderable

  constructor(
    private renderer: any, // Browser renderer
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

    // Create OptimizedBuffers for browser
    const bottomBuffer = new OptimizedBuffer(pixelWidth, pixelHeight, false)
    const spriteBuffer = new OptimizedBuffer(pixelWidth, pixelHeight, true)
    const topBuffer = new OptimizedBuffer(pixelWidth, pixelHeight, true)

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
    if (!pixels) {
      // Debug: Draw a placeholder if tile not found
      if (gridX === 0 && gridY === 0) {
        console.warn(`Tile not found: ${tileName}`)
      }
      return
    }

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
        
        const topAlpha = topColor.a
        const bottomAlpha = bottomColor.a
        
        // Advanced rendering with multiple optimization strategies
        if (topAlpha > 0 && bottomAlpha > 0) {
          // Both pixels visible - choose optimal rendering strategy
          const topBrightness = (topColor.r + topColor.g + topColor.b) / 3
          const bottomBrightness = (bottomColor.r + bottomColor.g + bottomColor.b) / 3
          const brightnessDiff = Math.abs(topBrightness - bottomBrightness)
          
          // Color similarity check for better rendering
          const rDiff = Math.abs(topColor.r - bottomColor.r)
          const gDiff = Math.abs(topColor.g - bottomColor.g)
          const bDiff = Math.abs(topColor.b - bottomColor.b)
          const colorDiff = (rDiff + gDiff + bDiff) / 3
          
          if (colorDiff < 0.05 && topAlpha > 0.95 && bottomAlpha > 0.95) {
            // Very similar colors with high opacity - use full block with average
            const avgColor = RGBA.fromValues(
              (topColor.r + bottomColor.r) / 2,
              (topColor.g + bottomColor.g) / 2,
              (topColor.b + bottomColor.b) / 2,
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
    this.bottomLayer.frameBuffer.clear(RGBA.fromValues(0.04, 0.04, 0.04, 1))
    this.spriteLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0)) // Transparent
    this.topLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0)) // Transparent
  }

  /**
   * Render the bottom layer (full grid of tiles)
   */
  renderBottomLayer(tiles: string[][], cameraX: number = 0, cameraY: number = 0, subX: number = 0, subY: number = 0): void {
    // Clear with a dark background
    this.bottomLayer.frameBuffer.clear(RGBA.fromValues(0.04, 0.04, 0.04, 1))

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
    // Clear sprite layer (transparent)
    this.spriteLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    // Calculate pixel offset from sub-tile position
    const pixelOffsetX = -subX * 4
    const pixelOffsetY = -subY * 4

    for (const entity of entities) {
      // Check if entity is within viewport (with some margin for larger entities)
      const relX = entity.gridX - cameraX
      const relY = entity.gridY - cameraY
      
      if (relX >= -entity.width && relX <= this.viewportWidth && 
          relY >= -entity.height && relY <= this.viewportHeight) {
        
        // Calculate total pixel offset including entity's sub-tile position
        const entitySubX = entity.subX || 0
        const entitySubY = entity.subY || 0
        const totalOffsetX = pixelOffsetX + entitySubX * 4
        const totalOffsetY = pixelOffsetY + entitySubY * 4
        
        // Render the entity's sprite
        this.renderTile(
          this.spriteLayer, 
          entity.tileName, 
          relX, 
          relY,
          totalOffsetX,
          totalOffsetY,
          entity.facingLeft || false
        )
      }
    }
    
    this.spriteLayer.needsUpdate = true
  }

  /**
   * Render the top layer (overlays, effects, etc.)
   */
  renderTopLayer(tiles: (string | null)[][], cameraX: number = 0, cameraY: number = 0, subX: number = 0, subY: number = 0): void {
    // Clear top layer (transparent)
    this.topLayer.frameBuffer.clear(RGBA.fromValues(0, 0, 0, 0))

    // Calculate pixel offset from sub-tile position
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
            this.renderTile(this.topLayer, tileName, x, y, pixelOffsetX, pixelOffsetY)
          }
        }
      }
    }
    
    this.topLayer.needsUpdate = true
  }

  /**
   * Get the container group for adding to the renderer
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
   * Destroy and clean up
   */
  destroy(): void {
    this.bottomLayer.destroy()
    this.spriteLayer.destroy()
    this.topLayer.destroy()
    this.container.destroy()
  }
}
