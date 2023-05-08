import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';

import * as packageJson from './package.json';

const plugins: PluginOption[] = [
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  }),
  tsConfigPaths(),
  dts({
    include: ['src'],
  }),
];

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    lib: {
      entry: 'src/index.ts',
      name: 'tp-games-lib',
      formats: ['es', 'cjs'],
      fileName: (format) => `tp-games-lib.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies), 'react/jsx-runtime'],
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
