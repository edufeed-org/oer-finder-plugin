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
  availableSources?: { id: string; label: string; checked?: boolean }[],
): SearchClient {
  const defaultSearch = () =>
    Promise.resolve(
      createSearchResult([createOerItem('Result 1'), createOerItem('Result 2')], 1, 40),
    );

  const sources = availableSources ?? [{ id: 'openverse', label: 'Openverse' }];

  return {
    search: searchFn ?? defaultSearch,
    getAvailableSources: () => sources,
    getSourceIds: () => sources.map((s) => s.id),
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

  function triggerSearch(el: OerSearchElement, term: string): void {
    const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
    const searchInput = el.shadowRoot?.querySelector('#searchTerm') as HTMLInputElement;
    searchInput.value = term;
    searchInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
  }

  function awaitSearchResult(el: OerSearchElement): Promise<OerSearchResultEvent> {
    return new Promise<OerSearchResultEvent>((resolve) => {
      el.addEventListener(
        'search-results',
        ((e: CustomEvent<OerSearchResultEvent>) => {
          resolve(e.detail);
        }) as EventListener,
        { once: true },
      );
    });
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

      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');

      const result = await resultPromise;
      expect(result).toEqual({
        data: page1Items,
        meta: { total: 40, shown: 2, hasMore: true },
      });
    });

    it('dispatches search-loading event when search starts', async () => {
      await mountSearch();

      let loadingFired = false;
      search.addEventListener('search-loading', () => {
        loadingFired = true;
      });

      triggerSearch(search, 'test');

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(loadingFired).toBe(true);
    });

    it('dispatches search-results with empty data when source fails', async () => {
      const mockClient = createMockClient(() => Promise.reject(new Error('Network failure')));

      await mountSearch(mockClient);

      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');

      const result = await resultPromise;
      expect(result).toEqual({
        data: [],
        meta: { total: 0, shown: 0, hasMore: false },
      });
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

      const firstResultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');
      await firstResultPromise;

      const secondResultPromise = awaitSearchResult(search);
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

      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(searchCalls.map((c) => c.page)).toEqual([1, 2, 3]);
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

      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Try load-more while still loading -- should be ignored
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(searchCallCount).toBe(1);

      // Resolve the pending search
      resolveSearch!(createSearchResult([createOerItem('Item')], 1, 40));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('sends correct page param for load-more during async search', async () => {
      const capturedParams: SearchParams[] = [];

      const mockClient = createMockClient((params: SearchParams) => {
        capturedParams.push({ ...params });
        return new Promise<SearchResult>((resolve) => {
          setTimeout(() => {
            resolve(
              createSearchResult([createOerItem(`Page${params.page}`)], params.page ?? 1, 60),
            );
          }, 5);
        });
      });

      await mountSearch(mockClient);

      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 20));

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(capturedParams[1].page).toBe(2);
    });

    it('appends results from async load-more without replacing', async () => {
      const mockClient = createMockClient((params: SearchParams) => {
        return new Promise<SearchResult>((resolve) => {
          setTimeout(() => {
            resolve(
              createSearchResult([createOerItem(`Page${params.page}`)], params.page ?? 1, 60),
            );
          }, 5);
        });
      });

      await mountSearch(mockClient);

      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 20));

      const resultPromise = awaitSearchResult(search);
      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      const result = await resultPromise;

      expect(result.data.map((d) => d.amb.name)).toEqual(['Page1', 'Page2']);
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

      triggerSearch(search, 'first');
      await new Promise((resolve) => setTimeout(resolve, 10));

      search.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'second');

      const result = await resultPromise;
      expect(result.data).toEqual(newSearchItems);
    });
  });

  describe('handleClear', () => {
    it('dispatches search-cleared event and resets state', async () => {
      await mountSearch();

      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      let clearedFired = false;
      search.addEventListener('search-cleared', () => {
        clearedFired = true;
      });

      const clearButton = search.shadowRoot?.querySelector('.clear-button') as HTMLButtonElement;
      clearButton.click();

      expect(clearedFired).toBe(true);
    });
  });

  function expandAdvancedFilters(el: OerSearchElement): void {
    const toggleButton = el.shadowRoot?.querySelector(
      '.toggle-filters-button',
    ) as HTMLButtonElement;
    toggleButton.click();
  }

  describe('handleSourceToggle', () => {
    it('dispatches search-cleared event when source checkbox is toggled', async () => {
      const mockClient = createMockClient(undefined, [
        { id: 'openverse', label: 'OV', checked: true },
        { id: 'arasaac', label: 'AR' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Perform a search first so there are results to clear
      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      let clearedFired = false;
      search.addEventListener('search-cleared', () => {
        clearedFired = true;
      });

      // Toggle arasaac on -- should dispatch search-cleared
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change'));

      expect(clearedFired).toBe(true);
    });

    it('clears accumulated results after toggling source and searching new source only', async () => {
      const arasaacItems = [createOerItem('ARASAAC-1')];
      const nostrItems = [createOerItem('Nostr-1')];

      let callCount = 0;
      const mockClient = createMockClient(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createSearchResult(arasaacItems, 1, 1));
        }
        return Promise.resolve(createSearchResult(nostrItems, 1, 1));
      }, [
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'nostr-amb-relay', label: 'Nostr' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Search with arasaac only
      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Toggle nostr on, then arasaac off
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change')); // nostr on
      await new Promise((resolve) => setTimeout(resolve, 0));
      checkboxes[0].dispatchEvent(new Event('change')); // arasaac off
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Search again with only nostr selected
      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');
      const result = await resultPromise;

      // Should contain ONLY nostr results, no stale arasaac
      expect(result.data).toEqual(nostrItems);
    });

    it('only queries the newly selected source after toggle, not the old one', async () => {
      const searchedSources: string[] = [];
      const mockClient = createMockClient(
        (params: SearchParams) => {
          if (params.source) searchedSources.push(params.source);
          return Promise.resolve(createSearchResult([createOerItem('Item')], 1, 1));
        },
        [
          { id: 'arasaac', label: 'AR', checked: true },
          { id: 'nostr-amb-relay', label: 'Nostr' },
        ],
      );

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // First search with arasaac
      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Clear the tracked sources
      searchedSources.length = 0;

      // Toggle: nostr on, arasaac off
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change')); // nostr on
      await new Promise((resolve) => setTimeout(resolve, 0));
      checkboxes[0].dispatchEvent(new Event('change')); // arasaac off
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Search again — should ONLY query nostr-amb-relay
      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');
      await resultPromise;

      expect(searchedSources).toEqual(['nostr-amb-relay']);
    });

    it('discards in-flight search results when source checkbox is toggled', async () => {
      let resolveFirstSearch: ((value: SearchResult) => void) | null = null;

      const mockClient = createMockClient(() => {
        return new Promise<SearchResult>((resolve) => {
          resolveFirstSearch = resolve;
        });
      }, [
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'nostr-amb-relay', label: 'Nostr' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Start search with arasaac (will hang)
      triggerSearch(search, 'test');
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Toggle to nostr while first search is still in-flight
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change')); // nostr on
      await new Promise((resolve) => setTimeout(resolve, 0));
      checkboxes[0].dispatchEvent(new Event('change')); // arasaac off
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Track if stale search-results fires after resolving
      let staleResultsFired = false;
      search.addEventListener(
        'search-results',
        () => {
          staleResultsFired = true;
        },
        { once: true },
      );

      // Resolve the stale first search — should be discarded
      resolveFirstSearch!(createSearchResult([createOerItem('Stale-Result')], 1, 1));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Stale results must NOT be emitted as a search-results event
      expect(staleResultsFired).toBe(false);
    });

    it('only searches the new source when user unchecks default and checks another before first search', async () => {
      const searchedSources: string[] = [];
      const mockClient = createMockClient(
        (params: SearchParams) => {
          if (params.source) searchedSources.push(params.source);
          return Promise.resolve(createSearchResult([createOerItem('Item')], 1, 1));
        },
        [
          { id: 'arasaac', label: 'AR', checked: true },
          { id: 'nostr-amb-relay', label: 'Nostr' },
        ],
      );

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;

      // Uncheck arasaac
      checkboxes[0].dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check nostr
      checkboxes[1].dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // First search — should ONLY query nostr
      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');
      await resultPromise;

      expect(searchedSources).toEqual(['nostr-amb-relay']);
    });
  });

  describe('sources property re-set by parent', () => {
    it('preserves user checkbox selection when parent re-sets sources with same content', async () => {
      const sourcesConfig = [
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'nostr-amb-relay', label: 'Nostr', checked: true },
      ];

      const searchedSources: string[] = [];
      const mockClient = createMockClient(
        (params: SearchParams) => {
          if (params.source) searchedSources.push(params.source);
          return Promise.resolve(createSearchResult([createOerItem('Item')], 1, 1));
        },
        [
          { id: 'arasaac', label: 'AR', checked: true },
          { id: 'nostr-amb-relay', label: 'Nostr', checked: true },
        ],
      );

      createSpy.mockReturnValue(mockClient);

      search = document.createElement('oer-search') as OerSearchElement;
      search.language = 'en';
      search.sources = sourcesConfig.map((s) => ({ ...s }));
      document.body.appendChild(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // User unchecks arasaac (toggles it off)
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[0].dispatchEvent(new Event('change')); // arasaac off
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Simulate parent re-setting sources (same content, new array reference)
      // This is what React/Angular/Vue do on every parent render cycle
      search.sources = sourcesConfig.map((s) => ({ ...s }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Now search — should ONLY query nostr-amb-relay (user's selection)
      searchedSources.length = 0;
      const resultPromise = awaitSearchResult(search);
      triggerSearch(search, 'test');
      await resultPromise;

      // BUG: Without the fix, this will be ['arasaac', 'nostr-amb-relay']
      // because initializeClient() reset selectedSources to defaults
      expect(searchedSources).toEqual(['nostr-amb-relay']);
    });

    it('resets selections when parent changes available source IDs', async () => {
      const initialClient = createMockClient(undefined, [
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'nostr-amb-relay', label: 'Nostr', checked: true },
      ]);

      const updatedClient = createMockClient(undefined, [
        { id: 'openverse', label: 'OV', checked: true },
        { id: 'rpi-virtuell', label: 'RPI', checked: true },
      ]);

      createSpy.mockReturnValue(initialClient);

      search = document.createElement('oer-search') as OerSearchElement;
      search.language = 'en';
      search.sources = [
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'nostr-amb-relay', label: 'Nostr', checked: true },
      ];
      document.body.appendChild(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // User unchecks arasaac
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[0].dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Parent changes to different sources entirely
      createSpy.mockReturnValue(updatedClient);
      search.sources = [
        { id: 'openverse', label: 'OV', checked: true },
        { id: 'rpi-virtuell', label: 'RPI', checked: true },
      ];
      await new Promise((resolve) => setTimeout(resolve, 0));

      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Checkboxes should reflect the new source defaults, not the old selections
      const updatedCheckboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;

      expect(Array.from(updatedCheckboxes).map((cb) => cb.checked)).toEqual([true, true]);
    });
  });

  describe('checked-based default selection', () => {
    it('pre-selects only checked sources when some have checked flag', async () => {
      const mockClient = createMockClient(undefined, [
        { id: 'openverse', label: 'OV' },
        { id: 'arasaac', label: 'AR', checked: true },
        { id: 'rpi-virtuell', label: 'RPI' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;

      expect(Array.from(checkboxes).map((cb) => cb.checked)).toEqual([false, true, false]);
    });

    it('pre-selects all sources when none have checked flag', async () => {
      const mockClient = createMockClient(undefined, [
        { id: 'openverse', label: 'OV' },
        { id: 'arasaac', label: 'AR' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;

      expect(Array.from(checkboxes).map((cb) => cb.checked)).toEqual([true, true]);
    });

    it('resets to checked sources on clear, not all sources', async () => {
      const mockClient = createMockClient(undefined, [
        { id: 'openverse', label: 'OV', checked: true },
        { id: 'arasaac', label: 'AR' },
      ]);

      await mountSearch(mockClient);
      expandAdvancedFilters(search);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Toggle arasaac on
      const checkboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Click clear
      const clearButton = search.shadowRoot?.querySelector('.clear-button') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const updatedCheckboxes = search.shadowRoot?.querySelectorAll(
        '.checkbox-group input[type="checkbox"]',
      ) as NodeListOf<HTMLInputElement>;

      expect(Array.from(updatedCheckboxes).map((cb) => cb.checked)).toEqual([true, false]);
    });
  });
});
