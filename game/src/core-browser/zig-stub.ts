// Stub for Zig native library in browser
import {OptimizedBuffer} from './browser-buffer';

export function resolveRenderLib() {
  return {
    createRenderer: () => 1,
    setUseThread: () => {},
    getNextBuffer: () => new OptimizedBuffer(120, 40, false),
    updateMemoryStats: () => {},
    resizeRenderer: () => {},
    setBackgroundColor: () => {},
    setDebugOverlay: () => {},
    clearTerminal: () => {},
    clearHitGrid: () => {},
    addToHitGrid: () => {},
    checkHit: () => 0,
    render: () => {},
    createOptimizedBuffer: (width: number, height: number, respectAlpha?: boolean) =>
      new OptimizedBuffer(width, height, respectAlpha || false),
    setCursorPosition: () => {},
    setCursorStyle: () => {},
    setCursorColor: () => {},
    updateStats: () => {},
  };
}

export type RenderLib = ReturnType<typeof resolveRenderLib>;
