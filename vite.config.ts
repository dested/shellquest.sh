import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      'node:buffer': path.resolve(__dirname, './src/browser/buffer-polyfill.ts'),
      'bun:ffi': path.resolve(__dirname, './src/browser/ffi-polyfill.ts'),
      'yoga-layout': path.resolve(__dirname, './src/browser/yoga-stub.ts'),
      'uiohook-napi': path.resolve(__dirname, './src/browser/uiohook-stub.ts'),
      '../zig': path.resolve(__dirname, './src/browser/zig-stub.ts'),
      './zig': path.resolve(__dirname, './src/browser/zig-stub.ts'),
      '../console': path.resolve(__dirname, './src/browser/console-stub.ts'),
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