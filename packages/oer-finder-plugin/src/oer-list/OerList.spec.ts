import { describe, it, expect } from 'vitest';
import './OerList.js';
import type { OerListElement } from './OerList.js';
import { normalizeLitHTML } from '../test-utils.js';

const sampleOers = [
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

describe('OerList', () => {
  it('renders with sample data and matches snapshot', async () => {
    const list = document.createElement('oer-list') as OerListElement;

    list.oers = sampleOers;

    document.body.appendChild(list);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = list.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(list);
  });

  it('shows loading spinner when loading with no items', async () => {
    const list = document.createElement('oer-list') as OerListElement;
    list.loading = true;
    list.oers = [];
    document.body.appendChild(list);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const spinner = list.shadowRoot?.querySelector('.loading-spinner');
    const grid = list.shadowRoot?.querySelector('.grid');
    expect(spinner).toBeTruthy();
    expect(grid).toBeNull();

    document.body.removeChild(list);
  });

  it('keeps showing items when loading with existing items (load more)', async () => {
    const list = document.createElement('oer-list') as OerListElement;
    list.oers = sampleOers;
    list.loading = true;
    document.body.appendChild(list);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const spinner = list.shadowRoot?.querySelector('.loading-spinner');
    const grid = list.shadowRoot?.querySelector('.grid');
    const cards = list.shadowRoot?.querySelectorAll('oer-card');
    expect(spinner).toBeNull();
    expect(grid).toBeTruthy();
    expect(cards?.length).toBe(2);

    document.body.removeChild(list);
  });
});
