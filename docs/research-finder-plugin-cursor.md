# Revised Architecture: OER Finder Plugin Cursor/Search System

## 1. Problem Statement

### What exists today

The current cursor/search system has a centralized orchestration layer (`searchAllSources` in `packages/oer-finder-plugin/src/clients/all-sources-search.ts`) that manages pagination state for all sources simultaneously. While functional and well-tested, it has several architectural problems:

**P1: Centralized cursor logic violates separation of concerns.**
The `searchAllSources` function owns cursor creation, validation, advancement, skip tracking, and exhaustion marking for every source. Each source does not manage its own pagination -- the orchestrator does it on their behalf through a complex multi-step pipeline: `buildCursorMap` -> `getActiveSources` -> `executeParallelSearches` -> `collectFulfilledResults` -> trim skipped items -> `interleaveWithConsumption` -> `buildNewCursors`. This is a single 329-line file with 9 private functions that are deeply coupled to each other through shared intermediate data structures.

**P2: Re-fetching wasted data.**
When `nextSkip > 0`, the system re-fetches an entire page from the server and discards the first N items client-side. This means the system regularly throws away half or more of fetched data, costing bandwidth and latency for every Load More click when sources are not perfectly aligned.

**P3: The `page` field in synthetic meta is always `1`.**
The `LoadMoreElement` uses `this.metadata.page < this.metadata.totalPages` to determine if more results exist. But `computeSyntheticMeta` always sets `page: 1`. The UI component cannot reason about pagination independently.

**P4: The `allSourcesState` leaks into `SearchParams`.**
The `SearchParams` interface has an `allSourcesState` field that is only relevant for the "all sources" mode. This creates a bifurcated interface where some fields matter only in certain modes, and `ApiClient.singleSourceSearch` must explicitly strip it.

**P5: `buildNewCursors` couples cursor computation to result shape.**
The cursor advancement logic takes 5 parameters and uses set lookups, map lookups, and conditional branches to handle 4 distinct cases. Hard to test in isolation because it depends on the exact shape of the entire pipeline's intermediate state.

**P7: Tight coupling between OerSearch component and all-sources state.**
The `OerSearchElement` has dedicated state management for `allSourcesState` in 4+ places. The component must know whether it is in "all sources" mode to determine if `allSourcesState` absence means "first page" vs the normal `page === 1` check.

### What should change

1. Make each source responsible for its own pagination state (cursor ownership)
2. Cache unconsumed items per source to eliminate re-fetching
3. Provide a clean, unified pagination interface that LoadMore can use regardless of mode
4. Remove `allSourcesState` from `SearchParams` -- cursors should not flow through the search API
5. Make all cursor logic pure, functional, and independently testable

---

## 2. Proposed Architecture

### 2.1 Core Design Principle: Source-Owned Cursors with Local Buffers

Instead of a centralized orchestrator that computes cursors for all sources, each source gets a `SourcePaginationState` -- managed through pure functions that:
- Hold a **buffer** of unconsumed items (no re-fetching)
- Know their own **page position**
- Decide whether they **have more** items
- Can **take N items** and return the updated state

The "all sources" composition layer simply asks each source for items and merges them. It does not compute cursors -- it delegates to each source.

### 2.2 File Structure

```
packages/oer-finder-plugin/src/
  pagination/
    types.ts                       # All pagination type definitions
    source-paginator.ts            # Pure functions for single-source pagination
    source-paginator.test.ts
    multi-source-paginator.ts      # Composition of multiple source paginators
    multi-source-paginator.test.ts
    interleave.ts                  # Round-robin interleaving utility
    interleave.test.ts
  clients/
    search-client.interface.ts     # Simplified: no AllSourcesState
    api-client.ts                  # Simplified: no cursor orchestration
    direct-client.ts               # Simplified: no cursor orchestration
    client-factory.ts              # Unchanged
    index.ts
  oer-search/
    OerSearch.ts                   # Simplified: uses PaginationController
    pagination-controller.ts       # Manages pagination state for OerSearch
    pagination-controller.test.ts
  load-more/
    LoadMore.ts                    # Unchanged (already clean)
```

---

## 3. Type Definitions

File: `packages/oer-finder-plugin/src/pagination/types.ts`

