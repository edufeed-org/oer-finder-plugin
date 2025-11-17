import { describe, it, expect } from 'vitest';
import './OerSearch.js';
import type { OerSearchElement } from './OerSearch.js';

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

describe('OerSearch', () => {
  it('renders and matches snapshot', async () => {
    const search = document.createElement('oer-search') as OerSearchElement;

    search.apiUrl = 'http://localhost:3000';
    search.language = 'en';

    document.body.appendChild(search);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = search.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(search);
  });
});
