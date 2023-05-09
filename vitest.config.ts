/// <reference types="vitest" />
import react from '@vitejs/plugin-react';

import { PluginOption, defineConfig } from 'vite'

const plugins: PluginOption[] = [
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  })
];

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  plugins
})