import type { SourcePaginationState, TakeResult, FetchPageResult } from './types.js';

/** Create the initial pagination state for a source. */
export function createSourceState(sourceId: string): SourcePaginationState {
  return {
    sourceId,
    nextPage: 1,
    buffer: [],
    hasMorePages: true,
    active: true,
    serverTotal: 0,
  };
}

/** Whether a source can provide more items (buffer or server). */
export function isSourceAvailable(state: SourcePaginationState): boolean {
  return state.active && (state.buffer.length > 0 || state.hasMorePages);
}

/** Whether a source's buffer is empty and it has more pages on the server. */
export function isBufferEmpty(state: SourcePaginationState): boolean {
  return state.buffer.length === 0 && state.hasMorePages;
}

/** Whether a source has more pages on the server (regardless of buffer). */
export function canFetchMore(state: SourcePaginationState): boolean {
  return state.active && state.hasMorePages;
}

/** Take up to N items from the source's buffer. Returns items + updated state. */
export function takeItems(state: SourcePaginationState, count: number): TakeResult {
  const taken = state.buffer.slice(0, count);
  const remaining = state.buffer.slice(count);
  return {
    items: taken,
    nextState: {
      ...state,
      buffer: remaining,
    },
  };
}

/** Apply a successful fetch result. Appends items to buffer, advances page. */
export function applyFetchSuccess(
  state: SourcePaginationState,
  result: FetchPageResult,
): SourcePaginationState {
  const hasMorePages = result.page < result.totalPages;
  return {
    ...state,
    nextPage: result.page + 1,
    buffer: [...state.buffer, ...result.items],
    hasMorePages,
    serverTotal: result.total,
  };
}

/** Apply a fetch failure. Permanently marks the source as inactive for this session. */
export function applyFetchFailure(state: SourcePaginationState): SourcePaginationState {
  return {
    ...state,
    active: false,
    hasMorePages: false,
  };
}

/** Mark a source as exhausted (no more items available). */
export function markExhausted(state: SourcePaginationState): SourcePaginationState {
  return {
    ...state,
    hasMorePages: false,
  };
}

/** Reset a source to its initial state. */
export function resetSource(sourceId: string): SourcePaginationState {
  return createSourceState(sourceId);
}
