import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy assets
const srcAssetsDir = join(__dirname, '..', 'src', 'crawler', 'assets');
const destAssetsDir = join(__dirname, '..', 'dist', 'crawler', 'assets');

mkdirSync(destAssetsDir, { recursive: true });

const assetFiles = readdirSync(srcAssetsDir);
for (const file of assetFiles) {
  const srcPath = join(srcAssetsDir, file);
  const destPath = join(destAssetsDir, file);
  copyFileSync(srcPath, destPath);
  console.log(`Copied asset: ${file}`);
}

// Copy launcher script
const launcherSrc = join(__dirname, '..', 'src', 'crawler', 'launcher.js');
const launcherDest = join(__dirname, '..', 'dist', 'crawler', 'launcher.js');
copyFileSync(launcherSrc, launcherDest);
console.log(`Copied launcher.js`);

// Copy Zig libraries
const zigLibSrc = join(__dirname, '..', 'src', 'zig', 'lib');
const zigLibDest = join(__dirname, '..', 'dist', 'zig', 'lib');

function copyRecursive(src, dest) {
  if (!existsSync(src)) {
    console.warn(`Warning: ${src} does not exist`);
    return;
  }
  
  mkdirSync(dest, { recursive: true });
  
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    
    if (statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`Copied Zig lib: ${entry}`);
    }
  }
}

copyRecursive(zigLibSrc, zigLibDest);

console.log(`✓ Assets, launcher, and Zig libraries copied to dist`);