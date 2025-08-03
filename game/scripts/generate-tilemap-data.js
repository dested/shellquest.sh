#!/usr/bin/env node
import sharp from "sharp";
import { readdir, writeFile } from "fs/promises";
import { join, basename, extname } from "path";
import { existsSync, mkdirSync } from "fs";

async function generateAssetData() {
  const tilemapsDir = join(process.cwd(), "src", "assets", "tilemaps");
  const imagesDir = join(process.cwd(), "src", "assets", "images");
  const outputPath = join(process.cwd(), "src", "game", "assets.ts");

  // Ensure directories exist
  if (!existsSync(tilemapsDir)) {
    mkdirSync(tilemapsDir, { recursive: true });
  }
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  const tilemapData = {};
  const imageData = {};

  // Process tilemaps
  if (existsSync(tilemapsDir)) {
    const tilemapFiles = await readdir(tilemapsDir);
    const tilemapPngs = tilemapFiles.filter((f) => extname(f).toLowerCase() === ".png");

    for (const file of tilemapPngs) {
      const filePath = join(tilemapsDir, file);
      const name = basename(file, ".png");

      console.log(`Processing tilemap: ${file}...`);

      const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });

      const colorMap = new Map();
      const pixels = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const colorKey = `${r},${g},${b},${a}`;

        if (!colorMap.has(colorKey)) {
          colorMap.set(colorKey, colorMap.size);
        }

        pixels.push(colorMap.get(colorKey));
      }

      const palette = Array.from(colorMap.keys()).map((key) => {
        const [r, g, b, a] = key.split(",").map(Number);
        return [r, g, b, a];
      });

      let pixelData;
      let bytesPerPixel;

      if (palette.length <= 256) {
        pixelData = Buffer.from(new Uint8Array(pixels));
        bytesPerPixel = 1;
      } else {
        const uint16Array = new Uint16Array(pixels);
        pixelData = Buffer.from(uint16Array.buffer);
        bytesPerPixel = 2;
      }

      const base64Pixels = pixelData.toString("base64");

      console.log(`  Dimensions: ${info.width}x${info.height}`);
      console.log(`  Palette size: ${palette.length} colors`);
      console.log(`  Pixel data: ${base64Pixels.length} chars (base64), ${bytesPerPixel} byte(s) per pixel`);

      tilemapData[name] = {
        width: info.width,
        height: info.height,
        palette,
        pixelsBase64: base64Pixels,
        bytesPerPixel,
      };
    }
  }

  // Process images
  if (existsSync(imagesDir)) {
    const imageFiles = await readdir(imagesDir);
    const imagePngs = imageFiles.filter((f) => extname(f).toLowerCase() === ".png");

    for (const file of imagePngs) {
      const filePath = join(imagesDir, file);
      const name = basename(file, ".png");

      console.log(`Processing image: ${file}...`);

      const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });

      const colorMap = new Map();
      const pixels = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const colorKey = `${r},${g},${b},${a}`;

        if (!colorMap.has(colorKey)) {
          colorMap.set(colorKey, colorMap.size);
        }

        pixels.push(colorMap.get(colorKey));
      }

      const palette = Array.from(colorMap.keys()).map((key) => {
        const [r, g, b, a] = key.split(",").map(Number);
        return [r, g, b, a];
      });

      let pixelData;
      let bytesPerPixel;

      if (palette.length <= 256) {
        pixelData = Buffer.from(new Uint8Array(pixels));
        bytesPerPixel = 1;
      } else {
        const uint16Array = new Uint16Array(pixels);
        pixelData = Buffer.from(uint16Array.buffer);
        bytesPerPixel = 2;
      }

      const base64Pixels = pixelData.toString("base64");

      console.log(`  Dimensions: ${info.width}x${info.height}`);
      console.log(`  Palette size: ${palette.length} colors`);
      console.log(`  Pixel data: ${base64Pixels.length} chars (base64), ${bytesPerPixel} byte(s) per pixel`);

      imageData[name] = {
        width: info.width,
        height: info.height,
        palette,
        pixelsBase64: base64Pixels,
        bytesPerPixel,
      };
    }
  }

  // Generate TypeScript module
  const tsContent = `// Auto-generated asset data - DO NOT EDIT
// Generated at ${new Date().toISOString()}

export interface AssetData {
  width: number;
  height: number;
  palette: number[][]; // [r, g, b, a] values (0-255)
  pixelsBase64: string; // Base64 encoded pixel indices
  bytesPerPixel: number; // 1 for <= 256 colors, 2 for > 256 colors
}

// Tilemap data for tile-based rendering
export const TileMaps: Record<string, AssetData> = ${JSON.stringify(tilemapData, null, 2)};

// Image data for standalone images
export const Assets: Record<string, AssetData> = ${JSON.stringify(imageData, null, 2)};

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
const pixelCache = new Map<AssetData, Uint8Array | Uint16Array>();

/**
 * Get decoded pixels for an asset (with caching)
 */
export function getPixels(asset: AssetData): Uint8Array | Uint16Array {
  if (!pixelCache.has(asset)) {
    pixelCache.set(asset, decodePixels(asset.pixelsBase64, asset.bytesPerPixel));
  }
  return pixelCache.get(asset)!;
}

/**
 * Get pixel data at a specific position
 */
export function getPixelAt(asset: AssetData, x: number, y: number): number[] | null {
  if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
    return null;
  }
  
  const pixels = getPixels(asset);
  const index = y * asset.width + x;
  const paletteIndex = pixels[index];
  return asset.palette[paletteIndex];
}

/**
 * Get normalized RGBA values (0-1 range) at a specific position
 */
export function getNormalizedPixelAt(asset: AssetData, x: number, y: number): { r: number, g: number, b: number, a: number } | null {
  const pixel = getPixelAt(asset, x, y);
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
  await writeFile(outputPath, tsContent);

  console.log(`\nGenerated asset data at: ${outputPath}`);
  console.log(`Total tilemaps processed: ${Object.keys(tilemapData).length}`);
  console.log(`Total images processed: ${Object.keys(imageData).length}`);

  // Print statistics
  console.log("\nTilemaps:");
  for (const [name, data] of Object.entries(tilemapData)) {
    const pixelBytes = (data.pixelsBase64.length * 3) / 4;
    const paletteBytes = data.palette.length * 4;
    const totalBytes = pixelBytes + paletteBytes;
    console.log(
      `  ${name}: ${data.width}x${data.height}, ${data.palette.length} colors, ~${(totalBytes / 1024).toFixed(1)}KB (base64: ${(data.pixelsBase64.length / 1024).toFixed(1)}KB)`,
    );
  }

  console.log("\nImages:");
  for (const [name, data] of Object.entries(imageData)) {
    const pixelBytes = (data.pixelsBase64.length * 3) / 4;
    const paletteBytes = data.palette.length * 4;
    const totalBytes = pixelBytes + paletteBytes;
    console.log(
      `  ${name}: ${data.width}x${data.height}, ${data.palette.length} colors, ~${(totalBytes / 1024).toFixed(1)}KB (base64: ${(data.pixelsBase64.length / 1024).toFixed(1)}KB)`,
    );
  }
}

// Run the generator
generateAssetData().catch(console.error);