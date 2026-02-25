import { describe, it, expect } from 'vitest';
import './LoadMore.js';
import type { LoadMoreElement } from './LoadMore.js';
import { normalizeLitHTML } from '../test-utils.js';

describe('LoadMore', () => {
  it('renders with metadata showing load more button and matches snapshot', async () => {
    const loadMore = document.createElement('oer-load-more') as LoadMoreElement;

    loadMore.metadata = {
      total: 100,
      shown: 20,
      hasMore: true,
    };

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
      shown: 40,
      hasMore: false,
    };

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
      shown: 20,
      hasMore: true,
    };
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
      shown: 20,
      hasMore: true,
    };

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
      shown: 20,
      hasMore: true,
    };
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
