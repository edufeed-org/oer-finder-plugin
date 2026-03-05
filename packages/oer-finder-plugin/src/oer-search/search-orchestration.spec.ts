import { describe, it, expect } from 'vitest';
import type { components } from '@edufeed-org/oer-finder-api-client';
import type { SearchResult } from '../clients/search-client.interface.js';
import {
  processSettledResults,
  interleaveWithOverflow,
  prepareLoadMore,
  mergeBufferAndFetched,
  computeLoadMoreMeta,
  type SourcePageState,
} from './search-orchestration.js';

type OerItem = components['schemas']['OerItemSchema'];

function createOerItem(name: string): OerItem {
  return {
    amb: { name, description: `Desc ${name}` },
    extensions: {
      fileMetadata: null,
      images: null,
      system: { source: 'test', foreignLandingUrl: null, attribution: null },
    },
  };
}

function items(prefix: string, count: number): OerItem[] {
  return Array.from({ length: count }, (_, i) => createOerItem(`${prefix}-${i + 1}`));
}

function fulfilled(
  data: OerItem[],
  page: number,
  total: number,
  pageSize = 20,
): PromiseSettledResult<SearchResult> {
  return {
    status: 'fulfilled',
    value: {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    },
  };
}

function rejected(reason: string): PromiseSettledResult<SearchResult> {
  return { status: 'rejected', reason: new Error(reason) };
}

describe('processSettledResults', () => {
  it('extracts source arrays with correct item counts', () => {
    const results = [fulfilled(items('A', 3), 1, 30), fulfilled(items('B', 2), 1, 10)];

    const { sourceArrays } = processSettledResults(results, ['src-a', 'src-b']);

    expect(sourceArrays.map((a) => a.length)).toEqual([3, 2]);
  });

  it('sums aggregate total from all fulfilled sources', () => {
    const results = [fulfilled(items('A', 3), 1, 30), fulfilled(items('B', 2), 1, 10)];

    const { aggregateTotal } = processSettledResults(results, ['src-a', 'src-b']);

    expect(aggregateTotal).toBe(40);
  });

  it('computes page states with hasMore based on totalPages', () => {
    const results = [fulfilled(items('A', 3), 1, 30), fulfilled(items('B', 2), 1, 10)];

    const { pageStates } = processSettledResults(results, ['src-a', 'src-b']);

    // src-a: 30 items / 20 pageSize = 2 pages → hasMore true
    // src-b: 10 items / 20 pageSize = 1 page → hasMore false
    expect(pageStates.get('src-a')).toEqual({ nextPage: 2, hasMore: true, serverTotal: 30 });
  });

  it('produces empty array and zero-state for rejected source', () => {
    const results = [fulfilled(items('A', 2), 1, 2, 20), rejected('Network error')];

    const { sourceArrays, pageStates } = processSettledResults(results, ['src-a', 'src-b']);

    expect(sourceArrays[1]).toEqual([]);
    expect(pageStates.get('src-b')).toEqual({ nextPage: 1, hasMore: false, serverTotal: 0 });
  });

  it('preserves existing page state on rejection with hasMore set to false', () => {
    const existing = new Map<string, SourcePageState>([
      ['src-a', { nextPage: 3, hasMore: true, serverTotal: 50 }],
    ]);

    const results = [rejected('timeout')];
    const { pageStates } = processSettledResults(results, ['src-a'], existing);

    expect(pageStates.get('src-a')).toEqual({ nextPage: 3, hasMore: false, serverTotal: 50 });
  });
});

describe('interleaveWithOverflow', () => {
  it('caps interleaved items at pageSize in round-robin order', () => {
    const sourceArrays = [items('A', 6), items('B', 6)];

    const { items: result } = interleaveWithOverflow(sourceArrays, ['a', 'b'], 6);

    expect(result.map((i) => i.amb.name)).toEqual(['A-1', 'B-1', 'A-2', 'B-2', 'A-3', 'B-3']);
  });

  it('stores unconsumed items in overflow per source', () => {
    const sourceArrays = [items('A', 6), items('B', 6)];

    const { overflow } = interleaveWithOverflow(sourceArrays, ['a', 'b'], 6);

    expect(overflow.get('a')?.map((i) => i.amb.name)).toEqual(['A-4', 'A-5', 'A-6']);
    expect(overflow.get('b')?.map((i) => i.amb.name)).toEqual(['B-4', 'B-5', 'B-6']);
  });

  it('returns empty overflow when all items fit within pageSize', () => {
    const sourceArrays = [items('A', 2), items('B', 2)];

    const { overflow } = interleaveWithOverflow(sourceArrays, ['a', 'b'], 10);

    expect(overflow.size).toBe(0);
  });

  it('handles single source without overflow', () => {
    const sourceArrays = [items('A', 5)];

    const { items: result } = interleaveWithOverflow(sourceArrays, ['a'], 5);

    expect(result).toHaveLength(5);
  });
});

