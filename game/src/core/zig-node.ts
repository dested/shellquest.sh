import koffi from 'koffi';
import {join} from 'path';
import {existsSync} from 'fs';
import os from 'os';
import type {CursorStyle, DebugOverlayCorner} from './types.ts';
import {RGBA} from './types.ts';
import {OptimizedBuffer} from './buffer.ts';

// Helper to get library extension based on platform
function getSuffix(): string {
  const platform = os.platform();
  if (platform === 'win32') return 'dll';
  if (platform === 'darwin') return 'dylib';
  return 'so';
}

function getPlatformTarget(): string {
  const platform = os.platform();
  const arch = os.arch();

  const platformMap: Record<string, string> = {
    darwin: 'macos',
    win32: 'windows',
    linux: 'linux',
  };

  const archMap: Record<string, string> = {
    x64: 'x86_64',
    arm64: 'aarch64',
  };

  const zigPlatform = platformMap[platform] || platform;
  const zigArch = archMap[arch] || arch;

  return `${zigArch}-${zigPlatform}`;
}

function findLibrary(): string {
  const target = getPlatformTarget();
  const suffix = getSuffix();

  // Try multiple possible locations for the library
  const possiblePaths = [
    // In dist folder (npm package)
    join(process.cwd(), 'dist', 'zig', 'lib', target),
    join(process.cwd(), 'node_modules', 'shellquest.sh', 'dist', 'zig', 'lib', target),
    join(process.cwd(), 'node_modules', 'shellquest', 'dist', 'zig', 'lib', target),
    join(process.cwd(), 'node_modules', 'tui-crawler', 'dist', 'zig', 'lib', target),
    // In src folder (development)
    join(process.cwd(), 'src', 'zig', 'lib', target),
    // Relative to current file location (fallback)
    // join(__dirname, 'zig', 'lib', target),
    // join(__dirname, '..', 'zig', 'lib', target),
    // join(__dirname, '..', '..', 'zig', 'lib', target),
  ];

  const [arch, os] = target.split('-');
  const isWindows = os === 'windows';
  const libraryName = isWindows ? 'opentui' : 'libopentui';

  for (const basePath of possiblePaths) {
    const targetLibPath = join(basePath, `${libraryName}.${suffix}`);
    if (existsSync(targetLibPath)) {
      return targetLibPath;
    }
  }

  throw new Error(`Could not find opentui library for platform: ${target}`);
}

// Koffi type definitions
type Pointer = koffi.Pointer;

