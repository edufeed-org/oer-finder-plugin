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
        id: 'test-1',
        url: null,
        license_uri: null,
        free_to_use: null,
        file_mime_type: null,
        amb_metadata: {
          name: 'Test OER 1',
          description: 'First test resource',
        },
        keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        name: null,
        description: null,
        attribution: null,
        audience_uri: null,
        educational_level_uri: null,
        source: 'nostr',
        foreign_landing_url: null,
        event_amb_id: null,
        event_file_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: null,
        creators: [],
      },
      {
        id: 'test-2',
        url: null,
        license_uri: null,
        free_to_use: null,
        file_mime_type: null,
        amb_metadata: {
          name: 'Test OER 2',
          description: 'Second test resource',
        },
        keywords: null,
        file_dim: null,
        file_size: null,
        file_alt: null,
        name: null,
        description: null,
        attribution: null,
        audience_uri: null,
        educational_level_uri: null,
        source: 'nostr',
        foreign_landing_url: null,
        event_amb_id: null,
        event_file_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: {
          high: 'https://proxy.example.com/high/image2.jpg',
          medium: 'https://proxy.example.com/medium/image2.jpg',
          small: 'https://proxy.example.com/small/image2.jpg',
        },
        creators: [],
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
