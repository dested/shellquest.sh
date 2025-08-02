#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const zigDir = join(projectRoot, 'src', 'zig');

console.log('🔨 Building native Zig libraries...');

try {
  // Check if zig is available
  execSync('zig version', { stdio: 'ignore' });
  
  // Build the Zig libraries
  console.log('Building Zig project...');
  execSync('zig build -Doptimize=ReleaseFast', {
    cwd: zigDir,
    stdio: 'inherit'
  });
  
  console.log('✅ Zig libraries built successfully!');
} catch (error) {
  console.warn('⚠️  Could not build Zig libraries. Make sure Zig is installed.');
  console.warn('   You can install Zig from: https://ziglang.org/download/');
  console.warn('   The game may not run properly without the native libraries.');
  // Don't fail the install, just warn
}