function getOpenTUILib(libPath?: string) {
  const resolvedLibPath = libPath || findLibrary();
  const lib = koffi.load(resolvedLibPath);

  // Define struct for passing colors (4 floats for RGBA)
  const RGBAStruct = koffi.struct('RGBA', {
    r: 'float',
    g: 'float',
    b: 'float',
    a: 'float',
  });

  return {
    lib,
    symbols: {
      // Renderer management
      createRenderer: lib.func('void* createRenderer(uint32_t width, uint32_t height)'),
      destroyRenderer: lib.func('void destroyRenderer(void* renderer)'),
      setUseThread: lib.func('void setUseThread(void* renderer, bool useThread)'),
      setBackgroundColor: lib.func('void setBackgroundColor(void* renderer, RGBA* color)', {
        RGBA: RGBAStruct,
      }),
      updateStats: lib.func(
        'void updateStats(void* renderer, double time, uint32_t fps, double frameCallbackTime)',
      ),
      updateMemoryStats: lib.func(
        'void updateMemoryStats(void* renderer, uint32_t heapUsed, uint32_t heapTotal, uint32_t arrayBuffers)',
      ),
      render: lib.func('void render(void* renderer)'),
      getNextBuffer: lib.func('void* getNextBuffer(void* renderer)'),
      getCurrentBuffer: lib.func('void* getCurrentBuffer(void* renderer)'),

      createOptimizedBuffer: lib.func(
        'void* createOptimizedBuffer(uint32_t width, uint32_t height, bool respectAlpha)',
      ),
      destroyOptimizedBuffer: lib.func('void destroyOptimizedBuffer(void* buffer)'),

      drawFrameBuffer: lib.func(
        'void drawFrameBuffer(void* target, int32_t destX, int32_t destY, void* source, uint32_t srcX, uint32_t srcY, uint32_t srcWidth, uint32_t srcHeight)',
      ),
      getBufferWidth: lib.func('uint32_t getBufferWidth(void* buffer)'),
      getBufferHeight: lib.func('uint32_t getBufferHeight(void* buffer)'),
      bufferClear: lib.func('void bufferClear(void* buffer, RGBA* color)', {RGBA: RGBAStruct}),
      bufferGetCharPtr: lib.func('void* bufferGetCharPtr(void* buffer)'),
      bufferGetFgPtr: lib.func('void* bufferGetFgPtr(void* buffer)'),
      bufferGetBgPtr: lib.func('void* bufferGetBgPtr(void* buffer)'),
      bufferGetAttributesPtr: lib.func('void* bufferGetAttributesPtr(void* buffer)'),
      bufferGetRespectAlpha: lib.func('bool bufferGetRespectAlpha(void* buffer)'),
      bufferSetRespectAlpha: lib.func(
        'void bufferSetRespectAlpha(void* buffer, bool respectAlpha)',
      ),

      bufferDrawText: lib.func(
        'void bufferDrawText(void* buffer, uint8_t* text, uint32_t len, uint32_t x, uint32_t y, RGBA* fg, RGBA* bg, uint8_t attributes)',
        {RGBA: RGBAStruct},
      ),
      bufferSetCellWithAlphaBlending: lib.func(
        'void bufferSetCellWithAlphaBlending(void* buffer, uint32_t x, uint32_t y, uint32_t char, RGBA* fg, RGBA* bg, uint8_t attributes)',
        {RGBA: RGBAStruct},
      ),
      bufferFillRect: lib.func(
        'void bufferFillRect(void* buffer, uint32_t x, uint32_t y, uint32_t width, uint32_t height, RGBA* color)',
        {RGBA: RGBAStruct},
      ),
      bufferResize: lib.func('void bufferResize(void* buffer, uint32_t width, uint32_t height)'),

      resizeRenderer: lib.func(
        'void resizeRenderer(void* renderer, uint32_t width, uint32_t height)',
      ),

      // Global cursor functions
      setCursorPosition: lib.func('void setCursorPosition(int32_t x, int32_t y, bool visible)'),
      setCursorStyle: lib.func('void setCursorStyle(uint8_t* style, uint32_t len, bool blinking)'),
      setCursorColor: lib.func('void setCursorColor(RGBA* color)', {RGBA: RGBAStruct}),

      // Debug overlay
      setDebugOverlay: lib.func(
        'void setDebugOverlay(void* renderer, bool enabled, uint8_t corner)',
      ),

      // Terminal control
      clearTerminal: lib.func('void clearTerminal(void* renderer)'),

      bufferDrawSuperSampleBuffer: lib.func(
        'void bufferDrawSuperSampleBuffer(void* buffer, uint32_t x, uint32_t y, void* pixelData, size_t dataLen, uint8_t format, uint32_t alignedBytesPerRow)',
      ),
      bufferDrawPackedBuffer: lib.func(
        'void bufferDrawPackedBuffer(void* buffer, void* data, size_t dataLen, uint32_t posX, uint32_t posY, uint32_t termWidth, uint32_t termHeight)',
      ),

      addToHitGrid: lib.func(
        'void addToHitGrid(void* renderer, int32_t x, int32_t y, uint32_t width, uint32_t height, uint32_t id)',
      ),
      checkHit: lib.func('uint32_t checkHit(void* renderer, uint32_t x, uint32_t y)'),
      clearHitGrid: lib.func('void clearHitGrid(void* renderer)'),
    },
  };
}

