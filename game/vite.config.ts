import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      'node:buffer': path.resolve(__dirname, './src/core-browser/buffer-polyfill.ts'),
      'bun:ffi': path.resolve(__dirname, './src/core-browser/ffi-polyfill.ts'),
      'yoga-layout': path.resolve(__dirname, './src/core-browser/yoga-stub.ts'),
      'uiohook-napi': path.resolve(__dirname, './src/core-browser/uiohook-stub.ts'),
      "events": path.resolve(__dirname, './src/core-browser/events-polyfill.ts'),
      './zig': path.resolve(__dirname, './src/core-browser/zig-stub.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['bun:ffi', 'node:buffer', 'yoga-layout', 'uiohook-napi'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      },
    }
  },
  server: {
    port: 8488,
  },
  build: {
    target: 'esnext',
  }
})