```typescript
import type { components } from '@edufeed-org/oer-finder-api-client';

type OerItem = components['schemas']['OerItemSchema'];

/**
 * The state of a single source's pagination.
 * Immutable -- all operations return a new SourcePaginationState.
 * Each source owns and manages its own instance.
 */
export interface SourcePaginationState {
  readonly sourceId: string;
  /** The next page number to fetch from this source (1-indexed) */
  readonly nextPage: number;
  /** Items fetched but not yet consumed (the local buffer) */
  readonly buffer: readonly OerItem[];
  /** Whether this source has more pages available on the server */
  readonly hasMorePages: boolean;
  /** Whether this source is still available (false after error/timeout/exhaustion) */
  readonly active: boolean;
  /** Total items available from this source (from last server response) */
  readonly serverTotal: number;
}

/**
 * Result of taking items from a source's buffer.
 */
export interface TakeResult {
  readonly items: readonly OerItem[];
  readonly nextState: SourcePaginationState;
}

/**
 * Result of fetching a page from a source.
 */
export interface FetchPageResult {
  readonly items: readonly OerItem[];
  readonly total: number;
  readonly totalPages: number;
  readonly page: number;
}

/**
 * A function that fetches a page from a single source.
 * This is the only dependency the pagination system has on the outside world.
 */
export type FetchPageFn = (
  sourceId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
) => Promise<FetchPageResult>;

/**
 * Configuration for multi-source pagination.
 */
export interface MultiSourceConfig {
  readonly sourceIds: readonly string[];
  readonly fetchPage: FetchPageFn;
  readonly pageSize: number;
  readonly timeoutMs: number;
}

/**
 * The complete pagination state across all sources.
 * Stored by the UI component; passed to multi-source operations.
 */
export interface MultiSourcePaginationState {
  readonly sources: ReadonlyMap<string, SourcePaginationState>;
  /** Total items shown so far */
  readonly totalShown: number;
  /** Aggregated total across all sources */
  readonly aggregateTotal: number;
}

/**
 * Result of a multi-source "load page" operation.
 */
export interface MultiSourcePageResult {
  readonly items: readonly OerItem[];
  readonly nextState: MultiSourcePaginationState;
  readonly meta: PaginationMeta;
}

/**
 * Clean pagination metadata that LoadMore can use directly.
 * No more synthetic page=1 hack.
 */
export interface PaginationMeta {
  /** Total items available across all sources */
  readonly total: number;
  /** Total items shown so far (accumulated) */
  readonly shown: number;
  /** Whether more items are available from any source */
  readonly hasMore: boolean;
}
```

---

## 4. Source Paginator (Pure Functions)

File: `packages/oer-finder-plugin/src/pagination/source-paginator.ts`

Each function takes a single `SourcePaginationState` and returns a new one. No function needs to know about other sources.

```typescript
/** Create the initial pagination state for a source. */
export function createSourceState(sourceId: string): SourcePaginationState;

/** Whether a source can provide more items (buffer or server). */
export function isSourceAvailable(state: SourcePaginationState): boolean;

/** Whether a source's buffer is empty and it has more pages on the server. */
export function isBufferEmpty(state: SourcePaginationState): boolean;

/** Whether a source has more pages on the server (regardless of buffer). */
export function canFetchMore(state: SourcePaginationState): boolean;

/** Take up to N items from the source's buffer. Returns items + updated state. */
export function takeItems(state: SourcePaginationState, count: number): TakeResult;

/** Apply a successful fetch result. Appends items to buffer, advances page. */
export function applyFetchSuccess(
  state: SourcePaginationState,
  result: FetchPageResult,
): SourcePaginationState;

/** Apply a fetch failure. Permanently marks the source as inactive for this session. */
export function applyFetchFailure(state: SourcePaginationState): SourcePaginationState;

/** Mark a source as exhausted (no more items available). */
export function markExhausted(state: SourcePaginationState): SourcePaginationState;

/** Reset a source to its initial state. */
export function resetSource(sourceId: string): SourcePaginationState;
```

---

## 5. Interleave Utility

File: `packages/oer-finder-plugin/src/pagination/interleave.ts`

A generic, reusable round-robin interleaving function:

```typescript
/**
 * Interleave items from multiple sources in round-robin order,
 * taking up to `limit` total items.
 *
 * Returns the interleaved items and the count consumed from each source.
 * Pure function. Does not mutate inputs.
 *
 * Example: interleave([[A1,A2,A3], [B1,B2]], 4) =>
 *   { items: [A1, B1, A2, B2], consumed: [2, 2] }
 */
export function interleave<T>(
  arrays: readonly (readonly T[])[],
  limit: number,
): InterleaveResult<T>;

export interface InterleaveResult<T> {
  readonly items: readonly T[];
  readonly consumed: readonly number[];
}
```

---

## 6. Multi-Source Paginator

File: `packages/oer-finder-plugin/src/pagination/multi-source-paginator.ts`

