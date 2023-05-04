import react from '@vitejs/plugin-react';
import * as path from 'path';
import { env } from 'process';
import obfuscator from 'rollup-plugin-obfuscator';
import { defineConfig, PluginOption } from 'vite';

const plugins: PluginOption[] = [
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  }),
];

if (env.PROD) {
  plugins.push(
    // TODO: Optimize this for good performance and output size along with difficult debugging
    obfuscator({}),
  );
}

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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
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
