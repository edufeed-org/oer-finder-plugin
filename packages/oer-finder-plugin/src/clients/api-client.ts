import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

/**
 * ApiClient performs searches through the server API.
 * Used when api-url is provided to the component (server-proxy mode).
 * Handles single-source searches only. Multi-source orchestration
 * is managed by OerSearch which calls search() per source in parallel.
 */
export class ApiClient implements SearchClient {
  private readonly client: OerClient;
  private readonly sources: SourceOption[];

  constructor(apiUrl: string, availableSources?: SourceOption[]);
  constructor(client: OerClient, availableSources?: SourceOption[]);
  constructor(apiUrlOrClient: string | OerClient, availableSources: SourceOption[] = []) {
    this.client =
      typeof apiUrlOrClient === 'string' ? createOerClient(apiUrlOrClient) : apiUrlOrClient;
    this.sources = availableSources;
  }

  /**
   * Search a single source through the server API.
   */
  async search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult> {
    if (!params.source) {
      throw new Error('source is required for API searches');
    }

    const response = await this.client.GET('/api/v1/oer', {
      params: {
        query: { ...params, source: params.source },
      },
      signal,
    });

    if (response.error) {
      throw new Error('Failed to fetch resources');
    }

    if (!response.data) {
      throw new Error('No data returned from API');
    }

    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  }

  /**
   * Get the list of available sources.
   */
  getAvailableSources(): SourceOption[] {
    return this.sources;
  }
}