export interface RenderLib {
  createRenderer: (width: number, height: number) => Pointer | null;
  destroyRenderer: (renderer: Pointer) => void;
  setUseThread: (renderer: Pointer, useThread: boolean) => void;
  setBackgroundColor: (renderer: Pointer, color: RGBA) => void;
  updateStats: (renderer: Pointer, time: number, fps: number, frameCallbackTime: number) => void;
  updateMemoryStats: (
    renderer: Pointer,
    heapUsed: number,
    heapTotal: number,
    arrayBuffers: number,
  ) => void;
  render: (renderer: Pointer) => void;
  getNextBuffer: (renderer: Pointer) => OptimizedBuffer;
  getCurrentBuffer: (renderer: Pointer) => OptimizedBuffer;
  createOptimizedBuffer: (width: number, height: number, respectAlpha?: boolean) => OptimizedBuffer;
  destroyOptimizedBuffer: (bufferPtr: Pointer) => void;
  drawFrameBuffer: (
    targetBufferPtr: Pointer,
    destX: number,
    destY: number,
    bufferPtr: Pointer,
    sourceX?: number,
    sourceY?: number,
    sourceWidth?: number,
    sourceHeight?: number,
  ) => void;
  getBufferWidth: (buffer: Pointer) => number;
  getBufferHeight: (buffer: Pointer) => number;
  bufferClear: (buffer: Pointer, color: RGBA) => void;
  bufferGetCharPtr: (buffer: Pointer) => Pointer;
  bufferGetFgPtr: (buffer: Pointer) => Pointer;
  bufferGetBgPtr: (buffer: Pointer) => Pointer;
  bufferGetAttributesPtr: (buffer: Pointer) => Pointer;
  bufferGetRespectAlpha: (buffer: Pointer) => boolean;
  bufferSetRespectAlpha: (buffer: Pointer, respectAlpha: boolean) => void;
  bufferDrawText: (
    buffer: Pointer,
    text: string,
    x: number,
    y: number,
    color: RGBA,
    bgColor?: RGBA,
    attributes?: number,
  ) => void;
  bufferSetCellWithAlphaBlending: (
    buffer: Pointer,
    x: number,
    y: number,
    char: string,
    color: RGBA,
    bgColor: RGBA,
    attributes?: number,
  ) => void;
  bufferFillRect: (
    buffer: Pointer,
    x: number,
    y: number,
    width: number,
    height: number,
    color: RGBA,
  ) => void;
  bufferDrawSuperSampleBuffer: (
    buffer: Pointer,
    x: number,
    y: number,
    pixelDataPtr: Pointer,
    pixelDataLength: number,
    format: 'bgra8unorm' | 'rgba8unorm',
    alignedBytesPerRow: number,
  ) => void;
  bufferDrawPackedBuffer: (
    buffer: Pointer,
    dataPtr: Pointer,
    dataLen: number,
    posX: number,
    posY: number,
    terminalWidthCells: number,
    terminalHeightCells: number,
  ) => void;
  bufferResize: (
    buffer: Pointer,
    width: number,
    height: number,
  ) => {
    char: Uint32Array;
    fg: Float32Array;
    bg: Float32Array;
    attributes: Uint8Array;
  };
  resizeRenderer: (renderer: Pointer, width: number, height: number) => void;
  setCursorPosition: (x: number, y: number, visible: boolean) => void;
  setCursorStyle: (style: CursorStyle, blinking: boolean) => void;
  setCursorColor: (color: RGBA) => void;
  setDebugOverlay: (renderer: Pointer, enabled: boolean, corner: DebugOverlayCorner) => void;
  clearTerminal: (renderer: Pointer) => void;
  addToHitGrid: (
    renderer: Pointer,
    x: number,
    y: number,
    width: number,
    height: number,
    id: number,
  ) => void;
  checkHit: (renderer: Pointer, x: number, y: number) => number;
  clearHitGrid: (renderer: Pointer) => void;
}

