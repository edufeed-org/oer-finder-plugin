import type {
  MultiSourceConfig,
  MultiSourcePaginationState,
  MultiSourcePageResult,
  SourcePaginationState,
  FetchPageResult,
} from './types.js';
import {
  createSourceState,
  isSourceAvailable,
  canFetchMore,
  takeItems,
  applyFetchSuccess,
  applyFetchFailure,
} from './source-paginator.js';
import { interleave } from './interleave.js';

/** Create initial multi-source pagination state. */
export function createMultiSourceState(sourceIds: readonly string[]): MultiSourcePaginationState {
  const sources = new Map<string, SourcePaginationState>();
  for (const id of sourceIds) {
    sources.set(id, createSourceState(id));
  }
  return {
    sources,
    totalShown: 0,
    aggregateTotal: 0,
  };
}

/**
 * Load the next page of results from all active sources.
 * Main entry point for "all sources" pagination.
 */
export async function loadNextPage(
  config: MultiSourceConfig,
  previousState: MultiSourcePaginationState,
): Promise<MultiSourcePageResult> {
  const { sourceIds, fetchPage, pageSize, timeoutMs } = config;
  const sources = new Map(previousState.sources);

  ensureAllSourcesExist(sourceIds, sources);

  const availableBefore = getAvailableSourceIds(sourceIds, sources);
  if (availableBefore.length === 0) {
    return buildEmptyResult(previousState);
  }

  await fetchIfNeeded(availableBefore, sources, fetchPage, pageSize, timeoutMs);

  const availableAfter = getAvailableSourceIds(sourceIds, sources);
  if (availableAfter.length === 0) {
    return buildEmptyResult({ ...previousState, sources });
  }

  const { perSourceItems, sourceOrder } = takeItemsFromSources(availableAfter, sources, pageSize);
  const { items: interleaved, consumed } = interleave(perSourceItems, pageSize);
  returnUnconsumedToBuffers(sourceOrder, perSourceItems, consumed, sources);

  return buildPageResult(sourceIds, sources, previousState.totalShown, interleaved);
}

/** Ensure all configured source IDs have a state entry in the map. Mutates the working copy. */
function ensureAllSourcesExist(
  sourceIds: readonly string[],
  sources: Map<string, SourcePaginationState>,
): void {
  for (const id of sourceIds) {
    if (!sources.has(id)) {
      sources.set(id, createSourceState(id));
    }
  }
}

/** Get IDs of sources that are still available (active with buffer or more pages). */
function getAvailableSourceIds(
  sourceIds: readonly string[],
  sources: ReadonlyMap<string, SourcePaginationState>,
): string[] {
  return sourceIds.filter((id) => {
    const state = sources.get(id);
    return state !== undefined && isSourceAvailable(state);
  });
}

/** Compute total buffered items across the given sources. */
function getTotalBuffered(
  sourceIds: readonly string[],
  sources: ReadonlyMap<string, SourcePaginationState>,
): number {
  return sourceIds.reduce((sum, id) => {
    const state = sources.get(id)!;
    return sum + state.buffer.length;
  }, 0);
}

/** Determine which active sources need a new fetch from the server. */
function findSourcesNeedingFetch(
  activeSourceIds: readonly string[],
  sources: ReadonlyMap<string, SourcePaginationState>,
  pageSize: number,
): string[] {
  const totalBuffered = getTotalBuffered(activeSourceIds, sources);
  return activeSourceIds.filter((id) => {
    const state = sources.get(id)!;
    if (state.buffer.length === 0 && canFetchMore(state)) return true;
    if (totalBuffered < pageSize && canFetchMore(state)) return true;
    return false;
  });
}

/** Fetch from sources that need it and apply results. Mutates the working copy. */
async function fetchIfNeeded(
  activeSourceIds: readonly string[],
  sources: Map<string, SourcePaginationState>,
  fetchPage: MultiSourceConfig['fetchPage'],
  pageSize: number,
  timeoutMs: number,
): Promise<void> {
  const sourcesToFetch = findSourcesNeedingFetch(activeSourceIds, sources, pageSize);
  if (sourcesToFetch.length === 0) return;

  const fetchResults = await fetchAllWithTimeouts(
    sourcesToFetch,
    sources,
    fetchPage,
    pageSize,
    timeoutMs,
  );

  for (const entry of fetchResults) {
    const currentState = sources.get(entry.sourceId)!;
    if (entry.error) {
      sources.set(entry.sourceId, applyFetchFailure(currentState));
    } else {
      sources.set(entry.sourceId, applyFetchSuccess(currentState, entry.result));
    }
  }
}

