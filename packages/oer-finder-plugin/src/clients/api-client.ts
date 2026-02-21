import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import {
  SOURCE_ID_ALL,
  ALL_SOURCES_TIMEOUT_MS,
  DEFAULT_PAGE_SIZE,
  prependAllSourcesOption,
} from '../constants.js';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import {
  searchAllSources,
  type SingleSourceSearchFn,
  type PerSourceSearchParams,
} from './all-sources-search.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

/**
 * ApiClient performs searches through the server API.
 * Used when api-url is provided to the component (server-proxy mode).
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
  private async singleSourceSearch(
    params: SearchParams,
    signal?: AbortSignal,
  ): Promise<SearchResult> {
    // Strip allSourcesState before sending to server
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allSourcesState: _, ...queryParams } = params;

    const response = await this.client.GET('/api/v1/oer', {
      params: {
        query: queryParams,
      },
      signal,
    });

    if (response.error) {
      // Log detailed error for debugging but throw a generic message
      // to avoid leaking internal server details (paths, table names, etc.)
      const detailedMessage = response.error.message
        ? Array.isArray(response.error.message)
          ? response.error.message.join(', ')
          : response.error.message
        : 'Unknown error';
      console.error('API error:', detailedMessage);
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
   * Search all configured sources in parallel using the all-sources orchestrator.
   * The searchFn closure captures all filter params from the original request.
   */
  private async searchAll(params: SearchParams): Promise<SearchResult> {
    const realSourceIds = this.sources.filter((s) => s.id !== SOURCE_ID_ALL).map((s) => s.id);

    const searchFn: SingleSourceSearchFn = async (
      perSourceParams: PerSourceSearchParams,
      signal?: AbortSignal,
    ) => {
      const mergedParams: SearchParams = {
        ...params,
        source: perSourceParams.source,
        page: perSourceParams.page,
        pageSize: perSourceParams.pageSize,
        allSourcesState: undefined,
      };
      return this.singleSourceSearch(mergedParams, signal);
    };

    return searchAllSources({
      sourceIds: realSourceIds,
      searchFn,
      timeoutMs: ALL_SOURCES_TIMEOUT_MS,
      totalPageSize: params.pageSize || DEFAULT_PAGE_SIZE,
      previousState: params.allSourcesState,
    });
  }

  /**
   * Get the list of available sources.
   * Prepends "All Sources" option when 2+ real sources are configured.
   */
  getAvailableSources(): SourceOption[] {
    const realSources = this.sources.filter((s) => s.id !== SOURCE_ID_ALL);
    return prependAllSourcesOption(realSources) as SourceOption[];
  }

  /**
   * Get the default source ID.
   * Prefers the first source marked with selected: true; falls back to sources[0].
   */
  getDefaultSourceId(): string {
    return this.sources.find((s) => s.selected === true)?.id ?? this.sources[0]?.id ?? 'openverse';
  }
}
