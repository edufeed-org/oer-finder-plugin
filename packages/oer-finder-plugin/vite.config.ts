import { defineConfig } from 'vite';
import { resolve } from 'path';
// @ts-ignore - rollup-plugin-license types issue
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'oer-plugin': resolve(__dirname, 'src/index.ts'),
        'built-in-registrations': resolve(__dirname, 'src/built-in-registrations.ts'),
        'adapter/openverse': resolve(__dirname, 'src/adapter/openverse.ts'),
        'adapter/arasaac': resolve(__dirname, 'src/adapter/arasaac.ts'),
        'adapter/nostr-amb-relay': resolve(__dirname, 'src/adapter/nostr-amb-relay.ts'),
        'adapter/rpi-virtuell': resolve(__dirname, 'src/adapter/rpi-virtuell.ts'),
        'adapter/wikimedia': resolve(__dirname, 'src/adapter/wikimedia.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {},
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
