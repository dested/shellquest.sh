#!/usr/bin/env node
import sharp from "sharp";
import { readdir, writeFile, stat } from "fs/promises";
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

      // Convert palette to base64
      const paletteBuffer = Buffer.from(new Uint8Array(palette.flat()));
      const paletteBase64 = paletteBuffer.toString("base64");

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
        paletteColors: palette.length,
        paletteBase64,
        pixelsBase64: base64Pixels,
        bytesPerPixel,
      };
    }
  }

  // Process images and animations
  if (existsSync(imagesDir)) {
    const entries = await readdir(imagesDir);
    
    for (const entry of entries) {
      const entryPath = join(imagesDir, entry);
      const entryStat = await stat(entryPath);
      
      if (entryStat.isDirectory() && entry.endsWith('.gif')) {
        // Process animation folder (e.g., torch.gif/)
        const name = basename(entry, '.gif');
        console.log(`Processing animation: ${entry}...`);
        
        const frameFiles = await readdir(entryPath);
        const framePngs = frameFiles
          .filter((f) => extname(f).toLowerCase() === ".png")
          .sort((a, b) => {
            // Sort frames numerically (frame1.png, frame2.png, etc.)
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });
        
        if (framePngs.length === 0) {
          console.log(`  Warning: No frames found in ${entry}`);
          continue;
        }
        
        const frames = [];
        let animWidth = 0;
        let animHeight = 0;
        
        for (const frameFile of framePngs) {
          const framePath = join(entryPath, frameFile);
          const { data, info } = await sharp(framePath).raw().toBuffer({ resolveWithObject: true });
          
          if (animWidth === 0) {
            animWidth = info.width;
            animHeight = info.height;
          } else if (info.width !== animWidth || info.height !== animHeight) {
            console.log(`  Warning: Frame ${frameFile} has different dimensions`);
          }
          
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
          
          // Convert palette to base64
          const paletteBuffer = Buffer.from(new Uint8Array(palette.flat()));
          const paletteBase64 = paletteBuffer.toString("base64");
          
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
          
          frames.push({
            paletteColors: palette.length,
            paletteBase64,
            pixelsBase64: base64Pixels,
            bytesPerPixel,
          });
        }
        
        console.log(`  Dimensions: ${animWidth}x${animHeight}`);
        console.log(`  Frames: ${frames.length}`);
        
        imageData[name] = {
          width: animWidth,
          height: animHeight,
          frames,
          isAnimation: true,
        };
        
      } else if (!entryStat.isDirectory() && extname(entry).toLowerCase() === '.png') {
        // Process single image
        const filePath = entryPath;
        const name = basename(entry, ".png");
        
        console.log(`Processing image: ${entry}...`);
        
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
        
        // Convert palette to base64
        const paletteBuffer = Buffer.from(new Uint8Array(palette.flat()));
        const paletteBase64 = paletteBuffer.toString("base64");
        
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
          paletteColors: palette.length,
          paletteBase64,
          pixelsBase64: base64Pixels,
          bytesPerPixel,
          isAnimation: false,
        };
      }
    }
  }

  // Generate TypeScript module
  const tsContent = `// Auto-generated asset data - DO NOT EDIT
// Generated at ${new Date().toISOString()}

export interface AssetFrame {
  paletteColors: number; // Number of colors in palette
  paletteBase64: string; // Base64 encoded palette (RGBA bytes)
  pixelsBase64: string; // Base64 encoded pixel indices
  bytesPerPixel: number; // 1 for <= 256 colors, 2 for > 256 colors
}

export interface AssetData {
  width: number;
  height: number;
  isAnimation?: boolean;
  // For single images
  paletteColors?: number; // Number of colors in palette
  paletteBase64?: string; // Base64 encoded palette (RGBA bytes)
  pixelsBase64?: string; // Base64 encoded pixel indices
  bytesPerPixel?: number; // 1 for <= 256 colors, 2 for > 256 colors
  // For animations
  frames?: AssetFrame[];
}
// Tilemap data for tile-based rendering
export const TileMaps: Record<string, AssetData> = ${JSON.stringify(tilemapData, null, 2)};

// Image data for standalone images
export const Assets: Record<string, AssetData> = ${JSON.stringify(imageData, null, 2)};

/**
 * Decode base64 data into Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  if (typeof window !== 'undefined' && window.atob) {
    // Browser environment
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

/**
 * Decode base64 pixel data into array
 */
function decodePixels(pixelsBase64: string, bytesPerPixel: number): Uint8Array | Uint16Array {
  const bytes = decodeBase64(pixelsBase64);
  
  if (bytesPerPixel === 1) {
    return bytes;
  } else {
    // Convert to Uint16Array
    return new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
  }
}

/**
 * Decode base64 palette into RGBA array
 */
function decodePalette(paletteBase64: string, paletteColors: number): number[][] {
  const bytes = decodeBase64(paletteBase64);
  const palette: number[][] = [];
  
  for (let i = 0; i < paletteColors * 4; i += 4) {
    palette.push([bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]]);
  }
  
  return palette;
}

// Cache decoded data
const pixelCache = new Map<string, Uint8Array | Uint16Array>();
const paletteCache = new Map<string, number[][]>();

/**
 * Get decoded pixels for an asset (with caching)
 */
export function getPixels(asset: AssetData, frameIndex: number = 0): Uint8Array | Uint16Array {
  let pixelsBase64: string;
  let bytesPerPixel: number;
  let cacheKey: string;
  
  if (asset.isAnimation && asset.frames) {
    const frame = asset.frames[frameIndex % asset.frames.length];
    pixelsBase64 = frame.pixelsBase64;
    bytesPerPixel = frame.bytesPerPixel;
    cacheKey = \`\${pixelsBase64}_\${frameIndex}\`;
  } else {
    pixelsBase64 = asset.pixelsBase64!;
    bytesPerPixel = asset.bytesPerPixel!;
    cacheKey = pixelsBase64;
  }
  
  if (!pixelCache.has(cacheKey)) {
    pixelCache.set(cacheKey, decodePixels(pixelsBase64, bytesPerPixel));
  }
  return pixelCache.get(cacheKey)!;
}

/**
 * Get decoded palette for an asset (with caching)
 */
export function getPalette(asset: AssetData, frameIndex: number = 0): number[][] {
  let paletteBase64: string;
  let paletteColors: number;
  
  if (asset.isAnimation && asset.frames) {
    const frame = asset.frames[frameIndex % asset.frames.length];
    paletteBase64 = frame.paletteBase64;
    paletteColors = frame.paletteColors;
  } else {
    paletteBase64 = asset.paletteBase64!;
    paletteColors = asset.paletteColors!;
  }
  
  if (!paletteCache.has(paletteBase64)) {
    paletteCache.set(paletteBase64, decodePalette(paletteBase64, paletteColors));
  }
  return paletteCache.get(paletteBase64)!;
}

/**
 * Get pixel data at a specific position
 */
export function getPixelAt(asset: AssetData, x: number, y: number, frameIndex: number = 0): number[] | null {
  if (x < 0 || x >= asset.width || y < 0 || y >= asset.height) {
    return null;
  }
  
  const palette = getPalette(asset, frameIndex);
  const pixels = getPixels(asset, frameIndex);
  const index = y * asset.width + x;
  const paletteIndex = pixels[index];
  return palette[paletteIndex];
}

/**
 * Get normalized RGBA values (0-1 range) at a specific position
 */
export function getNormalizedPixelAt(asset: AssetData, x: number, y: number, frameIndex: number = 0): { r: number, g: number, b: number, a: number } | null {
  const pixel = getPixelAt(asset, x, y, frameIndex);
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
    const paletteBytes = (data.paletteBase64.length * 3) / 4;
    const totalBytes = pixelBytes + paletteBytes;
    console.log(
      `  ${name}: ${data.width}x${data.height}, ${data.paletteColors} colors, ~${(totalBytes / 1024).toFixed(1)}KB (pixels: ${(data.pixelsBase64.length / 1024).toFixed(1)}KB, palette: ${(data.paletteBase64.length / 1024).toFixed(1)}KB)`,
    );
  }

  console.log("\nImages:");
  for (const [name, data] of Object.entries(imageData)) {
    if (data.isAnimation && data.frames) {
      let totalBytes = 0;
      for (const frame of data.frames) {
        const pixelBytes = (frame.pixelsBase64.length * 3) / 4;
        const paletteBytes = (frame.paletteBase64.length * 3) / 4;
        totalBytes += pixelBytes + paletteBytes;
      }
      console.log(
        `  ${name}: ${data.width}x${data.height}, ${data.frames.length} frames, ~${(totalBytes / 1024).toFixed(1)}KB total`,
      );
    } else {
      const pixelBytes = (data.pixelsBase64.length * 3) / 4;
      const paletteBytes = (data.paletteBase64.length * 3) / 4;
      const totalBytes = pixelBytes + paletteBytes;
      console.log(
        `  ${name}: ${data.width}x${data.height}, ${data.paletteColors} colors, ~${(totalBytes / 1024).toFixed(1)}KB (pixels: ${(data.pixelsBase64.length / 1024).toFixed(1)}KB, palette: ${(data.paletteBase64.length / 1024).toFixed(1)}KB)`,
      );
    }
  }
}

// Run the generator
generateAssetData().catch(console.error);
