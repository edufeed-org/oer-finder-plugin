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

  // Work with a mutable copy of the sources map
  const sources = new Map(previousState.sources);

  // Ensure all configured sources exist in state
  for (const id of sourceIds) {
    if (!sources.has(id)) {
      sources.set(id, createSourceState(id));
    }
  }

  // 1. Count total buffered items across all active sources
  const activeSourceIds = sourceIds.filter((id) => {
    const state = sources.get(id);
    return state !== undefined && isSourceAvailable(state);
  });

  if (activeSourceIds.length === 0) {
    return buildEmptyResult(previousState);
  }

  const totalBuffered = activeSourceIds.reduce((sum, id) => {
    const state = sources.get(id)!;
    return sum + state.buffer.length;
  }, 0);

  // 2. Determine which sources need fetching
  const sourcesToFetch = activeSourceIds.filter((id) => {
    const state = sources.get(id)!;
    // Always fetch for empty buffers
    if (state.buffer.length === 0 && canFetchMore(state)) return true;
    // Also fetch when total buffered is low
    if (totalBuffered < pageSize && canFetchMore(state)) return true;
    return false;
  });

  // 3. Fetch in parallel with per-source timeouts
  if (sourcesToFetch.length > 0) {
    const fetchResults = await fetchAllWithTimeouts(
      sourcesToFetch,
      sources,
      fetchPage,
      pageSize,
      timeoutMs,
    );

    // 4. Apply results
    for (const { sourceId, result, error } of fetchResults) {
      const currentState = sources.get(sourceId)!;
      if (error) {
        sources.set(sourceId, applyFetchFailure(currentState));
      } else {
        sources.set(sourceId, applyFetchSuccess(currentState, result!));
      }
    }
  }

  // Re-evaluate active sources after fetches (some may have failed)
  const availableSourceIds = sourceIds.filter((id) => {
    const state = sources.get(id);
    return state !== undefined && isSourceAvailable(state);
  });

  if (availableSourceIds.length === 0) {
    return buildEmptyResult({
      ...previousState,
      sources,
    });
  }

  // 5. Take items from each source's buffer
  const perSourceItems: SourcePaginationState['buffer'][] = [];
  const sourceOrder: string[] = [];

  for (const id of availableSourceIds) {
    const state = sources.get(id)!;
    const { items, nextState } = takeItems(state, pageSize);
    sources.set(id, nextState);
    perSourceItems.push(items);
    sourceOrder.push(id);
  }

  // 6. Interleave round-robin, trim to pageSize
  const { items: interleaved, consumed } = interleave(perSourceItems, pageSize);

  // 7. Return unconsumed items back to each source's buffer
  for (let i = 0; i < sourceOrder.length; i++) {
    const id = sourceOrder[i];
    const state = sources.get(id)!;
    const itemsFromThisSource = perSourceItems[i];
    const usedCount = consumed[i];
    const unconsumed = itemsFromThisSource.slice(usedCount);

    if (unconsumed.length > 0) {
      // Prepend unconsumed items back to the buffer
      sources.set(id, {
        ...state,
        buffer: [...unconsumed, ...state.buffer],
      });
    }
  }

  // 8. Compute PaginationMeta
  const aggregateTotal = sourceIds.reduce((sum, id) => {
    const state = sources.get(id);
    return sum + (state?.serverTotal ?? 0);
  }, 0);

  const totalShown = previousState.totalShown + interleaved.length;

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

interface FetchResultEntry {
  readonly sourceId: string;
  readonly result?: FetchPageResult;
  readonly error?: boolean;
}

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
