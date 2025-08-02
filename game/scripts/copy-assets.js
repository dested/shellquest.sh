import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy launcher script
const launcherSrc = join(__dirname, '..', 'src', 'examples','crawler-demo', 'launcher.js');
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
