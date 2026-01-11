import { describe, it, expect } from 'vitest';
import './OerCard.js';
import type { OerCardElement } from './OerCard.js';

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

describe('OerCard', () => {
  it('renders with sample data and matches snapshot', async () => {
    const card = document.createElement('oer-card') as OerCardElement;

    card.oer = {
      amb: {
        name: 'Test OER Resource',
        description: 'A test educational resource',
        keywords: ['education', 'testing'],
        image: 'https://example.com/image.jpg',
      },
      extensions: {
        fileMetadata: {
          fileDim: null,
          fileAlt: null,
        },
        images: {
          high: 'https://proxy.example.com/high/image.jpg',
          medium: 'https://proxy.example.com/medium/image.jpg',
          small: 'https://proxy.example.com/small/image.jpg',
        },
        system: {
          source: 'nostr',
          foreignLandingUrl: null,
          attribution: null,
        },
      },
    };

    document.body.appendChild(card);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = card.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(card);
  });
});
