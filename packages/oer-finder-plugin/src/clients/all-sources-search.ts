import type { components } from '@edufeed-org/oer-finder-api-client';
import { MAX_PARALLEL_SOURCES } from '../constants.js';
import type { SearchParams } from '../oer-search/OerSearch.js';
import type { AllSourcesState, PerSourceCursor, SearchResult } from './search-client.interface.js';

type OerItem = components['schemas']['OerItemSchema'];

/** A function that searches a single source given params. */
export type SingleSourceSearchFn = (params: SearchParams) => Promise<SearchResult>;

export interface AllSourcesSearchConfig {
  /** IDs of all real sources to query */
  readonly sourceIds: readonly string[];
  /** Function to search a single source (receives per-source page/pageSize/source) */
  readonly searchFn: SingleSourceSearchFn;
  /** Timeout per source in milliseconds */
  readonly timeoutMs: number;
  /** Total desired result count for this page */
  readonly totalPageSize: number;
  /** Previous cursor state for "Load More" (undefined on first search) */
  readonly previousState?: AllSourcesState;
}

export interface AllSourcesSearchResult extends SearchResult {
  allSourcesState: AllSourcesState;
}

/**
 * Search all sources in parallel with per-source timeouts.
 * Requests the full page size from each source for gap-filling,
 * interleaves results, and tracks per-source page+skip cursors so no items are lost.
 *
 * Timed-out or errored sources are marked exhausted and skipped on subsequent loads.
 */
export async function searchAllSources(
  config: AllSourcesSearchConfig,
): Promise<AllSourcesSearchResult> {
  const { sourceIds, searchFn, timeoutMs, totalPageSize, previousState } = config;

  const cursorMap = buildCursorMap(previousState);
  const activeSources = getActiveSources(sourceIds, cursorMap).slice(0, MAX_PARALLEL_SOURCES);

  if (activeSources.length === 0) {
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: totalPageSize, totalPages: 0 },
      allSourcesState: previousState ?? { cursors: [] },
    };
  }

  // Request the full page size from each source so that if some sources return
  // fewer results (timeout, errors, less data), the others can fill the gap.
  const perSourcePageSize = totalPageSize;
  const settled = await executeParallelSearches(
    activeSources,
    cursorMap,
    perSourcePageSize,
    searchFn,
    timeoutMs,
  );

  const sourceResults = collectFulfilledResults(activeSources, settled);

  // Trim already-shown items from the front of each source's results.
  // When a page was only partially consumed in the previous round, nextSkip
  // tells us how many items at the start of this page were already shown.
  const usablePerSource = sourceResults.map((sr) => {
    const cursor = cursorMap.get(sr.sourceId);
    const skipCount = cursor?.nextSkip ?? 0;
    return sr.result.data.slice(skipCount);
  });

  const mergedData = interleaveResults(usablePerSource);
  const output = mergedData.slice(0, totalPageSize);

  // Track how many items from each source made it into the final output
  const consumed = computeConsumedPerSource(
    usablePerSource.map((items) => items.length),
    totalPageSize,
  );

  const consumedMap = new Map<string, number>();
  sourceResults.forEach((sr, i) => {
    consumedMap.set(sr.sourceId, consumed[i]);
  });

  const newCursors = buildNewCursors(
    sourceIds,
    activeSources,
    sourceResults,
    consumedMap,
    cursorMap,
  );
  const meta = computeSyntheticMeta(sourceResults, totalPageSize);

  return {
    data: output,
    meta,
    allSourcesState: { cursors: newCursors },
  };
}

function buildCursorMap(
  previousState: AllSourcesState | undefined,
): ReadonlyMap<string, PerSourceCursor> {
  const map = new Map<string, PerSourceCursor>();
  if (previousState) {
    for (const cursor of previousState.cursors) {
      if (
        typeof cursor.sourceId === 'string' &&
        typeof cursor.nextPage === 'number' &&
        Number.isInteger(cursor.nextPage) &&
        cursor.nextPage >= 1 &&
        typeof cursor.nextSkip === 'number' &&
        Number.isInteger(cursor.nextSkip) &&
        cursor.nextSkip >= 0 &&
        typeof cursor.hasMore === 'boolean'
      ) {
        map.set(cursor.sourceId, cursor);
      }
    }
  }
  return map;
}

function getActiveSources(
  sourceIds: readonly string[],
  cursorMap: ReadonlyMap<string, PerSourceCursor>,
): string[] {
  return sourceIds.filter((id) => {
    const cursor = cursorMap.get(id);
    return cursor === undefined || cursor.hasMore;
  });
}

