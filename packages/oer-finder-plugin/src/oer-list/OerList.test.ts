import { describe, it, expect } from 'vitest';
import './OerList.js';
import type { OerListElement } from './OerList.js';

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

describe('OerList', () => {
  it('renders with sample data and matches snapshot', async () => {
    const list = document.createElement('oer-list') as OerListElement;

    list.oers = [
      {
        amb: {
          name: 'Test OER 1',
          description: 'First test resource',
        },
        extensions: {
          fileMetadata: null,
          images: null,
          system: {
            source: 'nostr',
            foreignLandingUrl: null,
            attribution: null,
          },
        },
      },
      {
        amb: {
          name: 'Test OER 2',
          description: 'Second test resource',
        },
        extensions: {
          fileMetadata: null,
          images: {
            high: 'https://proxy.example.com/high/image2.jpg',
            medium: 'https://proxy.example.com/medium/image2.jpg',
            small: 'https://proxy.example.com/small/image2.jpg',
          },
          system: {
            source: 'nostr',
            foreignLandingUrl: null,
            attribution: null,
          },
        },
      },
    ];

    document.body.appendChild(list);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = list.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(list);
  });
});
