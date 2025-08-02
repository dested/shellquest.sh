import { RGBA } from "../../../core/types.ts"
import { tilemapData, getNormalizedPixelAt, type TilemapData } from "../generated/tilemapData"

// Constants for tile sizing
export const TILE_SIZE = 16 // 4x4 pixels per tile
export const TILE_PIXELS = TILE_SIZE * TILE_SIZE

export interface TileDefinition {
  name: string;
  x: number; // X position in tilemap (in tiles, not pixels)
  y: number; // Y position in tilemap (in tiles, not pixels)
  solid?: boolean; // For collision detection
  layer?: "bottom" | "sprite" | "top"; // Which layer this tile belongs to
  flipX?: boolean; // Whether to flip tile horizontally
  flipY?: boolean; // Whether to flip tile vertically
}

export class TileMap {
  private tilemapData: TilemapData | null = null;
  private tilemapName: string | null = null;
  private tileDefinitions: Map<string, TileDefinition> = new Map();
  private tileCache: Map<string, RGBA[]> = new Map(); // Cache extracted tile pixel data

  constructor() {}

  /**
   * Load tilemap from generated data
   */
  async loadFromFile(path: string): Promise<void> {
    // Extract tilemap name from path (e.g., "tilemap_packed.png" -> "tilemap_packed")
    const match = path.match(/([^/\\]+)\.png$/i);
    if (!match) {
      throw new Error(`Invalid tilemap path: ${path}`);
    }

    const tilemapName = match[1];

    // Load from generated data
    if (!(tilemapName in tilemapData)) {
      throw new Error(`Tilemap data not found for: ${tilemapName}. Run 'npm run build:tilemap' to generate.`);
    }

    this.tilemapData = tilemapData[tilemapName];
    this.tilemapName = tilemapName;
  }

  /**
   * Define a tile from the tilemap
   */
  defineTile(
    name: string,
    x: number,
    y: number,
    options?: {
      solid?: boolean;
      layer?: "bottom" | "sprite" | "top";
      flipX?: boolean;
      flipY?: boolean;
    },
  ): void {
    this.tileDefinitions.set(name, {
      name,
      x,
      y,
      solid: options?.solid ?? false,
      layer: options?.layer ?? "bottom",
      flipX: options?.flipX ?? false, // Add flipX option
      flipY: options?.flipY ?? false, // Add flipY option
    });

    // Clear cache for this tile if it exists
    this.tileCache.delete(name);
  }

  /**
   * Get pixel data for a specific tile
   */
  getTilePixels(tileName: string): RGBA[] | null {
    // Check cache first
    if (this.tileCache.has(tileName)) {
      return this.tileCache.get(tileName)!;
    }
    const tileDef = this.tileDefinitions.get(tileName);
    if (!tileDef) {
      return null;
    }

    // If we have tilemap data, extract from it
    if (this.tilemapData) {
      const pixels: RGBA[] = [];

      const flipX = tileDef.flipX ?? false; // Check for flipX option
      const flipY = tileDef.flipY ?? false; // Check for flipY option

      // Calculate pixel coordinates
      const startX = tileDef.x * TILE_SIZE;
      const startY = tileDef.y * TILE_SIZE;
      // Extract 16x16 pixel block with flip support
      for (let py = 0; py < TILE_SIZE; py++) {
        for (let px = 0; px < TILE_SIZE; px++) {
          // Apply flipX and flipY by mirroring the pixel indices
          const srcPx = flipX ? TILE_SIZE - 1 - px : px;
          const srcPy = flipY ? TILE_SIZE - 1 - py : py;

          const imageX = startX + srcPx;
          const imageY = startY + srcPy;

          // Get normalized pixel data from generated tilemap
          const pixel = getNormalizedPixelAt(this.tilemapData, imageX, imageY);

          if (pixel) {
            // Convert pixel to RGBA format
            pixels.push(RGBA.fromValues(pixel.r, pixel.g, pixel.b, pixel.a));
          } else {
            // Default to transparent if out of bounds
            pixels.push(RGBA.fromValues(0, 0, 0, 0));
          }
        }
      }

      // Cache the result
      this.tileCache.set(tileName, pixels);

      return pixels;
    }

    // No tilemap data and no cached pixels
    return null;
  }

  /**
   * Get tile definition
   */
  getTileDefinition(tileName: string): TileDefinition | undefined {
    return this.tileDefinitions.get(tileName);
  }

  /**
   * Get all tile names for a specific layer
   */
  getTilesForLayer(layer: "bottom" | "sprite" | "top"): string[] {
    const tiles: string[] = [];
    for (const [name, def] of this.tileDefinitions) {
      if (def.layer === layer) {
        tiles.push(name);
      }
    }
    return tiles;
  }
}