// Helper to convert RGBA to struct format expected by koffi
function rgbaToStruct(color: RGBA): any {
  // Assuming RGBA has a buffer property with Float32Array
  const view = new Float32Array(color.buffer);
  return {
    r: view[0],
    g: view[1],
    b: view[2],
    a: view[3],
  };
}

class FFIRenderLib implements RenderLib {
  private opentui: ReturnType<typeof getOpenTUILib>;
  private encoder: TextEncoder = new TextEncoder();

  constructor(libPath?: string) {
    this.opentui = getOpenTUILib(libPath);
  }

  public createRenderer(width: number, height: number) {
    return this.opentui.symbols.createRenderer(width, height);
  }

  public destroyRenderer(renderer: Pointer) {
    this.opentui.symbols.destroyRenderer(renderer);
  }

  public setUseThread(renderer: Pointer, useThread: boolean) {
    this.opentui.symbols.setUseThread(renderer, useThread);
  }

  public setBackgroundColor(renderer: Pointer, color: RGBA) {
    this.opentui.symbols.setBackgroundColor(renderer, rgbaToStruct(color));
  }

  public updateStats(renderer: Pointer, time: number, fps: number, frameCallbackTime: number) {
    this.opentui.symbols.updateStats(renderer, time, fps, frameCallbackTime);
  }

  public updateMemoryStats(
    renderer: Pointer,
    heapUsed: number,
    heapTotal: number,
    arrayBuffers: number,
  ) {
    this.opentui.symbols.updateMemoryStats(renderer, heapUsed, heapTotal, arrayBuffers);
  }

  public getNextBuffer(renderer: Pointer): OptimizedBuffer {
    const bufferPtr = this.opentui.symbols.getNextBuffer(renderer);
    if (!bufferPtr) {
      throw new Error('Failed to get next buffer');
    }

    const width = this.opentui.symbols.getBufferWidth(bufferPtr);
    const height = this.opentui.symbols.getBufferHeight(bufferPtr);
    const size = width * height;
    const buffers = this.getBuffer(bufferPtr, size);

    return new OptimizedBuffer(this, bufferPtr, buffers, width, height, {});
  }

  public getCurrentBuffer(renderer: Pointer): OptimizedBuffer {
    const bufferPtr = this.opentui.symbols.getCurrentBuffer(renderer);
    if (!bufferPtr) {
      throw new Error('Failed to get current buffer');
    }

    const width = this.opentui.symbols.getBufferWidth(bufferPtr);
    const height = this.opentui.symbols.getBufferHeight(bufferPtr);
    const size = width * height;
    const buffers = this.getBuffer(bufferPtr, size);

    return new OptimizedBuffer(this, bufferPtr, buffers, width, height, {});
  }

  private getBuffer(
    bufferPtr: Pointer,
    size: number,
  ): {
    char: Uint32Array;
    fg: Float32Array;
    bg: Float32Array;
    attributes: Uint8Array;
  } {
    const charPtr = this.opentui.symbols.bufferGetCharPtr(bufferPtr);
    const fgPtr = this.opentui.symbols.bufferGetFgPtr(bufferPtr);
    const bgPtr = this.opentui.symbols.bufferGetBgPtr(bufferPtr);
    const attributesPtr = this.opentui.symbols.bufferGetAttributesPtr(bufferPtr);

    if (!charPtr || !fgPtr || !bgPtr || !attributesPtr) {
      throw new Error('Failed to get buffer pointers');
    }

    // Convert pointers to typed arrays using koffi
    const buffers = {
      char: koffi.decode(charPtr, koffi.array('uint32_t', size)),
      fg: koffi.decode(fgPtr, koffi.array('float', size * 4)), // 4 floats per RGBA
      bg: koffi.decode(bgPtr, koffi.array('float', size * 4)), // 4 floats per RGBA
      attributes: koffi.decode(attributesPtr, koffi.array('uint8_t', size)),
    };

    return buffers;
  }

