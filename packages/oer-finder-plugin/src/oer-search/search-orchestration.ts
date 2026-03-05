import type { components } from '@edufeed-org/oer-finder-api-client';
import type { SearchResult } from '../clients/search-client.interface.js';
import { interleave } from '../interleave.js';
import type { LoadMoreMeta } from '../load-more/LoadMore.js';

type OerItem = components['schemas']['OerItemSchema'];

export interface SourcePageState {
  readonly nextPage: number;
  readonly hasMore: boolean;
  readonly serverTotal: number;
}

export interface ProcessedResults {
  readonly sourceArrays: OerItem[][];
  readonly pageStates: Map<string, SourcePageState>;
  readonly aggregateTotal: number;
}

/**
 * Process Promise.allSettled results into source arrays and page tracking state.
 *
 * For initial search, omit `existingPageStates`.
 * For load-more fetches, pass existing states so failed sources preserve their prior state.
 */
export function processSettledResults(
  results: readonly PromiseSettledResult<SearchResult>[],
  sourceIds: readonly string[],
  existingPageStates?: ReadonlyMap<string, SourcePageState>,
): ProcessedResults {
  const sourceArrays: OerItem[][] = [];
  const pageStates = new Map<string, SourcePageState>();
  let aggregateTotal = 0;

  for (let i = 0; i < sourceIds.length; i++) {
    const sourceId = sourceIds[i];
    const result = results[i];

    if (result.status === 'fulfilled') {
      sourceArrays.push([...result.value.data]);
      const meta = result.value.meta;
      aggregateTotal += meta.total;
      pageStates.set(sourceId, {
        nextPage: meta.page + 1,
        hasMore: meta.page < meta.totalPages,
        serverTotal: meta.total,
      });
    } else {
      sourceArrays.push([]);
      const prev = existingPageStates?.get(sourceId);
      pageStates.set(
        sourceId,
        prev ? { ...prev, hasMore: false } : { nextPage: 1, hasMore: false, serverTotal: 0 },
      );
    }
  }

  return { sourceArrays, pageStates, aggregateTotal };
}

export interface InterleaveOverflowResult {
  readonly items: readonly OerItem[];
  readonly overflow: ReadonlyMap<string, readonly OerItem[]>;
}

/**
 * Interleave source arrays with round-robin ordering, capped at `pageSize`.
 * Returns the interleaved items and a per-source overflow buffer of unconsumed items.
 */
export function interleaveWithOverflow(
  sourceArrays: readonly (readonly OerItem[])[],
  sourceIds: readonly string[],
  pageSize: number,
): InterleaveOverflowResult {
  const { items, consumed } = interleave(sourceArrays, pageSize);

  const overflow = new Map<string, readonly OerItem[]>();
  for (let i = 0; i < sourceIds.length; i++) {
    const remaining = sourceArrays[i].slice(consumed[i]);
    if (remaining.length > 0) {
      overflow.set(sourceIds[i], remaining);
    }
  }

  return { items, overflow };
}

export interface LoadMorePreparation {
  readonly sourceBuffers: OerItem[][];
  readonly sourcesToFetch: readonly string[];
}

/**
 * Determine whether the overflow buffer has enough items for a load-more,
 * or whether new pages need to be fetched from sources.
 */
export function prepareLoadMore(
  selectedSources: readonly string[],
  overflowBuffer: ReadonlyMap<string, readonly OerItem[]>,
  pageStates: ReadonlyMap<string, SourcePageState>,
  pageSize: number,
): LoadMorePreparation {
  const sourceBuffers = selectedSources.map((id) => [...(overflowBuffer.get(id) ?? [])]);
  const totalBuffered = sourceBuffers.reduce((sum, arr) => sum + arr.length, 0);

  if (totalBuffered >= pageSize) {
    return { sourceBuffers, sourcesToFetch: [] };
  }

  const sourcesToFetch = selectedSources.filter((id) => {
    const pageState = pageStates.get(id);
    return pageState !== undefined && pageState.hasMore;
  });

  return { sourceBuffers, sourcesToFetch };
}

/**
 * Merge per-source buffer arrays with newly fetched results.
 */
export function mergeBufferAndFetched(
  selectedSources: readonly string[],
  sourceBuffers: readonly (readonly OerItem[])[],
  fetchedMap: ReadonlyMap<string, readonly OerItem[]>,
): OerItem[][] {
  return selectedSources.map((id, i) => {
    const fetched = fetchedMap.get(id) ?? [];
    return [...sourceBuffers[i], ...fetched];
  });
}

/**
 * Compute the load-more metadata from current page states and overflow buffer.
 */
export function computeLoadMoreMeta(
  pageStates: ReadonlyMap<string, SourcePageState>,
  overflow: ReadonlyMap<string, readonly OerItem[]>,
  shown: number,
): LoadMoreMeta {
  const total = Array.from(pageStates.values()).reduce((sum, s) => sum + s.serverTotal, 0);
  const hasBufferedItems = overflow.size > 0;
  const hasMorePages = Array.from(pageStates.values()).some((s) => s.hasMore);

  return {
    total,
    shown,
    hasMore: hasBufferedItems || hasMorePages,
  };
}
