import { tilemapData, getNormalizedPixelAt, type TilemapData } from "./generated/tilemapData";

// Constants for tile sizing
export const TILE_SIZE = 16; // 4x4 pixels per tile
export const TILE_PIXELS = TILE_SIZE * TILE_SIZE;

export interface TileDefinition {
  name: string;
  x: number; // X position in tilemap (in tiles, not pixels)
  y: number; // Y position in tilemap (in tiles, not pixels)
  solid?: boolean; // For collision detection
  layer?: "bottom" | "sprite" | "top"; // Which layer this tile belongs to
}

export class TileMap {
  private tilemapData: TilemapData | null = null;
  private tilemapName: string | null = null;
  private tileDefinitions: Map<string, TileDefinition> = new Map();
  private tileCache: Map<string, RGBA[]> = new Map(); // Cache extracted tile pixel data
  onReady: () => void = () => {
    console.warn("TileMap is not ready, no onReady handler defined");
  };

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
    this.onReady();
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
    },
  ): void {
    this.tileDefinitions.set(name, {
      name,
      x,
      y,
      solid: options?.solid ?? false,
      layer: options?.layer ?? "bottom",
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

    debugger;
    // If we have tilemap data, extract from it
    if (this.tilemapData) {
      const pixels: RGBA[] = [];

      // Calculate pixel coordinates
      const startX = tileDef.x * TILE_SIZE;
      const startY = tileDef.y * TILE_SIZE;
      function rgbaToHex(r: number, g: number, b: number, a: number): string {
        const hex = (value: number) =>
          Math.round(value * 255)
            .toString(16)
            .padStart(2, "0");
        return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
      }
      // Extract 4x4 pixel block
      for (let py = 0; py < TILE_SIZE; py++) {
        for (let px = 0; px < TILE_SIZE; px++) {
          const imageX = startX + px;
          const imageY = startY + py;

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
export class RGBA {
  buffer: Float32Array;

  constructor(buffer: Float32Array) {
    this.buffer = buffer;
  }

  static fromArray(array: Float32Array) {
    return new RGBA(array);
  }

  static fromValues(r: number, g: number, b: number, a: number = 1.0) {
    return new RGBA(new Float32Array([r, g, b, a]));
  }

  static fromInts(r: number, g: number, b: number, a: number = 255) {
    return new RGBA(new Float32Array([r / 255, g / 255, b / 255, a / 255]));
  }

  static fromHex(hex: string): RGBA {
    return hexToRgb(hex);
  }

  get r(): number {
    return this.buffer[0];
  }

  set r(value: number) {
    this.buffer[0] = value;
  }

  get g(): number {
    return this.buffer[1];
  }

  set g(value: number) {
    this.buffer[1] = value;
  }

  get b(): number {
    return this.buffer[2];
  }

  set b(value: number) {
    this.buffer[2] = value;
  }

  get a(): number {
    return this.buffer[3];
  }

  set a(value: number) {
    this.buffer[3] = value;
  }

  map<R>(fn: (value: number) => R) {
    return [fn(this.r), fn(this.g), fn(this.b), fn(this.a)];
  }

  toString() {
    return `rgba(${this.r.toFixed(2)}, ${this.g.toFixed(2)}, ${this.b.toFixed(2)}, ${this.a.toFixed(2)})`;
  }
}
export function hexToRgb(hex: string): RGBA {
  hex = hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn(`Invalid hex color: ${hex}, defaulting to magenta`);
    return RGBA.fromValues(1, 0, 1, 1);
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return RGBA.fromValues(r, g, b, 1);
}