  public bufferGetCharPtr(buffer: Pointer): Pointer {
    const ptr = this.opentui.symbols.bufferGetCharPtr(buffer);
    if (!ptr) {
      throw new Error('Failed to get char pointer');
    }
    return ptr;
  }

  public bufferGetFgPtr(buffer: Pointer): Pointer {
    const ptr = this.opentui.symbols.bufferGetFgPtr(buffer);
    if (!ptr) {
      throw new Error('Failed to get fg pointer');
    }
    return ptr;
  }

  public bufferGetBgPtr(buffer: Pointer): Pointer {
    const ptr = this.opentui.symbols.bufferGetBgPtr(buffer);
    if (!ptr) {
      throw new Error('Failed to get bg pointer');
    }
    return ptr;
  }

  public bufferGetAttributesPtr(buffer: Pointer): Pointer {
    const ptr = this.opentui.symbols.bufferGetAttributesPtr(buffer);
    if (!ptr) {
      throw new Error('Failed to get attributes pointer');
    }
    return ptr;
  }

  public bufferGetRespectAlpha(buffer: Pointer): boolean {
    return this.opentui.symbols.bufferGetRespectAlpha(buffer);
  }

  public bufferSetRespectAlpha(buffer: Pointer, respectAlpha: boolean): void {
    this.opentui.symbols.bufferSetRespectAlpha(buffer, respectAlpha);
  }

  public getBufferWidth(buffer: Pointer): number {
    return this.opentui.symbols.getBufferWidth(buffer);
  }

  public getBufferHeight(buffer: Pointer): number {
    return this.opentui.symbols.getBufferHeight(buffer);
  }

  public bufferClear(buffer: Pointer, color: RGBA) {
    this.opentui.symbols.bufferClear(buffer, rgbaToStruct(color));
  }

  public bufferDrawText(
    buffer: Pointer,
    text: string,
    x: number,
    y: number,
    color: RGBA,
    bgColor?: RGBA,
    attributes?: number,
  ) {
    const textBytes = this.encoder.encode(text);
    const bg = bgColor ? rgbaToStruct(bgColor) : null;
    const fg = rgbaToStruct(color);

    this.opentui.symbols.bufferDrawText(
      buffer,
      textBytes,
      textBytes.byteLength,
      x,
      y,
      fg,
      bg,
      attributes ?? 0,
    );
  }

  public bufferSetCellWithAlphaBlending(
    buffer: Pointer,
    x: number,
    y: number,
    char: string,
    color: RGBA,
    bgColor: RGBA,
    attributes?: number,
  ) {
    const charCode = char.codePointAt(0) ?? ' '.codePointAt(0)!;
    const bg = rgbaToStruct(bgColor);
    const fg = rgbaToStruct(color);

    this.opentui.symbols.bufferSetCellWithAlphaBlending(
      buffer,
      x,
      y,
      charCode,
      fg,
      bg,
      attributes ?? 0,
    );
  }

  public bufferFillRect(
    buffer: Pointer,
    x: number,
    y: number,
    width: number,
    height: number,
    color: RGBA,
  ) {
    const bg = rgbaToStruct(color);
    this.opentui.symbols.bufferFillRect(buffer, x, y, width, height, bg);
  }

  public bufferDrawSuperSampleBuffer(
    buffer: Pointer,
    x: number,
    y: number,
    pixelDataPtr: Pointer,
    pixelDataLength: number,
    format: 'bgra8unorm' | 'rgba8unorm',
    alignedBytesPerRow: number,
  ): void {
    const formatId = format === 'bgra8unorm' ? 0 : 1;
    this.opentui.symbols.bufferDrawSuperSampleBuffer(
      buffer,
      x,
      y,
      pixelDataPtr,
      pixelDataLength,
      formatId,
      alignedBytesPerRow,
    );
  }