async function executeParallelSearches(
  activeSources: readonly string[],
  cursorMap: ReadonlyMap<string, PerSourceCursor>,
  perSourcePageSize: number,
  searchFn: SingleSourceSearchFn,
  timeoutMs: number,
): Promise<PromiseSettledResult<SearchResult>[]> {
  const promises = activeSources.map((sourceId) => {
    const cursor = cursorMap.get(sourceId);
    const page = cursor?.nextPage ?? 1;

    const params: SearchParams = {
      source: sourceId,
      page,
      pageSize: perSourcePageSize,
    };

    return withTimeout(searchFn(params), timeoutMs);
  });

  return Promise.allSettled(promises);
}

interface SourceSearchResult {
  readonly sourceId: string;
  readonly result: SearchResult;
}

function collectFulfilledResults(
  activeSources: readonly string[],
  settled: readonly PromiseSettledResult<SearchResult>[],
): SourceSearchResult[] {
  const results: SourceSearchResult[] = [];
  for (let i = 0; i < activeSources.length; i++) {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      results.push({ sourceId: activeSources[i], result: outcome.value });
    }
  }
  return results;
}

/**
 * Simulate round-robin interleaving to count how many items from each source
 * are included in the first `limit` items of the interleaved output.
 */
function computeConsumedPerSource(itemCounts: readonly number[], limit: number): number[] {
  const consumed = new Array<number>(itemCounts.length).fill(0);
  let total = 0;
  const maxLen = itemCounts.reduce((max, c) => Math.max(max, c), 0);

  for (let i = 0; i < maxLen && total < limit; i++) {
    for (let s = 0; s < itemCounts.length && total < limit; s++) {
      if (i < itemCounts[s]) {
        consumed[s]++;
        total++;
      }
    }
  }

  return consumed;
}

function buildNewCursors(
  sourceIds: readonly string[],
  activeSources: readonly string[],
  sourceResults: readonly SourceSearchResult[],
  consumedMap: ReadonlyMap<string, number>,
  cursorMap: ReadonlyMap<string, PerSourceCursor>,
): PerSourceCursor[] {
  const resultMap = new Map(sourceResults.map((sr) => [sr.sourceId, sr]));
  const activeSet = new Set(activeSources);

  return sourceIds.map((id) => {
    const sr = resultMap.get(id);
    const oldCursor = cursorMap.get(id);

    if (!sr) {
      if (activeSet.has(id)) {
        // Source was actively queried but failed/timed out: mark exhausted
        // so it is not retried on subsequent "Load More" calls.
        return {
          sourceId: id,
          nextPage: oldCursor?.nextPage ?? 1,
          nextSkip: oldCursor?.nextSkip ?? 0,
          hasMore: false,
        };
      }
      // Source was not queried (already exhausted from previous state)
      return oldCursor ?? { sourceId: id, nextPage: 1, nextSkip: 0, hasMore: true };
    }

    const currentPage = oldCursor?.nextPage ?? 1;
    const currentSkip = oldCursor?.nextSkip ?? 0;
    const consumed = consumedMap.get(id) ?? 0;

    // Determine if the current page's results were fully consumed
    const totalUsedFromPage = currentSkip + consumed;
    const pageFullyConsumed = totalUsedFromPage >= sr.result.data.length;

    const nextPage = pageFullyConsumed ? currentPage + 1 : currentPage;
    const nextSkip = pageFullyConsumed ? 0 : totalUsedFromPage;
    const hasMore = pageFullyConsumed ? nextPage <= sr.result.meta.totalPages : true;

    return {
      sourceId: id,
      nextPage,
      nextSkip,
      hasMore,
    };
  });
}

function computeSyntheticMeta(
  sourceResults: readonly SourceSearchResult[],
  totalPageSize: number,
): SearchResult['meta'] {
  const totalAcrossSources = sourceResults.reduce((sum, sr) => sum + sr.result.meta.total, 0);
  const totalPages = Math.ceil(totalAcrossSources / totalPageSize);

  return {
    total: totalAcrossSources,
    page: 1,
    pageSize: totalPageSize,
    totalPages,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Interleave arrays round-robin for visual variety.
 * E.g., [[A1,A2],[B1,B2]] → [A1,B1,A2,B2]
 */
function interleaveResults(arrays: OerItem[][]): OerItem[] {
  const result: OerItem[] = [];
  const maxLen = arrays.reduce((max, a) => Math.max(max, a.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}
