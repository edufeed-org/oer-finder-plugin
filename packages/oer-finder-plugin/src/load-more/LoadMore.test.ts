import { describe, it, expect } from 'vitest';
import './LoadMore.js';
import type { LoadMoreElement } from './LoadMore.js';

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

describe('LoadMore', () => {
  it('renders with metadata showing load more button and matches snapshot', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };
    loadMore.shownCount = 20;

    document.body.appendChild(loadMore);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = loadMore.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(loadMore);
  });

  it('renders all-loaded state when on last page and matches snapshot', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 40,
      page: 2,
      pageSize: 20,
      totalPages: 2,
    };
    loadMore.shownCount = 40;

    document.body.appendChild(loadMore);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = loadMore.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(loadMore);
  });

  it('renders nothing when metadata is null', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = null;

    document.body.appendChild(loadMore);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const html = loadMore.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();

    document.body.removeChild(loadMore);
  });

  it('disables button when loading', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };
    loadMore.shownCount = 20;
    loadMore.loading = true;

    document.body.appendChild(loadMore);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = loadMore.shadowRoot?.querySelector('.load-more-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Loading...');

    document.body.removeChild(loadMore);
  });

  it('dispatches load-more event when button is clicked', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };
    loadMore.shownCount = 20;

    document.body.appendChild(loadMore);
    await new Promise((resolve) => setTimeout(resolve, 0));

    let eventFired = false;
    loadMore.addEventListener('load-more', () => {
      eventFired = true;
    });

    const button = loadMore.shadowRoot?.querySelector('.load-more-button') as HTMLButtonElement;
    button.click();

    expect(eventFired).toBe(true);

    document.body.removeChild(loadMore);
  });

  it('does not dispatch load-more event when button is disabled', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };
    loadMore.shownCount = 20;
    loadMore.loading = true;

    document.body.appendChild(loadMore);
    await new Promise((resolve) => setTimeout(resolve, 0));

    let eventFired = false;
    loadMore.addEventListener('load-more', () => {
      eventFired = true;
    });

    const button = loadMore.shadowRoot?.querySelector('.load-more-button') as HTMLButtonElement;
    button.click();

    expect(eventFired).toBe(false);

    document.body.removeChild(loadMore);
  });
});
