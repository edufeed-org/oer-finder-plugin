import { defineConfig } from 'vite';
import { resolve } from 'path';
// @ts-ignore - rollup-plugin-license types issue
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OerFinderPluginReact',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
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