describe('prepareLoadMore', () => {
  it('skips fetching when buffer has enough items', () => {
    const buffer = new Map<string, readonly OerItem[]>([
      ['a', items('A', 5)],
      ['b', items('B', 5)],
    ]);
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: true, serverTotal: 40 }],
      ['b', { nextPage: 2, hasMore: true, serverTotal: 40 }],
    ]);

    const { sourcesToFetch } = prepareLoadMore(['a', 'b'], buffer, pageStates, 10);

    expect(sourcesToFetch).toEqual([]);
  });

  it('returns all sources with hasMore when buffer is insufficient', () => {
    const buffer = new Map<string, readonly OerItem[]>([['a', items('A', 2)]]);
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: true, serverTotal: 40 }],
      ['b', { nextPage: 2, hasMore: true, serverTotal: 40 }],
    ]);

    const { sourcesToFetch } = prepareLoadMore(['a', 'b'], buffer, pageStates, 20);

    expect(sourcesToFetch).toEqual(['a', 'b']);
  });

  it('excludes exhausted sources from fetch list', () => {
    const buffer = new Map<string, readonly OerItem[]>();
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: true, serverTotal: 40 }],
      ['b', { nextPage: 2, hasMore: false, serverTotal: 5 }],
    ]);

    const { sourcesToFetch } = prepareLoadMore(['a', 'b'], buffer, pageStates, 20);

    expect(sourcesToFetch).toEqual(['a']);
  });

  it('populates sourceBuffers from overflow for each selected source', () => {
    const buffer = new Map<string, readonly OerItem[]>([['a', items('A', 3)]]);
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: false, serverTotal: 10 }],
      ['b', { nextPage: 2, hasMore: false, serverTotal: 10 }],
    ]);

    const { sourceBuffers } = prepareLoadMore(['a', 'b'], buffer, pageStates, 20);

    expect(sourceBuffers.map((a) => a.length)).toEqual([3, 0]);
  });
});

describe('mergeBufferAndFetched', () => {
  it('places buffer items before fetched items in order', () => {
    const buffers = [items('A-buf', 2), items('B-buf', 1)];
    const fetchedMap = new Map<string, readonly OerItem[]>([
      ['a', items('A-new', 3)],
      ['b', items('B-new', 3)],
    ]);

    const result = mergeBufferAndFetched(['a', 'b'], buffers, fetchedMap);

    expect(result[0].map((i) => i.amb.name)).toEqual([
      'A-buf-1',
      'A-buf-2',
      'A-new-1',
      'A-new-2',
      'A-new-3',
    ]);
  });

  it('returns buffer-only items for sources not in fetchedMap', () => {
    const buffers = [items('A', 2)];
    const fetchedMap = new Map<string, readonly OerItem[]>();

    const result = mergeBufferAndFetched(['a'], buffers, fetchedMap);

    expect(result[0]).toHaveLength(2);
  });
});

describe('computeLoadMoreMeta', () => {
  it('reports hasMore when overflow buffer has items', () => {
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: false, serverTotal: 20 }],
    ]);
    const overflow = new Map<string, readonly OerItem[]>([['a', items('A', 3)]]);

    const meta = computeLoadMoreMeta(pageStates, overflow, 10);

    expect(meta).toEqual({ total: 20, shown: 10, hasMore: true });
  });

  it('reports hasMore when server has more pages', () => {
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: true, serverTotal: 40 }],
    ]);

    const meta = computeLoadMoreMeta(pageStates, new Map(), 20);

    expect(meta).toEqual({ total: 40, shown: 20, hasMore: true });
  });

  it('reports no more when buffer is empty and all sources exhausted', () => {
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: false, serverTotal: 5 }],
    ]);

    const meta = computeLoadMoreMeta(pageStates, new Map(), 5);

    expect(meta).toEqual({ total: 5, shown: 5, hasMore: false });
  });

  it('aggregates totals across multiple sources', () => {
    const pageStates = new Map<string, SourcePageState>([
      ['a', { nextPage: 2, hasMore: false, serverTotal: 15 }],
      ['b', { nextPage: 2, hasMore: false, serverTotal: 25 }],
    ]);

    const meta = computeLoadMoreMeta(pageStates, new Map(), 20);

    expect(meta.total).toBe(40);
  });
});
