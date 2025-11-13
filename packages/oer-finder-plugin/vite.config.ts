import { defineConfig } from 'vite';
import { resolve } from 'path';
// @ts-ignore - rollup-plugin-license types issue
import license from 'rollup-plugin-license';

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
      plugins: [
        // @ts-ignore - rollup-plugin-license types issue
        license({
          banner: resolve(__dirname, '../../LICENSE'),
          thirdParty: {
            output: resolve(__dirname, 'dist/LICENSES.txt'),
          },
        }),
      ],
    },
  },
});
