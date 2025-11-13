import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OerPlugin',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'umd') {
          return 'oer-plugin.umd.cjs';
        }
        return 'oer-plugin.js';
      },
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        globals: {},
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
