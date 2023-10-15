import * as path from 'path';
import { defineConfig, PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';

const plugins: PluginOption[] = [
  tsConfigPaths(),
  dts({
    include: ['src'],
  }),
];

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
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
