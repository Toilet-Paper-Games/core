/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, PluginOption } from 'vite';

const plugins: PluginOption[] = [
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  }),
];

export default defineConfig({
  test: {
    includeSource: ['test/**/*.{js,ts}', 'src/**/*.{js,ts}'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'c8',
    },
  },
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './assets'),
      '@justinfernald/tp-games-lib': path.resolve(__dirname, './'),
    },
  },
});