interface SourceItemsResult {
  readonly perSourceItems: readonly SourcePaginationState['buffer'][];
  readonly sourceOrder: readonly string[];
}

/** Take items from each active source's buffer for interleaving. Mutates the working copy. */
function takeItemsFromSources(
  availableSourceIds: readonly string[],
  sources: Map<string, SourcePaginationState>,
  pageSize: number,
): SourceItemsResult {
  const perSourceItems: SourcePaginationState['buffer'][] = [];
  const sourceOrder: string[] = [];

  for (const id of availableSourceIds) {
    const state = sources.get(id)!;
    const { items, nextState } = takeItems(state, pageSize);
    sources.set(id, nextState);
    perSourceItems.push(items);
    sourceOrder.push(id);
  }

  return { perSourceItems, sourceOrder };
}

/** Return unconsumed items back to each source's buffer after interleaving. Mutates the working copy. */
function returnUnconsumedToBuffers(
  sourceOrder: readonly string[],
  perSourceItems: readonly SourcePaginationState['buffer'][],
  consumed: readonly number[],
  sources: Map<string, SourcePaginationState>,
): void {
  for (let i = 0; i < sourceOrder.length; i++) {
    const id = sourceOrder[i];
    const state = sources.get(id)!;
    const unconsumed = perSourceItems[i].slice(consumed[i]);

    if (unconsumed.length > 0) {
      sources.set(id, {
        ...state,
        buffer: [...unconsumed, ...state.buffer],
      });
    }
  }
}

/** Build the final page result with computed pagination metadata. */
function buildPageResult(
  sourceIds: readonly string[],
  sources: ReadonlyMap<string, SourcePaginationState>,
  previousTotalShown: number,
  interleaved: readonly SourcePaginationState['buffer'][number][],
): MultiSourcePageResult {
  const aggregateTotal = sourceIds.reduce((sum, id) => {
    const state = sources.get(id);
    return sum + (state?.serverTotal ?? 0);
  }, 0);

  const totalShown = previousTotalShown + interleaved.length;

  const hasMore = sourceIds.some((id) => {
    const state = sources.get(id);
    return state !== undefined && isSourceAvailable(state);
  });

  return {
    items: interleaved,
    nextState: {
      sources,
      totalShown,
      aggregateTotal,
    },
    meta: {
      total: aggregateTotal,
      shown: totalShown,
      hasMore,
    },
  };
}

type FetchResultEntry =
  | { readonly sourceId: string; readonly result: FetchPageResult; readonly error?: never }
  | { readonly sourceId: string; readonly error: true; readonly result?: never };

async function fetchAllWithTimeouts(
  sourcesToFetch: readonly string[],
  sources: ReadonlyMap<string, SourcePaginationState>,
  fetchPage: MultiSourceConfig['fetchPage'],
  pageSize: number,
  timeoutMs: number,
): Promise<FetchResultEntry[]> {
  const promises = sourcesToFetch.map(async (sourceId): Promise<FetchResultEntry> => {
    const state = sources.get(sourceId)!;
    const controller = new AbortController();

    try {
      const result = await withTimeout(
        () => fetchPage(sourceId, state.nextPage, pageSize, controller.signal),
        timeoutMs,
        controller,
      );
      return { sourceId, result };
    } catch {
      return { sourceId, error: true };
    }
  });

  return Promise.all(promises);
}

function withTimeout<T>(fn: () => Promise<T>, ms: number, controller: AbortController): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Timeout'));
    }, ms);

    fn().then(
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

function buildEmptyResult(state: MultiSourcePaginationState): MultiSourcePageResult {
  const aggregateTotal = Array.from(state.sources.values()).reduce(
    (sum, s) => sum + s.serverTotal,
    0,
  );

  return {
    items: [],
    nextState: {
      ...state,
      aggregateTotal,
    },
    meta: {
      total: aggregateTotal,
      shown: state.totalShown,
      hasMore: false,
    },
  };
}
