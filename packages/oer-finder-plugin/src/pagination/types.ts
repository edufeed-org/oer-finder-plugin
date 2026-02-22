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
 * Clean pagination metadata for the LoadMore component.
 */
export interface PaginationMeta {
  /** Total items available across all sources */
  readonly total: number;
  /** Total items shown so far (accumulated) */
  readonly shown: number;
  /** Whether more items are available from any source */
  readonly hasMore: boolean;
}
