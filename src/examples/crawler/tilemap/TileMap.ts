import { RGBA } from "../../../types"
import sharp from "sharp"

// Constants for tile sizing
export const TILE_SIZE = 16 // 4x4 pixels per tile
export const TILE_PIXELS = TILE_SIZE * TILE_SIZE

export interface TileDefinition {
  name: string
  x: number // X position in tilemap (in tiles, not pixels)
  y: number // Y position in tilemap (in tiles, not pixels)
  solid?: boolean // For collision detection
  layer?: 'bottom' | 'sprite' | 'top' // Which layer this tile belongs to
}

export class TileMap {
  private imageData: ImageData | null = null
  private tileDefinitions: Map<string, TileDefinition> = new Map()
  private tileCache: Map<string, RGBA[]> = new Map() // Cache extracted tile pixel data
   onReady: () => void = () => {
    console.warn("TileMap is not ready, no onReady handler defined")
  }

  constructor(
  ) {}
  
  /**
   * Load tilemap from PNG file
   */
  async loadFromFile(path: string): Promise<void> {

    // Load and convert image to raw pixel data
    const { data, info } = await sharp(path)
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Store image data
    this.imageData = {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height,
      colorSpace: 'srgb'
    }
    this.onReady()

  }
  
  /**
   * Define a tile from the tilemap
   */
  defineTile(name: string, x: number, y: number, options?: {
    solid?: boolean
    layer?: 'bottom' | 'sprite' | 'top'
  }): void {
    this.tileDefinitions.set(name, {
      name,
      x,
      y,
      solid: options?.solid ?? false,
      layer: options?.layer ?? 'bottom'
    })
    
    // Clear cache for this tile if it exists
    this.tileCache.delete(name)
  }


  /**
   * Get pixel data for a specific tile
   */
  getTilePixels(tileName: string): RGBA[] | null {
    // Check cache first
    if (this.tileCache.has(tileName)) {
      return this.tileCache.get(tileName)!
    }
    const tileDef = this.tileDefinitions.get(tileName)
    if (!tileDef) {
      return null
    }

    // If we have image data, extract from it
    if (this.imageData) {
      const pixels: RGBA[] = []

      // Calculate pixel coordinates
      const startX = tileDef.x * TILE_SIZE
      const startY = tileDef.y * TILE_SIZE
      
      // Extract 4x4 pixel block
      for (let py = 0; py < TILE_SIZE; py++) {
        for (let px = 0; px < TILE_SIZE; px++) {
          const imageX = startX + px
          const imageY = startY + py
          
          // Calculate index in image data (RGBA format)
          const idx = ((imageY * this.imageData.width) + imageX) * 4
          
          // Extract RGBA values and normalize to 0-1 range
          const r = this.imageData.data[idx] / 255
          const g = this.imageData.data[idx + 1] / 255
          const b = this.imageData.data[idx + 2] / 255
          const a = this.imageData.data[idx + 3] / 255
          
          pixels.push(RGBA.fromValues(r, g, b, a))
        }
      }
      
      // Cache the result
      this.tileCache.set(tileName, pixels)
      
      return pixels
    }
    
    // No image data and no cached pixels
    return null
  }
  
  /**
   * Get tile definition
   */
  getTileDefinition(tileName: string): TileDefinition | undefined {
    return this.tileDefinitions.get(tileName)
  }
  
  /**
   * Get all tile names for a specific layer
   */
  getTilesForLayer(layer: 'bottom' | 'sprite' | 'top'): string[] {
    const tiles: string[] = []
    for (const [name, def] of this.tileDefinitions) {
      if (def.layer === layer) {
        tiles.push(name)
      }
    }
    return tiles
  }
}
