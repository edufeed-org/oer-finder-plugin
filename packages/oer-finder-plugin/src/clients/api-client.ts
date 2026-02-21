import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import { SOURCE_ID_ALL, ALL_SOURCES_TIMEOUT_MS } from '../constants.js';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import { searchAllSources, type SingleSourceSearchFn } from './all-sources-search.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

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
   * When source is 'all', searches all sources in parallel.
   */
  async search(params: SearchParams): Promise<SearchResult> {
    if (params.source === SOURCE_ID_ALL) {
      return this.searchAll(params);
    }

    return this.singleSourceSearch(params);
  }

  /**
   * Search a single source through the server API.
   */
  private async singleSourceSearch(params: SearchParams): Promise<SearchResult> {
    // Strip allSourcesState before sending to server
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allSourcesState: _, ...queryParams } = params;

    const response = await this.client.GET('/api/v1/oer', {
      params: {
        query: queryParams,
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
   * Search all configured sources in parallel using the all-sources orchestrator.
   * The searchFn closure captures all filter params from the original request.
   */
  private async searchAll(params: SearchParams): Promise<SearchResult> {
    const realSourceIds = this.sources.filter((s) => s.id !== SOURCE_ID_ALL).map((s) => s.id);

    const searchFn: SingleSourceSearchFn = async (perSourceParams) => {
      const mergedParams: SearchParams = {
        ...params,
        source: perSourceParams.source,
        page: perSourceParams.page,
        pageSize: perSourceParams.pageSize,
        allSourcesState: undefined,
      };
      return this.singleSourceSearch(mergedParams);
    };

    return searchAllSources({
      sourceIds: realSourceIds,
      searchFn,
      timeoutMs: ALL_SOURCES_TIMEOUT_MS,
      totalPageSize: params.pageSize || 20,
      previousState: params.allSourcesState,
    });
  }

  /**
   * Get the list of available sources.
   * Prepends "All Sources" option when 2+ real sources are configured.
   */
  getAvailableSources(): SourceOption[] {
    const realSources = this.sources.filter((s) => s.id !== SOURCE_ID_ALL);
    if (realSources.length >= 2) {
      return [{ id: SOURCE_ID_ALL, label: 'All Sources' }, ...realSources];
    }
    return realSources;
  }

  /**
   * Get the default source ID.
   * Prefers the first source marked with selected: true; falls back to sources[0].
   */
  getDefaultSourceId(): string {
    return this.sources.find((s) => s.selected === true)?.id ?? this.sources[0]?.id ?? 'openverse';
  }
}
