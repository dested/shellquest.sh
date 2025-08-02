#!/usr/bin/env bun
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if we need to build Zig libraries
const zigSrcPath = join(__dirname, '..', '..', 'src', 'zig');
const libPath = join(zigSrcPath, 'lib');

function needsZigBuild() {
  // Check if lib directory exists and has files
  if (!existsSync(libPath)) return true;
  
  // Check for platform-specific library
  const platform = process.platform;
  const arch = process.arch;
  let libDir;
  
  if (platform === 'win32') {
    libDir = join(libPath, `${arch}-windows`);
  } else if (platform === 'darwin') {
    libDir = join(libPath, `${arch}-macos`);
  } else {
    libDir = join(libPath, `${arch}-linux`);
  }
  
  return !existsSync(libDir);
}

if (needsZigBuild()) {
  console.log('🔨 First-time setup: Building native libraries...');
  try {
    execSync('zig version', { stdio: 'ignore' });
    execSync('zig build -Doptimize=ReleaseFast', {
      cwd: zigSrcPath,
      stdio: 'inherit'
    });
    console.log('✅ Native libraries built!');
  } catch (error) {
    console.error('❌ Failed to build native libraries. Make sure Zig is installed.');
    console.error('   Install from: https://ziglang.org/download/');
    process.exit(1);
  }
}

// Now run the actual game
console.log("🚀 Launching the game...");

import("./index.js")
  .then(() => {
    console.log("🚀 Launched the game...");
  })
  .catch((err) => {
    console.error("❌ Failed to launch the game:", err);
    process.exit(1);
  });
