import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import type {
  SearchClient,
  SearchResult,
  SearchParams,
  SourceOption,
} from './search-client.interface.js';

/**
 * ApiClient performs searches through the server API.
 * Used when api-url is provided to the component (server-proxy mode).
 */
export class ApiClient implements SearchClient {
  private client: OerClient;
  private sources: SourceOption[];

  constructor(apiUrl: string, availableSources: SourceOption[] = []) {
    this.client = createOerClient(apiUrl);
    this.sources = availableSources;
  }

  /**
   * Perform a search using the server API.
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const response = await this.client.GET('/api/v1/oer', {
      params: {
        query: params,
      },
    });

    if (response.error) {
      const errorMessage = response.error.message
        ? Array.isArray(response.error.message)
          ? response.error.message.join(', ')
          : response.error.message
        : 'Failed to fetch resources';
      throw new Error(errorMessage);
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
   * In API mode, this must be provided by the component.
   */
  getAvailableSources(): SourceOption[] {
    return this.sources;
  }

  /**
   * Update the available sources.
   * Called when the component's available-sources attribute changes.
   */
  setAvailableSources(sources: SourceOption[]): void {
    this.sources = sources;
  }
}
