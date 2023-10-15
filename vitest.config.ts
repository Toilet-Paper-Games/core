/// <reference types="vitest" />
import * as path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    includeSource: ['test/**/*.{js,ts}', 'src/**/*.{js,ts}'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['html', 'text'],
    },
    reporters: ['html', 'default'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './assets'),
      '@justinfernald/tp-games-lib': path.resolve(__dirname, './'),
    },
  },
});
