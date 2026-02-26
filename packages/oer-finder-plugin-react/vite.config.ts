import { defineConfig } from 'vite';
import { resolve } from 'path';
// @ts-ignore - rollup-plugin-license types issue
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        adapters: resolve(__dirname, 'src/adapters.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'cjs' ? 'cjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@edufeed-org/oer-finder-plugin/adapters',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
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
