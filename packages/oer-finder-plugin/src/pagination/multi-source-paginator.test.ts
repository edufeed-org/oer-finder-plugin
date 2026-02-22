import { describe, it, expect } from 'vitest';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { createMultiSourceState, loadNextPage } from './multi-source-paginator.js';
import type { FetchPageFn, MultiSourceConfig } from './types.js';

type OerItem = components['schemas']['OerItemSchema'];

function mockItem(name: string): OerItem {
  return {
    amb: { name, description: `Desc ${name}` },
    extensions: {
      fileMetadata: null,
      images: null,
      system: { source: 'test', foreignLandingUrl: null, attribution: null },
    },
  };
}

function makeConfig(
  sourceIds: string[],
  fetchPage: FetchPageFn,
  pageSize = 20,
  timeoutMs = 5000,
): MultiSourceConfig {
  return { sourceIds, fetchPage, pageSize, timeoutMs };
}

describe('createMultiSourceState', () => {
  it('creates initial state with correct sources', () => {
    const state = createMultiSourceState(['A', 'B']);

    expect(state.sources.size).toBe(2);
    expect(state.sources.get('A')?.sourceId).toBe('A');
  });

  it('initializes with zeroed counters and fresh page state', () => {
    const state = createMultiSourceState(['A', 'B']);

    expect(state.sources.get('B')?.nextPage).toBe(1);
    expect({ totalShown: state.totalShown, aggregateTotal: state.aggregateTotal }).toEqual({
      totalShown: 0,
      aggregateTotal: 0,
    });
  });
});

