import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, PluginOption } from 'vite';

import * as packageJson from './package.json';

const plugins: PluginOption[] = [
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  }),
];

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  root: './src/',
  base: './',
  server: {
    host: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    lib: {
      entry: resolve('src', 'component/index.ts'),
      name: 'TPGames',
      formats: ['es', 'umd'],
      fileName: (format) => `react-vite-library.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './assets'),
    },
  },
});
