import type { components } from '@edufeed-org/oer-finder-api-client';

type OerItem = components['schemas']['OerItemSchema'];

export function mockItem(name: string): OerItem {
  return {
    amb: { name, description: `Desc ${name}` },
    extensions: {
      fileMetadata: null,
      images: null,
      system: { source: 'test', foreignLandingUrl: null, attribution: null },
    },
  };
}
