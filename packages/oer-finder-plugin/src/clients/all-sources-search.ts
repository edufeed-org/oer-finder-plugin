import type { components } from '@edufeed-org/oer-finder-api-client';
import { MAX_PARALLEL_SOURCES, MAX_PAGE_SIZE, MAX_PAGE_NUMBER } from '../constants.js';
import type { AllSourcesState, PerSourceCursor, SearchResult } from './search-client.interface.js';

type OerItem = components['schemas']['OerItemSchema'];

/** Required params for a per-source search call. All fields are guaranteed present. */
export interface PerSourceSearchParams {
  readonly source: string;
  readonly page: number;
  readonly pageSize: number;
}

/** A function that searches a single source given params. */
export type SingleSourceSearchFn = (
  params: PerSourceSearchParams,
  signal?: AbortSignal,
) => Promise<SearchResult>;

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
  const { sourceIds, searchFn, timeoutMs, previousState } = config;
  const totalPageSize = Math.min(Math.max(config.totalPageSize, 0), MAX_PAGE_SIZE);

  if (totalPageSize <= 0) {
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 0, totalPages: 0 },
      allSourcesState: previousState ?? { cursors: [] },
    };
  }

  const cursorMap = buildCursorMap(previousState);
  // Limit to MAX_PARALLEL_SOURCES to bound concurrent requests.
  // Sources beyond this limit are silently dropped (no rotation).
  // This is acceptable as >10 sources is not a realistic deployment scenario.
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
  const settled = await executeParallelSearches(
    activeSources,
    cursorMap,
    totalPageSize,
    searchFn,
    timeoutMs,
  );

  const sourceResults = collectFulfilledResults(activeSources, settled);

  // Trim already-shown items from the front of each source's results.
  // When a page was only partially consumed in the previous round, nextSkip
  // tells us how many items at the start of this page were already shown.
  // NOTE: This intentionally re-fetches the same page and discards the first
  // `skipCount` items client-side. This is a simplicity trade-off: caching
  // unconsumed items would save bandwidth but adds significant complexity.
  const usablePerSource = sourceResults.map((sr) => {
    const cursor = cursorMap.get(sr.sourceId);
    const skipCount = cursor?.nextSkip ?? 0;
    return sr.result.data.slice(skipCount);
  });

  // Interleave results round-robin and track per-source consumption in a single pass.
  const { items: output, consumed } = interleaveWithConsumption(usablePerSource, totalPageSize);

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
        cursor.nextPage <= MAX_PAGE_NUMBER &&
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

    const params: PerSourceSearchParams = {
      source: sourceId,
      page,
      pageSize: perSourcePageSize,
    };

    return withTimeout(searchFn, params, timeoutMs);
  });

  return Promise.allSettled(promises);
}

interface ResolvedSourceResult {
  readonly sourceId: string;
  readonly result: SearchResult;
}

function collectFulfilledResults(
  activeSources: readonly string[],
  settled: readonly PromiseSettledResult<SearchResult>[],
): ResolvedSourceResult[] {
  const results: ResolvedSourceResult[] = [];
  for (let i = 0; i < activeSources.length; i++) {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      results.push({ sourceId: activeSources[i], result: outcome.value });
    }
  }
  return results;
}

interface InterleaveResult {
  readonly items: OerItem[];
  readonly consumed: number[];
}

/**
 * Interleave arrays round-robin and track how many items from each source
 * made it into the output, all in a single pass. This replaces the former
 * separate `interleaveResults` + `computeConsumedPerSource` functions,
 * ensuring the interleave logic and consumption counts always stay in sync.
 *
 * E.g., [[A1,A2],[B1,B2]] with limit 4 → { items: [A1,B1,A2,B2], consumed: [2,2] }
 */
function interleaveWithConsumption(
  arrays: readonly (readonly OerItem[])[],
  limit: number,
): InterleaveResult {
  const items: OerItem[] = [];
  const consumed = new Array<number>(arrays.length).fill(0);
  const maxLen = arrays.reduce((max, a) => Math.max(max, a.length), 0);

  for (let i = 0; i < maxLen && items.length < limit; i++) {
    for (let s = 0; s < arrays.length && items.length < limit; s++) {
      if (i < arrays[s].length) {
        items.push(arrays[s][i]);
        consumed[s]++;
      }
    }
  }

  return { items, consumed };
}

function buildNewCursors(
  sourceIds: readonly string[],
  activeSources: readonly string[],
  sourceResults: readonly ResolvedSourceResult[],
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
        // NOTE: This permanently removes the source for this search session.
        // A transient network blip will exclude the source until the user
        // starts a new search. A retry strategy could be added here if needed.
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
  sourceResults: readonly ResolvedSourceResult[],
  totalPageSize: number,
): SearchResult['meta'] {
  const totalAcrossSources = sourceResults.reduce((sum, sr) => sum + sr.result.meta.total, 0);
  const totalPages = Math.ceil(totalAcrossSources / totalPageSize);

  return {
    total: totalAcrossSources,
    // page is always 1 in all-sources mode because the concept of a single
    // page number doesn't map cleanly when each source has its own cursor.
    // The UI uses allSourcesState cursors for "Load More" rather than page.
    page: 1,
    pageSize: totalPageSize,
    totalPages,
  };
}

/**
 * Run a search with a timeout. Uses AbortController to cancel the underlying
 * request when the timeout fires, instead of leaving it running as a zombie.
 */
function withTimeout(
  searchFn: SingleSourceSearchFn,
  params: PerSourceSearchParams,
  ms: number,
): Promise<SearchResult> {
  const controller = new AbortController();

  return new Promise<SearchResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Timeout'));
    }, ms);

    searchFn(params, controller.signal).then(
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
