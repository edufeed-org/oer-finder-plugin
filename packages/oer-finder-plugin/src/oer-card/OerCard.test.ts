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
      id: 'test-1',
      url: null,
      license_uri: null,
      free_to_use: null,
      file_mime_type: null,
      amb_metadata: {
        name: 'Test OER Resource',
        description: 'A test educational resource',
        image: 'https://example.com/image.jpg',
      },
      keywords: ['education', 'testing'],
      file_dim: null,
      file_size: null,
      file_alt: null,
      name: null,
      description: null,
      attribution: null,
      audience_uri: null,
      educational_level_uri: null,
      source: 'nostr',
      event_amb_id: null,
      event_file_id: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      images: {
        high: 'https://proxy.example.com/high/image.jpg',
        medium: 'https://proxy.example.com/medium/image.jpg',
        small: 'https://proxy.example.com/small/image.jpg',
      },
      creators: [],
    };

    document.body.appendChild(card);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = card.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(card);
  });
});
