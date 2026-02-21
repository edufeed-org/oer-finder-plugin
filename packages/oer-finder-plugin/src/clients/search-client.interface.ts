import type { components } from '@edufeed-org/oer-finder-api-client';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';

type OerItem = components['schemas']['OerItemSchema'];
type OerMetadata = components['schemas']['OerMetadataSchema'];

/**
 * Per-source pagination cursor for "all sources" mode.
 * Tracks which page each source is on for the next "Load More" request.
 */
export interface PerSourceCursor {
  readonly sourceId: string;
  readonly nextPage: number;
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
  data: OerItem[];
  meta: OerMetadata;
  /** Present only when source='all'; used for "Load More" cursor tracking */
  allSourcesState?: AllSourcesState;
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
