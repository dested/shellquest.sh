#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, writeFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function generateTilemapData() {
  const assetsDir = join(process.cwd(), 'src', 'crawler', 'assets');
  const outputDir = join(process.cwd(), 'src', 'crawler', 'generated');
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Find all PNG files in assets directory
  const files = await readdir(assetsDir);
  const pngFiles = files.filter(f => extname(f).toLowerCase() === '.png');
  
  const tilemapData = {};

  for (const file of pngFiles) {
    const filePath = join(assetsDir, file);
    const name = basename(file, '.png');
    
    console.log(`Processing ${file}...`);
    
    // Load image data using sharp
    const { data, info } = await sharp(filePath)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Build palette from unique colors
    const colorMap = new Map();
    const pixels = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Create color key
      const colorKey = `${r},${g},${b},${a}`;
      
      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, colorMap.size);
      }
      
      pixels.push(colorMap.get(colorKey));
    }
    
    // Convert Map to array for palette
    const palette = Array.from(colorMap.keys()).map(key => {
      const [r, g, b, a] = key.split(',').map(Number);
      return [r, g, b, a];
    });
    
    // Encode pixels as base64
    // If palette has <= 256 colors, use Uint8Array, otherwise use Uint16Array
    let pixelData;
    let bytesPerPixel;
    
    if (palette.length <= 256) {
      // Use 1 byte per pixel
      pixelData = Buffer.from(new Uint8Array(pixels));
      bytesPerPixel = 1;
    } else {
      // Use 2 bytes per pixel
      const uint16Array = new Uint16Array(pixels);
      pixelData = Buffer.from(uint16Array.buffer);
      bytesPerPixel = 2;
    }
    
    const base64Pixels = pixelData.toString('base64');
    
    console.log(`  Dimensions: ${info.width}x${info.height}`);
    console.log(`  Palette size: ${palette.length} colors`);
    console.log(`  Pixel data: ${base64Pixels.length} chars (base64), ${bytesPerPixel} byte(s) per pixel`);
    
    // Store tilemap data
    tilemapData[name] = {
      width: info.width,
      height: info.height,
      palette,
      pixelsBase64: base64Pixels,
      bytesPerPixel
    };
  }
  
  // Generate TypeScript module
  const tsContent = `// Auto-generated tilemap data - DO NOT EDIT
// Generated at ${new Date().toISOString()}

export interface TilemapData {
  width: number;
  height: number;
  palette: number[][]; // [r, g, b, a] values (0-255)
  pixelsBase64: string; // Base64 encoded pixel indices
  bytesPerPixel: number; // 1 for <= 256 colors, 2 for > 256 colors
}

export const tilemapData: Record<string, TilemapData> = ${JSON.stringify(tilemapData, null, 2)};

/**
 * Decode base64 pixel data into array
 */
function decodePixels(pixelsBase64: string, bytesPerPixel: number): Uint8Array | Uint16Array {
  if (typeof window !== 'undefined' && window.atob) {
    // Browser environment
    const binaryString = window.atob(pixelsBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (bytesPerPixel === 1) {
      return bytes;
    } else {
      // Convert to Uint16Array
      const uint16Array = new Uint16Array(bytes.buffer);
      return uint16Array;
    }
  } else {
    // Node.js environment
    const buffer = Buffer.from(pixelsBase64, 'base64');
    
    if (bytesPerPixel === 1) {
      return new Uint8Array(buffer);
    } else {
      // Convert to Uint16Array
      return new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    }
  }
}

// Cache decoded pixel arrays
const pixelCache = new Map<TilemapData, Uint8Array | Uint16Array>();

/**
 * Get decoded pixels for a tilemap (with caching)
 */
function getPixels(tilemap: TilemapData): Uint8Array | Uint16Array {
  if (!pixelCache.has(tilemap)) {
    pixelCache.set(tilemap, decodePixels(tilemap.pixelsBase64, tilemap.bytesPerPixel));
  }
  return pixelCache.get(tilemap)!;
}

/**
 * Get pixel data at a specific position
 */
export function getPixelAt(tilemap: TilemapData, x: number, y: number): number[] | null {
  if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) {
    return null;
  }
  
  const pixels = getPixels(tilemap);
  const index = y * tilemap.width + x;
  const paletteIndex = pixels[index];
  return tilemap.palette[paletteIndex];
}

/**
 * Get normalized RGBA values (0-1 range) at a specific position
 */
export function getNormalizedPixelAt(tilemap: TilemapData, x: number, y: number): { r: number, g: number, b: number, a: number } | null {
  const pixel = getPixelAt(tilemap, x, y);
  if (!pixel) return null;
  
  return {
    r: pixel[0] / 255,
    g: pixel[1] / 255,
    b: pixel[2] / 255,
    a: pixel[3] / 255
  };
}
`;
  
  // Write generated TypeScript file
  const outputPath = join(outputDir, 'tilemapData.ts');
  await writeFile(outputPath, tsContent);
  
  console.log(`\nGenerated tilemap data at: ${outputPath}`);
  console.log(`Total tilemaps processed: ${pngFiles.length}`);
  
  // Print statistics
  for (const [name, data] of Object.entries(tilemapData)) {
    const pixelBytes = (data.pixelsBase64.length * 3) / 4; // Approximate decoded size
    const paletteBytes = data.palette.length * 4;
    const totalBytes = pixelBytes + paletteBytes;
    console.log(`  ${name}: ${data.width}x${data.height}, ${data.palette.length} colors, ~${(totalBytes / 1024).toFixed(1)}KB (base64: ${(data.pixelsBase64.length / 1024).toFixed(1)}KB)`);
  }
}

// Run the generator
generateTilemapData().catch(console.error);