  public bufferDrawPackedBuffer(
    buffer: Pointer,
    dataPtr: Pointer,
    dataLen: number,
    posX: number,
    posY: number,
    terminalWidthCells: number,
    terminalHeightCells: number,
  ): void {
    this.opentui.symbols.bufferDrawPackedBuffer(
      buffer,
      dataPtr,
      dataLen,
      posX,
      posY,
      terminalWidthCells,
      terminalHeightCells,
    );
  }

  public bufferResize(
    buffer: Pointer,
    width: number,
    height: number,
  ): {
    char: Uint32Array;
    fg: Float32Array;
    bg: Float32Array;
    attributes: Uint8Array;
  } {
    this.opentui.symbols.bufferResize(buffer, width, height);
    const buffers = this.getBuffer(buffer, width * height);
    return buffers;
  }

  public resizeRenderer(renderer: Pointer, width: number, height: number) {
    this.opentui.symbols.resizeRenderer(renderer, width, height);
  }

  public setCursorPosition(x: number, y: number, visible: boolean) {
    this.opentui.symbols.setCursorPosition(x, y, visible);
  }

  public setCursorStyle(style: CursorStyle, blinking: boolean) {
    const styleBytes = this.encoder.encode(style);
    this.opentui.symbols.setCursorStyle(styleBytes, style.length, blinking);
  }

  public setCursorColor(color: RGBA) {
    this.opentui.symbols.setCursorColor(rgbaToStruct(color));
  }

  public render(renderer: Pointer) {
    this.opentui.symbols.render(renderer);
  }

  public createOptimizedBuffer(
    width: number,
    height: number,
    respectAlpha: boolean = false,
  ): OptimizedBuffer {
    const bufferPtr = this.opentui.symbols.createOptimizedBuffer(width, height, respectAlpha);
    if (!bufferPtr) {
      throw new Error('Failed to create optimized buffer');
    }
    const size = width * height;
    const buffers = this.getBuffer(bufferPtr, size);

    return new OptimizedBuffer(this, bufferPtr, buffers, width, height, {respectAlpha});
  }

  public destroyOptimizedBuffer(bufferPtr: Pointer) {
    this.opentui.symbols.destroyOptimizedBuffer(bufferPtr);
  }

  public drawFrameBuffer(
    targetBufferPtr: Pointer,
    destX: number,
    destY: number,
    bufferPtr: Pointer,
    sourceX?: number,
    sourceY?: number,
    sourceWidth?: number,
    sourceHeight?: number,
  ) {
    const srcX = sourceX ?? 0;
    const srcY = sourceY ?? 0;
    const srcWidth = sourceWidth ?? 0;
    const srcHeight = sourceHeight ?? 0;
    this.opentui.symbols.drawFrameBuffer(
      targetBufferPtr,
      destX,
      destY,
      bufferPtr,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
    );
  }

  public setDebugOverlay(renderer: Pointer, enabled: boolean, corner: DebugOverlayCorner) {
    this.opentui.symbols.setDebugOverlay(renderer, enabled, corner);
  }

  public clearTerminal(renderer: Pointer) {
    this.opentui.symbols.clearTerminal(renderer);
  }

  public addToHitGrid(
    renderer: Pointer,
    x: number,
    y: number,
    width: number,
    height: number,
    id: number,
  ) {
    this.opentui.symbols.addToHitGrid(renderer, x, y, width, height, id);
  }

  public checkHit(renderer: Pointer, x: number, y: number): number {
    return this.opentui.symbols.checkHit(renderer, x, y);
  }

  public clearHitGrid(renderer: Pointer) {
    this.opentui.symbols.clearHitGrid(renderer);
  }
}

let opentuiLibPath: string | undefined;
let opentuiLib: RenderLib | undefined;

export function setRenderLibPath(libPath: string) {
  opentuiLibPath = libPath;
}

export function resolveRenderLib(): RenderLib {
  if (!opentuiLib) {
    opentuiLib = new FFIRenderLib(opentuiLibPath);
  }
  return opentuiLib;
}
