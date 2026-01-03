import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OerNostr',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'cjs') {
          return 'index.cjs';
        }
        return 'index.js';
      },
    },
    rollupOptions: {
      external: [
        '@nestjs/common',
        '@nestjs/config',
        '@nestjs/typeorm',
        'typeorm',
        'nostr-tools',
        'nostr-tools/core',
        'nostr-tools/relay',
        'nostr-tools/pure',
      ],
    },
  },
});
