import type { components } from '@edufeed-org/oer-finder-api-client';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';

type OerItem = components['schemas']['OerItemSchema'];
type OerMetadata = components['schemas']['OerMetadataSchema'];

/**
 * Per-source pagination cursor for "all sources" mode.
 * Tracks the page and skip position for each source to ensure no items are
 * lost when only a portion of a source's results are shown in a given round.
 */
export interface PerSourceCursor {
  readonly sourceId: string;
  /** The next page to request from this source */
  readonly nextPage: number;
  /** Number of items to skip from the start of nextPage's results (already shown) */
  readonly nextSkip: number;
  /** Whether this source has more results available */
  readonly hasMore: boolean;
}

/**
 * State for "all sources" pagination, returned as part of SearchResult
 * and passed back on subsequent searches.
 */
export interface AllSourcesState {
  readonly cursors: readonly PerSourceCursor[];
}

/**
 * Result from a search operation.
 * Matches the structure expected by OerSearchElement.
 */
export interface SearchResult {
  readonly data: readonly OerItem[];
  readonly meta: OerMetadata;
  /** Present only when source='all'; used for "Load More" cursor tracking */
  readonly allSourcesState?: AllSourcesState;
}

/**
 * Common interface for all search clients.
 * Implemented by both ApiClient (server-proxy mode) and DirectClient (direct-adapter mode).
 */
export interface SearchClient {
  /**
   * Perform a search with the given parameters.
   * @param params - Search parameters
   * @returns Promise resolving to search results
   */
  search(params: SearchParams): Promise<SearchResult>;

  /**
   * Get the list of available sources.
   * @returns Array of source options
   */
  getAvailableSources(): SourceOption[];

  /**
   * Get the default source ID.
   * Prefers the first source marked with `selected: true`;
   * falls back to the first available source.
   * @returns The default source ID
   */
  getDefaultSourceId(): string;
}
