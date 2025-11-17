import { describe, it, expect } from 'vitest';
import './Pagination.js';
import type { PaginationElement } from './Pagination.js';

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

describe('Pagination', () => {
  it('renders with metadata and matches snapshot', async () => {
    const pagination = document.createElement('oer-pagination') as PaginationElement;

    pagination.metadata = {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };

    document.body.appendChild(pagination);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = pagination.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(pagination);
  });
});
