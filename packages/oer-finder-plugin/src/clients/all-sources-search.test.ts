import { describe, it, expect, vi } from 'vitest';
import { searchAllSources, type SingleSourceSearchFn } from './all-sources-search.js';
import type { SearchResult, AllSourcesState } from './search-client.interface.js';

function createSearchResult(
  itemNames: string[],
  page: number,
  total: number,
  pageSize: number,
): SearchResult {
  return {
    data: itemNames.map((name) => ({
      amb: { name, description: `Desc ${name}` },
      extensions: {
        fileMetadata: null,
        images: null,
        system: { source: 'test', foreignLandingUrl: null, attribution: null },
      },
    })),
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

describe('searchAllSources', () => {
  it('requests full totalPageSize from each source for gap filling', async () => {
    const searchCalls: Array<{ source: string; pageSize: number }> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push({ source: params.source, pageSize: params.pageSize });
      return createSearchResult(['item1', 'item2', 'item3'], 1, 30, params.pageSize);
    };

    await searchAllSources({
      sourceIds: ['sourceA', 'sourceB'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    expect(searchCalls).toHaveLength(2);
    expect(searchCalls[0]).toEqual({ source: 'sourceA', pageSize: 20 });
    expect(searchCalls[1]).toEqual({ source: 'sourceB', pageSize: 20 });
  });

  it('fills gaps when one source returns fewer results than anticipated', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'sparse') {
        return createSearchResult(['s1', 's2', 's3'], 1, 3, params.pageSize);
      }
      const items = Array.from({ length: 10 }, (_, i) => `full-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const result = await searchAllSources({
      sourceIds: ['sparse', 'full'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
    });

    expect(result.data).toHaveLength(10);
  });

  it('handles one source timing out by returning full results from the other', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return createSearchResult(['slow-item'], 1, 10, 10);
      }
      const items = Array.from({ length: 20 }, (_, i) => `fast-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const result = await searchAllSources({
      sourceIds: ['slow', 'fast'],
      searchFn,
      timeoutMs: 50,
      totalPageSize: 20,
    });

    expect(result.data).toHaveLength(20);
    expect(result.data[0].amb.name).toBe('fast-0');
  });

  it('handles one source failing by returning full results from the other', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'broken') {
        throw new Error('Network error');
      }
      const items = Array.from({ length: 20 }, (_, i) => `good-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const result = await searchAllSources({
      sourceIds: ['broken', 'working'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    expect(result.data).toHaveLength(20);
    expect(result.data[0].amb.name).toBe('good-0');
  });

  it('interleaves results round-robin from multiple sources', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'A') {
        return createSearchResult(['A1', 'A2', 'A3'], 1, 30, 10);
      }
      return createSearchResult(['B1', 'B2', 'B3'], 1, 30, 10);
    };

    const result = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 6,
    });

    const names = result.data.map((d) => d.amb.name);
    expect(names).toEqual(['A1', 'B1', 'A2', 'B2', 'A3', 'B3']);
  });

  it('preserves cursor state for Load More across calls', async () => {
    const searchCalls: Array<{ source: string; page: number }> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push({ source: params.source, page: params.page });
      const items = Array.from({ length: 5 }, (_, i) => `${params.source}-p${params.page}-${i}`);
      return createSearchResult(items, params.page, 50, 5);
    };

    // First call: each source returns 5, interleave → 10, all consumed
    const first = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
    });

    expect(searchCalls[0]).toEqual({ source: 'A', page: 1 });
    expect(searchCalls[1]).toEqual({ source: 'B', page: 1 });

    // All 5 items consumed from each, pages fully consumed → advance to page 2
    const cursorA = first.allSourcesState.cursors.find((c) => c.sourceId === 'A');
    const cursorB = first.allSourcesState.cursors.find((c) => c.sourceId === 'B');
    expect(cursorA).toEqual({ sourceId: 'A', nextPage: 2, nextSkip: 0, hasMore: true });
    expect(cursorB).toEqual({ sourceId: 'B', nextPage: 2, nextSkip: 0, hasMore: true });

    // Second call with cursor state from first
    await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
      previousState: first.allSourcesState,
    });

    expect(searchCalls[2]).toEqual({ source: 'A', page: 2 });
    expect(searchCalls[3]).toEqual({ source: 'B', page: 2 });
  });

  it('skips sources with hasMore: false on subsequent calls', async () => {
    const searchCalls: string[] = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push(params.source);
      const items = Array.from({ length: 10 }, (_, i) => `${params.source}-${i}`);
      return createSearchResult(items, params.page, 50, 10);
    };

    const exhaustedState: AllSourcesState = {
      cursors: [
        { sourceId: 'A', nextPage: 4, nextSkip: 0, hasMore: false },
        { sourceId: 'B', nextPage: 2, nextSkip: 0, hasMore: true },
      ],
    };

    await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
      previousState: exhaustedState,
    });

    expect(searchCalls).toEqual(['B']);
  });

  it('returns empty data when all sources are exhausted', async () => {
    const searchFn: SingleSourceSearchFn = vi.fn();

    const exhaustedState: AllSourcesState = {
      cursors: [
        { sourceId: 'A', nextPage: 4, nextSkip: 0, hasMore: false },
        { sourceId: 'B', nextPage: 3, nextSkip: 0, hasMore: false },
      ],
    };

    const result = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
      previousState: exhaustedState,
    });

    expect(result.data).toEqual([]);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it('requests full totalPageSize from single source', async () => {
    const searchCalls: Array<{ source: string; pageSize: number }> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push({ source: params.source, pageSize: params.pageSize });
      return createSearchResult(['item1'], 1, 10, params.pageSize);
    };

    await searchAllSources({
      sourceIds: ['only'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    expect(searchCalls).toHaveLength(1);
    expect(searchCalls[0]).toEqual({ source: 'only', pageSize: 20 });
  });

  it('trims merged results to totalPageSize', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      const items = Array.from({ length: 8 }, (_, i) => `${params.source}-${i}`);
      return createSearchResult(items, 1, 50, 8);
    };

    const result = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
    });

    expect(result.data).toHaveLength(10);
  });

  it('computes synthetic meta with summed totals', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'A') {
        return createSearchResult(['A1'], 1, 50, 5);
      }
      return createSearchResult(['B1'], 1, 30, 5);
    };

    const result = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
    });

    expect(result.meta.total).toBe(80);
    expect(result.meta.pageSize).toBe(10);
    expect(result.meta.totalPages).toBe(8);
  });

  it('passes source, page, and pageSize to searchFn', async () => {
    const capturedParams: Array<Record<string, unknown>> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      capturedParams.push({ ...params });
      return createSearchResult(['item'], 1, 10, 10);
    };

    await searchAllSources({
      sourceIds: ['A'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 10,
    });

    expect(capturedParams[0]).toMatchObject({
      source: 'A',
      page: 1,
      pageSize: 10,
    });
  });

  // Bug 1: Timed-out sources should be excluded from subsequent loads
  it('marks timed-out source as exhausted in cursor state', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return createSearchResult(['slow-item'], 1, 10, 10);
      }
      const items = Array.from({ length: 20 }, (_, i) => `fast-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const result = await searchAllSources({
      sourceIds: ['slow', 'fast'],
      searchFn,
      timeoutMs: 50,
      totalPageSize: 20,
    });

    const slowCursor = result.allSourcesState.cursors.find((c) => c.sourceId === 'slow');
    expect(slowCursor).toEqual({ sourceId: 'slow', nextPage: 1, nextSkip: 0, hasMore: false });

    const fastCursor = result.allSourcesState.cursors.find((c) => c.sourceId === 'fast');
    expect(fastCursor?.hasMore).toBe(true);
  });

  it('does not retry timed-out source on subsequent Load More', async () => {
    const searchCalls: string[] = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push(params.source);
      if (params.source === 'slow') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return createSearchResult(['slow-item'], 1, 10, 10);
      }
      const items = Array.from({ length: 20 }, (_, i) => `fast-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const first = await searchAllSources({
      sourceIds: ['slow', 'fast'],
      searchFn,
      timeoutMs: 50,
      totalPageSize: 20,
    });

    expect(searchCalls).toEqual(['slow', 'fast']);

    await searchAllSources({
      sourceIds: ['slow', 'fast'],
      searchFn,
      timeoutMs: 50,
      totalPageSize: 20,
      previousState: first.allSourcesState,
    });

    // Only 'fast' should be queried on second call
    expect(searchCalls).toEqual(['slow', 'fast', 'fast']);
  });

  it('marks errored source as exhausted in cursor state', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      if (params.source === 'broken') {
        throw new Error('Network error');
      }
      const items = Array.from({ length: 20 }, (_, i) => `good-${i}`);
      return createSearchResult(items, 1, 50, params.pageSize);
    };

    const result = await searchAllSources({
      sourceIds: ['broken', 'working'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    const brokenCursor = result.allSourcesState.cursors.find((c) => c.sourceId === 'broken');
    expect(brokenCursor).toEqual({
      sourceId: 'broken',
      nextPage: 1,
      nextSkip: 0,
      hasMore: false,
    });
  });

  // Bug 2: Offset tracking when partial results are consumed
  it('tracks consumed items correctly when not all items from each source are shown', async () => {
    const searchFn: SingleSourceSearchFn = async (params) => {
      // Each source returns 20 items per page
      const items = Array.from(
        { length: 20 },
        (_, i) => `${params.source}-${(params.page - 1) * 20 + i}`,
      );
      return createSearchResult(items, params.page, 100, 20);
    };

    // 2 sources each return 20 items, interleave → 40, slice to 20
    // That's 10 items consumed from each source
    const first = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    expect(first.data).toHaveLength(20);
    // Page not fully consumed (10 of 20 used) → stay on page 1, skip 10
    const cursorA = first.allSourcesState.cursors.find((c) => c.sourceId === 'A');
    const cursorB = first.allSourcesState.cursors.find((c) => c.sourceId === 'B');
    expect(cursorA).toEqual({ sourceId: 'A', nextPage: 1, nextSkip: 10, hasMore: true });
    expect(cursorB).toEqual({ sourceId: 'B', nextPage: 1, nextSkip: 10, hasMore: true });
  });

  it('re-fetches same page and skips already-consumed items on Load More', async () => {
    const searchCalls: Array<{ source: string; page: number }> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push({ source: params.source, page: params.page });
      const items = Array.from(
        { length: 20 },
        (_, i) => `${params.source}-${(params.page - 1) * 20 + i}`,
      );
      return createSearchResult(items, params.page, 100, 20);
    };

    // First call: consume 10 from each source (20 items total from 2 sources)
    const first = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });

    // Second call: re-fetches page 1 for both, skips first 10 items
    const second = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
      previousState: first.allSourcesState,
    });

    // Should still request page 1 (since skip=10 means page 1 wasn't fully consumed)
    expect(searchCalls[2]).toEqual({ source: 'A', page: 1 });
    expect(searchCalls[3]).toEqual({ source: 'B', page: 1 });

    // The items should be from position 10-19 (the unseen portion of page 1)
    const names = second.data.map((d) => d.amb.name);
    expect(names[0]).toBe('A-10');
    expect(names[1]).toBe('B-10');

    // After consuming the remaining 10 from each: total used = 20 = data.length
    // Page fully consumed → advance to page 2, skip 0
    const cursorA = second.allSourcesState.cursors.find((c) => c.sourceId === 'A');
    const cursorB = second.allSourcesState.cursors.find((c) => c.sourceId === 'B');
    expect(cursorA).toEqual({ sourceId: 'A', nextPage: 2, nextSkip: 0, hasMore: true });
    expect(cursorB).toEqual({ sourceId: 'B', nextPage: 2, nextSkip: 0, hasMore: true });
  });

  it('advances to next page once current page is fully consumed', async () => {
    const searchCalls: Array<{ source: string; page: number }> = [];
    const searchFn: SingleSourceSearchFn = async (params) => {
      searchCalls.push({ source: params.source, page: params.page });
      const items = Array.from(
        { length: 20 },
        (_, i) => `${params.source}-${(params.page - 1) * 20 + i}`,
      );
      return createSearchResult(items, params.page, 100, 20);
    };

    // Start from page 2 (page 1 was fully consumed)
    const state: AllSourcesState = {
      cursors: [
        { sourceId: 'A', nextPage: 2, nextSkip: 0, hasMore: true },
        { sourceId: 'B', nextPage: 2, nextSkip: 0, hasMore: true },
      ],
    };

    await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
      previousState: state,
    });

    expect(searchCalls[0]).toEqual({ source: 'A', page: 2 });
    expect(searchCalls[1]).toEqual({ source: 'B', page: 2 });
  });

  it('never loses items across multiple Load More clicks', async () => {
    const allItemsShown: string[] = [];
    const getName = (d: { amb: { name?: string } }): string => d.amb.name ?? '';
    const searchFn: SingleSourceSearchFn = async (params) => {
      const items = Array.from(
        { length: 20 },
        (_, i) => `${params.source}-${(params.page - 1) * 20 + i}`,
      );
      return createSearchResult(items, params.page, 40, 20);
    };

    // Click 1: fresh search
    const r1 = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
    });
    allItemsShown.push(...r1.data.map(getName));

    // Click 2: Load More
    const r2 = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
      previousState: r1.allSourcesState,
    });
    allItemsShown.push(...r2.data.map(getName));

    // Click 3: Load More
    const r3 = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
      previousState: r2.allSourcesState,
    });
    allItemsShown.push(...r3.data.map(getName));

    // Click 4: Load More
    const r4 = await searchAllSources({
      sourceIds: ['A', 'B'],
      searchFn,
      timeoutMs: 5000,
      totalPageSize: 20,
      previousState: r3.allSourcesState,
    });
    allItemsShown.push(...r4.data.map(getName));

    // Build expected set: A-0..A-39 and B-0..B-39
    const expected = [
      ...Array.from({ length: 40 }, (_, i) => `A-${i}`),
      ...Array.from({ length: 40 }, (_, i) => `B-${i}`),
    ].sort();

    // Verify no duplicates and all items present via sorted array comparison
    expect([...new Set(allItemsShown)].sort()).toEqual(expected);
  });
});
