import path from 'path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const isSSRBuild = process.env.BUILD_TARGET === 'server';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  // base: isSSRBuild ? 'https://static.tui-crawler.com/' : '/',
  base: isSSRBuild ? 'https://tui-crawler-web-static.onrender.com/' : '/',
  resolve: {
    alias: {
      '@': path.join(__dirname, './src/'),
      '@client': path.join(__dirname, './src'),
      '@server': path.join(__dirname, './server'),
    },
  },
  ssr: {
    noExternal: ['react-helmet-async'],
  },
});