The composition layer. Its responsibilities are strictly limited:

1. Identify which sources need data -- sources with empty buffers always fetch; sources with low buffers fetch when total buffered items < pageSize
2. Fetch in parallel (applying `applyFetchSuccess` on success, `applyFetchFailure` on error/timeout to permanently exclude the source)
3. Take items from buffers (by calling `takeItems()`)
4. Interleave (by calling the generic `interleave()` utility)
5. Return unconsumed items to each source's buffer
6. Compute metadata (`total`, `shown`, `hasMore`)

It does NOT:
- Compute cursors (each source owns its state)
- Know about page numbers or skip offsets (inside `SourcePaginationState`)
- Know about the server API format (that's the `FetchPageFn`)

```typescript
/** Create initial multi-source pagination state. */
export function createMultiSourceState(
  sourceIds: readonly string[],
): MultiSourcePaginationState;

/**
 * Load the next page of results from all active sources.
 * Main entry point for "all sources" pagination.
 */
export async function loadNextPage(
  config: MultiSourceConfig,
  previousState: MultiSourcePaginationState,
): Promise<MultiSourcePageResult>;
```

### Algorithm Flow

```
loadNextPage(config, state)
  |
  |-- 1. Count total buffered items across all active sources
  |-- 2. Determine which sources need fetching:
  |       - Always fetch for sources with empty buffers (isBufferEmpty)
  |       - Also fetch for sources that canFetchMore when
  |         totalBuffered < pageSize (to avoid short pages)
  |-- 3. Fetch in parallel with per-source timeouts
  |-- 4. Apply results: applyFetchSuccess per source, or applyFetchFailure to exclude
  |-- 5. Take items from each source's buffer: takeItems(state, pageSize)
  |-- 6. Interleave round-robin, trim to pageSize
  |-- 7. Return unconsumed items back to each source's buffer
  |-- 8. Compute PaginationMeta { total, shown, hasMore }
  |
  v
  MultiSourcePageResult { items, nextState, meta }
```

**Why two fetch conditions?** If each source has 2 items buffered (6 total) but `pageSize` is 20,
we must fetch more data to fill the page. Only fetching on empty buffers would produce short pages
even though more server data exists. The `totalBuffered < pageSize` check ensures we proactively
refill buffers before they run dry.

---

## 7. Pagination Controller

File: `packages/oer-finder-plugin/src/oer-search/pagination-controller.ts`

A thin stateful wrapper that bridges the pure pagination functions to the UI:

```typescript
export class PaginationController {
  /** Configure for a new search session. Resets all state. */
  configure(options: {
    sourceIds: readonly string[];
    fetchPage: FetchPageFn;
    pageSize?: number;
    timeoutMs?: number;
  }): void;

  /** Load the first page. Resets pagination state. */
  async loadFirst(): Promise<PaginationLoadResult>;

  /** Load the next page (Load More). Continues from current state. */
  async loadNext(): Promise<PaginationLoadResult>;

  /** Reset pagination state without reconfiguring. */
  reset(): void;

  /** Whether more results can be loaded. */
  get hasMore(): boolean;
}

export interface PaginationLoadResult {
  readonly items: readonly OerItem[];
  readonly meta: PaginationMeta;
  /** Legacy-compatible OerMetadata for LoadMore component */
  readonly oerMeta: OerMetadata;
}
```

---

## 8. Simplified SearchClient Interface

File: `packages/oer-finder-plugin/src/clients/search-client.interface.ts` (revised)

```typescript
/**
 * Result from a single-source search.
 * No longer carries allSourcesState.
 */
export interface SearchResult {
  readonly data: readonly OerItem[];
  readonly meta: OerMetadata;
}

/**
 * Parameters for a single-source search.
 * No longer carries allSourcesState.
 */
export interface SingleSourceSearchParams {
  readonly source: string;
  readonly page: number;
  readonly pageSize: number;
  readonly searchTerm?: string;
  readonly type?: string;
  readonly license?: string;
  readonly language?: string;
}

/**
 * Simplified: only handles single-source searches.
 * Multi-source orchestration is handled by the pagination layer.
 */
export interface SearchClient {
  search(params: SingleSourceSearchParams, signal?: AbortSignal): Promise<SearchResult>;
  getAvailableSources(): SourceOption[];
  getDefaultSourceId(): string;
  getRealSourceIds(): string[];
}
```

---

## 9. Data Flow

### 9.1 Single Source Search (Unchanged)

```
User submits search (source = "openverse")
  -> client.search({ source: "openverse", page: 1, pageSize: 20, ... })
  -> Returns SearchResult { data, meta }
  -> User clicks "Load More" -> page++ -> client.search({ page: 2, ... })
```

No change. The pagination layer is not involved for single-source mode.

### 9.2 All Sources Search (Revised)

```
User submits search (source = "all")
  |
  v
OerSearchElement.handleSubmit()
  -> Configures PaginationController with:
       sourceIds: ["openverse", "arasaac", "nostr"]
       fetchPage: (sourceId, page, pageSize) => client.search(...)
       pageSize: 20
  |
  v
paginationController.loadFirst()
  |
  v
loadNextPage(config, initialState)
  |-- Each source buffer is empty -> fetch page 1 from all sources in parallel
  |-- Apply results: each source buffer now has ~20 items
  |-- Take items from each buffer
  |-- Interleave round-robin: [ov-0, ar-0, ns-0, ov-1, ...] (20 total)
  |-- Return unconsumed items to buffers (e.g. 13 items each)
  |
  v
Returns { items: [...20], meta: { total, shown: 20, hasMore: true } }
  |
  v
User clicks "Load More"
  |
  v
paginationController.loadNext()
  |
  v
loadNextPage(config, currentState)
  |-- All sources have items in buffer (13, 13, 14), totalBuffered (40) >= pageSize (20)
  |-- No fetches needed! Take from buffers -> interleave -> 20 items
  |-- Remaining buffers: 6, 6, 8
  |
  v
Returns 20 more items, ZERO network requests
  |
  v
User clicks "Load More" again
  |
  v
loadNextPage(config, currentState)
  |-- Buffers have 6+6+8 = 20 items, totalBuffered (20) >= pageSize (20)
  |-- No fetches needed -> take all -> interleave -> 20 items
  |-- Buffers now empty
  |
  v
User clicks "Load More" again
  |
  v
loadNextPage(config, currentState)
  |-- All buffers empty, all sources have hasMorePages = true
  |-- Fetch page 2 from all three sources in parallel
  |-- ...cycle continues
```

**Key improvements:**
- **No re-fetching of data.** When a source returns 20 items but only 7 are consumed, the remaining 13 stay in the buffer.
- **No short pages.** When total buffered items fall below pageSize, sources with more server data are fetched proactively to fill the page. A short page only occurs when all sources are genuinely exhausted.

### 9.3 Failure Handling

```
Source "nostr" times out or errors on fetch
  -> applyFetchFailure(state)
  -> active: false (permanently excluded for this search session)
  -> All subsequent Load More calls skip "nostr" entirely
  -> User starts a new search -> all sources reset to active
```

Same behavior as the current implementation. A source that fails is permanently excluded for the session. This is simple and appropriate -- transient failures are rare, and a retry would likely fail again for the same reason (e.g. source is down). The user can always start a new search to retry all sources.

---

## 10. How Each Source Manages Its Own Cursor

| Operation | Current (centralized) | Proposed (source-owned) |
|---|---|---|
| Initialize | Implicit (no cursor = page 1, skip 0) | `createSourceState(sourceId)` returns explicit initial state |
| Advance page | `buildNewCursors` computes `nextPage` for all sources | `applyFetchSuccess(state, result)` updates one source |
| Track unconsumed items | `nextSkip` field + re-fetch on next Load More | `buffer` field + `takeItems` / return-to-buffer |
| Mark exhausted/failed | `buildNewCursors` sets `hasMore: false` | `applyFetchFailure` or `markExhausted` sets `active: false` |
| Check availability | `getActiveSources` filters global cursor map | `isSourceAvailable(state)` checks one source |

---

## 11. Testing Benefits

### Source Paginator Tests (Pure Functions, No Mocks)

```typescript
describe('takeItems', () => {
  it('takes requested count and returns remaining buffer', () => {
    const state = { ...createSourceState('a'), buffer: [item1, item2, item3] };
    const { items, nextState } = takeItems(state, 2);
    expect(items).toEqual([item1, item2]);
    expect(nextState.buffer).toEqual([item3]);
  });
});

describe('applyFetchFailure', () => {
  it('permanently marks source as inactive', () => {
    const state = createSourceState('a');
    const result = applyFetchFailure(state);
    expect(result.active).toBe(false);
  });
});
```

### Interleave Tests (Generic, Pure)

```typescript
describe('interleave', () => {
  it('round-robins from two arrays', () => {
    const result = interleave([['A1', 'A2'], ['B1', 'B2']], 4);
    expect(result.items).toEqual(['A1', 'B1', 'A2', 'B2']);
    expect(result.consumed).toEqual([2, 2]);
  });

  it('handles uneven arrays', () => {
    const result = interleave([['A1', 'A2', 'A3'], ['B1']], 4);
    expect(result.items).toEqual(['A1', 'B1', 'A2', 'A3']);
    expect(result.consumed).toEqual([3, 1]);
  });
});
```

The interleave function is generic (`<T>`) so it can be tested with strings, not just OerItem objects.

### Multi-Source Tests (Only FetchPage Mocked)

```typescript
it('does not re-fetch when buffer has items', async () => {
  const calls: string[] = [];
  const fetchPage: FetchPageFn = async (sourceId) => {
    calls.push(sourceId);
    return { items: Array(20).fill(mockItem(sourceId)), total: 100, totalPages: 5, page: 1 };
  };

  const state = createMultiSourceState(['A', 'B']);
  const first = await loadNextPage(config, state);

  calls.length = 0;
  await loadNextPage(config, first.nextState);
  expect(calls).toEqual([]); // No fetches!
});
```

---

## 12. Trade-Off Analysis

| Decision | Choice | Rationale |
|---|---|---|
| Buffer vs. Re-fetch | **Buffer** | Zero wasted bandwidth. ~100KB max memory (negligible). Eliminates re-fetches. |
| Source-owned vs. Centralized | **Source-owned** | Each source's state is independently testable. Pure functions. No coupled intermediate data structures. |
| PaginationController class vs. Pure functions only | **Class** | Thin wrapper for ergonomics. Actual logic in pure functions. OerSearch doesn't need to manage `MultiSourcePaginationState`. |
| Failure handling | **Fail immediately** | Simple. A failed source is excluded for the session. Transient failures are rare and retries would likely fail again. User can start a new search to retry. |

---

## 13. Migration Strategy

### Phase 1: Add New Pagination Layer (No Breaking Changes)

1. Create `pagination/types.ts` with all new type definitions
2. Create `pagination/source-paginator.ts` with pure functions
3. Create `pagination/interleave.ts` (extracted from current `interleaveWithConsumption`)
4. Create `pagination/multi-source-paginator.ts`
5. Write comprehensive tests for all three modules
6. Create `oer-search/pagination-controller.ts`

New code exists alongside old code. Nothing uses it yet.

### Phase 2: Integrate PaginationController into OerSearch

1. Add a `PaginationController` instance to `OerSearchElement`
2. When `source === SOURCE_ID_ALL`:
   - On submit: `paginationController.configure(...)` then `paginationController.loadFirst()`
   - On Load More: `paginationController.loadNext()`
3. Remove `allSourcesState` property from `OerSearchElement`
4. Remove `allSourcesState` from `SearchParams`
5. Update `ApiClient` and `DirectClient` to remove `searchAll` methods
6. The `PaginationController` creates the `FetchPageFn` that calls `client.search()` for individual sources

### Phase 3: Clean Up Old Code

1. Delete `clients/all-sources-search.ts` and its test
2. Remove `AllSourcesState` and `PerSourceCursor` from `search-client.interface.ts`
3. Remove `searchAll` methods from `ApiClient` and `DirectClient`
4. Simplify `SearchClient` interface to only expose single-source search
5. Update all existing tests

### Phase 4 (Future): Simplify LoadMore

Accept a simple `hasMore: boolean` prop instead of computing it from `page < totalPages`.

---

## 14. Summary of Improvements

| Aspect | Current | Proposed |
|---|---|---|
| **Cursor ownership** | Centralized in `searchAllSources` | Each source owns its state via pure functions |
| **Re-fetching** | Re-fetches partial pages, discards items | Buffers unconsumed items, zero wasted bandwidth |
| **Failure handling** | Permanent exclusion on first failure | Same: permanent exclusion (simple, appropriate) |
| **Testability** | Requires full async pipeline + mocks | Pure functions testable synchronously without mocks |
| **Type safety** | `allSourcesState` optional on `SearchParams` (mode-dependent) | `PaginationController` encapsulates state; `SearchParams` is clean |
| **UI complexity** | OerSearch manages `allSourcesState` in 4+ places | OerSearch delegates to `PaginationController.loadFirst/loadNext` |
| **Code organization** | 329-line file with 9 coupled functions | 3 focused files: ~100 + ~30 + ~150 lines |
| **LoadMore compatibility** | Synthetic `page: 1` hack | `paginationMetaToOerMeta` bridge, path to native `hasMore` prop |
| **SearchClient interface** | Dual-purpose (single + all sources) | Single-purpose (single source only) |