describe('loadNextPage', () => {
  it('fetches from all sources on first load', async () => {
    const calls: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push(sourceId);
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage);
    await loadNextPage(config, state);

    expect(calls).toEqual(['A', 'B']);
  });

  it('does not re-fetch when buffers have enough items', async () => {
    const calls: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push(sourceId);
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage);
    const first = await loadNextPage(config, state);

    calls.length = 0;
    await loadNextPage(config, first.nextState);

    expect(calls).toEqual([]);
  });

  it('interleaves results round-robin', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      const items = Array.from({ length: 3 }, (_, i) => mockItem(`${sourceId}-${i}`));
      return { items, total: 30, totalPages: 10, page: 1 };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 6);
    const result = await loadNextPage(config, state);

    const names = result.items.map((d) => d.amb.name);
    expect(names).toEqual(['A-0', 'B-0', 'A-1', 'B-1', 'A-2', 'B-2']);
  });

  it('trims results to pageSize', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-${i}`));
      return { items, total: 100, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 10);
    const result = await loadNextPage(config, state);

    expect(result.items).toHaveLength(10);
  });

  it('buffers unconsumed items for next load', async () => {
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 10);

    // First load: fetch 20 each, consume 5 from each (10 total), buffer 15 each
    const first = await loadNextPage(config, state);
    expect(first.items).toHaveLength(10);

    const bufferA = first.nextState.sources.get('A')!.buffer.length;
    const bufferB = first.nextState.sources.get('B')!.buffer.length;
    expect(bufferA + bufferB).toBe(30); // 40 fetched - 10 consumed = 30 buffered
  });

  it('returns fast source items when slow source times out', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      if (sourceId === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { items: [mockItem('slow')], total: 10, totalPages: 1, page: 1 };
      }
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`fast-${i}`));
      return { items, total: 100, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['slow', 'fast']);
    const config = makeConfig(['slow', 'fast'], fetchPage, 20, 50);
    const result = await loadNextPage(config, state);

    expect(result.items).toHaveLength(20);
    expect(result.items[0].amb.name).toBe('fast-0');
  });

  it('deactivates timed-out source', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      if (sourceId === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { items: [mockItem('slow')], total: 10, totalPages: 1, page: 1 };
      }
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`fast-${i}`));
      return { items, total: 100, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['slow', 'fast']);
    const config = makeConfig(['slow', 'fast'], fetchPage, 20, 50);
    const result = await loadNextPage(config, state);

    expect(result.nextState.sources.get('slow')!.active).toBe(false);
  });

  it('returns good source items when broken source errors', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      if (sourceId === 'broken') {
        throw new Error('Network error');
      }
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`good-${i}`));
      return { items, total: 100, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['broken', 'good']);
    const config = makeConfig(['broken', 'good'], fetchPage);
    const result = await loadNextPage(config, state);

    expect(result.items).toHaveLength(20);
    expect(result.items[0].amb.name).toBe('good-0');
  });

  it('deactivates errored source', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      if (sourceId === 'broken') {
        throw new Error('Network error');
      }
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`good-${i}`));
      return { items, total: 100, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['broken', 'good']);
    const config = makeConfig(['broken', 'good'], fetchPage);
    const result = await loadNextPage(config, state);

    expect(result.nextState.sources.get('broken')!.active).toBe(false);
  });

  it('returns empty when all sources are exhausted', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      return { items: [mockItem(`${sourceId}-last`)], total: 1, totalPages: 1, page: 1 };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 10);

    // First load consumes all items and exhausts both sources
    const first = await loadNextPage(config, state);

    // Second load should return empty
    const second = await loadNextPage(config, first.nextState);
    expect(second.items).toEqual([]);
    expect(second.meta.hasMore).toBe(false);
  });

  it('never loses items across multiple loads', async () => {
    const allItemsShown: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      const items = Array.from({ length: 20 }, (_, i) =>
        mockItem(`${sourceId}-${(page - 1) * 20 + i}`),
      );
      return { items, total: 40, totalPages: 2, page };
    };

    const config = makeConfig(['A', 'B'], fetchPage, 20);
    let state = createMultiSourceState(['A', 'B']);

    // Load 4 times to exhaust both sources (40 items each = 80 total)
    for (let i = 0; i < 4; i++) {
      const result = await loadNextPage(config, state);
      allItemsShown.push(...result.items.map((d) => d.amb.name ?? ''));
      state = result.nextState;
    }

    const expected = [
      ...Array.from({ length: 40 }, (_, i) => `A-${i}`),
      ...Array.from({ length: 40 }, (_, i) => `B-${i}`),
    ].sort();

    expect([...new Set(allItemsShown)].sort()).toEqual(expected);
  });

  it('computes correct meta', async () => {
    const fetchPage: FetchPageFn = async (sourceId) => {
      const items = Array.from({ length: 5 }, (_, i) => mockItem(`${sourceId}-${i}`));
      return { items, total: sourceId === 'A' ? 50 : 30, totalPages: 5, page: 1 };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 6);
    const result = await loadNextPage(config, state);

    expect(result.meta).toEqual({ total: 80, shown: 6, hasMore: true });
  });

  it('does not re-fetch failed source on subsequent loads', async () => {
    const calls: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push(sourceId);
      if (sourceId === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { items: [mockItem('slow')], total: 10, totalPages: 1, page };
      }
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`fast-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const state = createMultiSourceState(['slow', 'fast']);
    const config = makeConfig(['slow', 'fast'], fetchPage, 20, 50);
    const first = await loadNextPage(config, state);

    calls.length = 0;
    await loadNextPage(config, first.nextState);

    expect(calls).not.toContain('slow');
  });

  it('fetches more when total buffered is less than pageSize', async () => {
    const calls: Array<{ source: string; page: number }> = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push({ source: sourceId, page });
      const items = Array.from({ length: 10 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 10, page };
    };

    const state = createMultiSourceState(['A', 'B']);
    const config = makeConfig(['A', 'B'], fetchPage, 20);

    // First load: fetches page 1 from both (10+10=20 items)
    const first = await loadNextPage(config, state);
    expect(first.items).toHaveLength(20);

    // Buffers should be empty, so second load should fetch again
    const second = await loadNextPage(config, first.nextState);
    expect(second.items).toHaveLength(20);
  });
});
