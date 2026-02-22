import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import { SOURCE_ID_ALL, prependAllSourcesOption } from '../constants.js';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

/**
 * ApiClient performs searches through the server API.
 * Used when api-url is provided to the component (server-proxy mode).
 * Handles single-source searches only. Multi-source orchestration
 * is managed by PaginationController.
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
    const response = await this.client.GET('/api/v1/oer', {
      params: {
        query: params,
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
   * Prepends "All Sources" option when 2+ real sources are configured.
   */
  getAvailableSources(): SourceOption[] {
    const includeAll = this.sources.some((s) => s.id === SOURCE_ID_ALL);
    const realSources = this.sources.filter((s) => s.id !== SOURCE_ID_ALL);
    return prependAllSourcesOption(realSources, includeAll) as SourceOption[];
  }

  /**
   * Get the default source ID.
   * Prefers the first source marked with selected: true; falls back to sources[0].
   */
  getDefaultSourceId(): string {
    return this.sources.find((s) => s.selected === true)?.id ?? this.sources[0]?.id ?? 'openverse';
  }

  /**
   * Get all real source IDs (excluding virtual sources like 'all').
   */
  getRealSourceIds(): string[] {
    return this.sources.filter((s) => s.id !== SOURCE_ID_ALL).map((s) => s.id);
  }
}
