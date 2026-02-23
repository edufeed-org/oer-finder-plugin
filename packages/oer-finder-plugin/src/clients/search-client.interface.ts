import type { components } from '@edufeed-org/oer-finder-api-client';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';

type OerMetadata = components['schemas']['OerMetadataSchema'];
type OerItem = components['schemas']['OerItemSchema'];

/**
 * Result from a search operation.
 * Matches the structure expected by OerSearchElement.
 */
export interface SearchResult {
  readonly data: readonly OerItem[];
  readonly meta: OerMetadata;
}

/**
 * Common interface for all search clients.
 * Handles single-source searches only.
 * Multi-source orchestration is handled by the pagination layer.
 */
export interface SearchClient {
  /**
   * Perform a single-source search with the given parameters.
   * @param params - Search parameters
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise resolving to search results
   */
  search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult>;

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

  /**
   * Get all source IDs.
   * Used by PaginationController to configure multi-source searches.
   * @returns Array of source IDs
   */
  getRealSourceIds(): string[];
}
