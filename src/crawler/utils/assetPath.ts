import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export function getAssetPath(assetName: string): string {
  // Try to get the directory of the current module
  let currentDir: string;
  
  try {
    // For ESM modules
    currentDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    // Fallback for CommonJS or other environments
    currentDir = __dirname;
  }

  // Possible paths where assets might be located
  const possiblePaths = [
    // When running from source (development)
    join(currentDir, '..', '..', 'crawler', 'assets', assetName),
    join(currentDir, '..', 'assets', assetName),
    join(currentDir, 'assets', assetName),
    // When running from dist (production/npm package)
    join(currentDir, '..', '..', 'dist', 'crawler', 'assets', assetName),
    join(currentDir, '..', 'dist', 'crawler', 'assets', assetName),
    join(process.cwd(), 'dist', 'crawler', 'assets', assetName),
    // Direct paths for development
    join(process.cwd(), 'src', 'crawler', 'assets', assetName),
    `./src/crawler/assets/${assetName}`,
    `./dist/crawler/assets/${assetName}`,
  ];

  // Find the first path that exists
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // If no path exists, return the most likely production path
  console.warn(`Asset not found: ${assetName}, trying default path`);
  return join(currentDir, 'assets', assetName);
}