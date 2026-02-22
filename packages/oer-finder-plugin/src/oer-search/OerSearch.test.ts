import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { ClientFactory, type ClientConfig } from '../clients/client-factory.js';
import type { SearchClient, SearchResult } from '../clients/search-client.interface.js';
import type { SearchParams, OerSearchResultEvent } from './OerSearch.js';
import './OerSearch.js';
import type { OerSearchElement } from './OerSearch.js';

type OerItem = components['schemas']['OerItemSchema'];

// Helper to normalize Lit's dynamic comment IDs for stable snapshots
function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}

function createOerItem(name: string): OerItem {
  return {
    amb: {
      name,
      description: `Description for ${name}`,
    },
    extensions: {
      fileMetadata: null,
      images: null,
      system: {
        source: 'openverse',
        foreignLandingUrl: null,
        attribution: null,
      },
    },
  };
}

function createSearchResult(items: OerItem[], page: number, total: number): SearchResult {
  const pageSize = 20;
  return {
    data: items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

function createMockClient(
  searchFn?: (params: SearchParams) => Promise<SearchResult>,
): SearchClient {
  const defaultSearch = () =>
    Promise.resolve(
      createSearchResult([createOerItem('Result 1'), createOerItem('Result 2')], 1, 40),
    );

  return {
    search: searchFn ?? defaultSearch,
    getAvailableSources: () => [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ],
    getDefaultSourceId: () => 'openverse',
    getRealSourceIds: () => ['openverse', 'arasaac'],
  };
}

describe('OerSearch', () => {
  let search: OerSearchElement;
  let createSpy: MockInstance<(config: ClientConfig) => SearchClient>;

  beforeEach(() => {
    createSpy = vi.spyOn(ClientFactory, 'create');
  });

  afterEach(() => {
    if (search?.parentElement) {
      document.body.removeChild(search);
    }
    vi.restoreAllMocks();
  });

  async function mountSearch(mockClient?: SearchClient): Promise<OerSearchElement> {
    const client = mockClient ?? createMockClient();
    createSpy.mockReturnValue(client);

    search = document.createElement('oer-search') as OerSearchElement;
    search.language = 'en';
    document.body.appendChild(search);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return search;
  }

  it('renders and matches snapshot', async () => {
    await mountSearch();

    const html = search.shadowRoot?.innerHTML || '';
    expect(normalizeLitHTML(html)).toMatchSnapshot();
  });

  describe('performSearch', () => {
    it('dispatches search-results event with page 1 data on initial search', async () => {
      const page1Items = [createOerItem('Item A'), createOerItem('Item B')];
      const mockClient = createMockClient(() =>
        Promise.resolve(createSearchResult(page1Items, 1, 40)),
      );

      await mountSearch(mockClient);

      const resultPromise = new Promise<OerSearchResultEvent>((resolve) => {
        search.addEventListener('search-results', ((e: CustomEvent<OerSearchResultEvent>) => {
          resolve(e.detail);
        }) as EventListener);
      });

      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      const result = await resultPromise;
      expect(result).toEqual({
        data: page1Items,
        meta: { total: 40, page: 1, pageSize: 20, totalPages: 2 },
      });
    });

    it('dispatches search-loading event when search starts', async () => {
      await mountSearch();

      let loadingFired = false;
      search.addEventListener('search-loading', () => {
        loadingFired = true;
      });

      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(loadingFired).toBe(true);
    });

    it('dispatches search-error event on client failure', async () => {
      const mockClient = createMockClient(() => Promise.reject(new Error('Network failure')));

      await mountSearch(mockClient);

      const errorPromise = new Promise<string>((resolve) => {
        search.addEventListener('search-error', ((e: CustomEvent<{ error: string }>) => {
          resolve(e.detail.error);
        }) as EventListener);
      });

      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      const errorMessage = await errorPromise;
      expect(errorMessage).toBe('Network failure');
    });
  });

  describe('handleLoadMore', () => {
    it('appends page 2 results to existing page 1 results', async () => {
      const page1Items = [createOerItem('Page1-A'), createOerItem('Page1-B')];
      const page2Items = [createOerItem('Page2-A'), createOerItem('Page2-B')];

      let callCount = 0;
      const mockClient = createMockClient((params: SearchParams) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createSearchResult(page1Items, params.page ?? 1, 40));
        }
        return Promise.resolve(createSearchResult(page2Items, params.page ?? 2, 40));
      });

      await mountSearch(mockClient);

      // First search (page 1)
      const firstResultPromise = new Promise<OerSearchResultEvent>((resolve) => {
        search.addEventListener(
          'search-results',
          ((e: CustomEvent<OerSearchResultEvent>) => {
            resolve(e.detail);
          }) as EventListener,
          { once: true },
        );
      });

      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      const firstResult = await firstResultPromise;
      expect(firstResult.data).toEqual(page1Items);

      // Load more (page 2)
      const secondResultPromise = new Promise<OerSearchResultEvent>((resolve) => {
        search.addEventListener(
          'search-results',
          ((e: CustomEvent<OerSearchResultEvent>) => {
            resolve(e.detail);
          }) as EventListener,
          { once: true },
        );
      });

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));

      const secondResult = await secondResultPromise;
      expect(secondResult.data).toEqual([...page1Items, ...page2Items]);
    });

    it('sends correct page number to the client on load-more', async () => {
      const searchCalls: SearchParams[] = [];
      const mockClient = createMockClient((params: SearchParams) => {
        searchCalls.push({ ...params });
        return Promise.resolve(createSearchResult([createOerItem('Item')], params.page ?? 1, 60));
      });

      await mountSearch(mockClient);

      // Initial search
      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // First load-more
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second load-more
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(searchCalls[0].page).toBe(1);
      expect(searchCalls[1].page).toBe(2);
      expect(searchCalls[2].page).toBe(3);
    });

    it('does not fire search when already loading', async () => {
      let resolveSearch: ((value: SearchResult) => void) | null = null;
      let searchCallCount = 0;

      const mockClient = createMockClient(() => {
        searchCallCount++;
        return new Promise<SearchResult>((resolve) => {
          resolveSearch = resolve;
        });
      });

      await mountSearch(mockClient);

      // Start initial search (will hang because we control the promise)
      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(searchCallCount).toBe(1);

      // Try load-more while still loading -- should be ignored
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(searchCallCount).toBe(1);

      // Resolve the pending search
      resolveSearch!(createSearchResult([createOerItem('Item')], 1, 40));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('uses snapshotted params so reactive updates cannot alter page during async search', async () => {
      const capturedParams: SearchParams[] = [];

      const mockClient = createMockClient((params: SearchParams) => {
        capturedParams.push({ ...params });
        // Simulate async delay
        return new Promise<SearchResult>((resolve) => {
          setTimeout(() => {
            resolve(
              createSearchResult([createOerItem(`Page${params.page}`)], params.page ?? 1, 60),
            );
          }, 5);
        });
      });

      await mountSearch(mockClient);

      // Initial search (page 1)
      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Load more (page 2) -- the critical scenario
      const resultPromise = new Promise<OerSearchResultEvent>((resolve) => {
        search.addEventListener(
          'search-results',
          ((e: CustomEvent<OerSearchResultEvent>) => {
            resolve(e.detail);
          }) as EventListener,
          { once: true },
        );
      });

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = await resultPromise;

      // The client must have received page=2, not page=1
      expect(capturedParams[1].page).toBe(2);

      // Results must be appended (not replaced) -- 2 items total
      expect(result.data).toHaveLength(2);
      expect(result.data[0].amb.name).toBe('Page1');
      expect(result.data[1].amb.name).toBe('Page2');
    });
  });

  describe('handleSubmit', () => {
    it('resets page to 1 and replaces accumulated results on new search', async () => {
      const page1Items = [createOerItem('First-Search')];
      const page2Items = [createOerItem('Page2')];
      const newSearchItems = [createOerItem('New-Search')];

      let callCount = 0;
      const mockClient = createMockClient(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createSearchResult(page1Items, 1, 40));
        }
        if (callCount === 2) {
          return Promise.resolve(createSearchResult(page2Items, 2, 40));
        }
        return Promise.resolve(createSearchResult(newSearchItems, 1, 10));
      });

      await mountSearch(mockClient);

      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;

      // First search
      searchInput.value = 'first';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Load more
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // New search -- should replace, not append
      const resultPromise = new Promise<OerSearchResultEvent>((resolve) => {
        search.addEventListener(
          'search-results',
          ((e: CustomEvent<OerSearchResultEvent>) => {
            resolve(e.detail);
          }) as EventListener,
          { once: true },
        );
      });

      searchInput.value = 'second';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      const result = await resultPromise;
      expect(result.data).toEqual(newSearchItems);
    });
  });

  describe('handleClear', () => {
    it('dispatches search-cleared event and resets state', async () => {
      await mountSearch();

      // Perform a search first
      const form = search.shadowRoot?.querySelector('form') as HTMLFormElement;
      const searchInput = search.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Click clear
      let clearedFired = false;
      search.addEventListener('search-cleared', () => {
        clearedFired = true;
      });

      const clearButton = search.shadowRoot?.querySelector('.clear-button') as HTMLButtonElement;
      clearButton.click();

      expect(clearedFired).toBe(true);
    });
  });
});
