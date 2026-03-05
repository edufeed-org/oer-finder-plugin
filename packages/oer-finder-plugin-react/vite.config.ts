import { defineConfig } from 'vite';
import { resolve } from 'path';
// @ts-ignore - rollup-plugin-license types issue
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^@edufeed-org\//,
      ],
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
