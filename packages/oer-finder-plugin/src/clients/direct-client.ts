import type { AdapterSearchQuery, ExternalOerItem } from '@edufeed-org/oer-adapter-core';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { AdapterManager } from '../adapters/adapter-manager.js';
import { SOURCE_ID_ALL, ALL_SOURCES_TIMEOUT_MS, DEFAULT_PAGE_SIZE } from '../constants.js';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import type { SourceConfig } from '../types/source-config.js';
import {
  searchAllSources,
  type SingleSourceSearchFn,
  type PerSourceSearchParams,
} from './all-sources-search.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

type OerItem = components['schemas']['OerItemSchema'];
type ImageUrls = components['schemas']['ImageUrlsSchema'];
type SystemExtensions = components['schemas']['SystemExtensionsSchema'];

/**
 * DirectClient performs searches directly using adapters from the browser.
 * Used when no api-url is provided to the component.
 */
export class DirectClient implements SearchClient {
  private adapterManager: AdapterManager;

  constructor(sources: readonly SourceConfig[]) {
    this.adapterManager = AdapterManager.fromSourceConfigs(sources);
  }

  /**
   * Perform a search using the direct adapter.
   * When source is 'all', searches all sources in parallel.
   */
  async search(params: SearchParams): Promise<SearchResult> {
    if (params.source === SOURCE_ID_ALL) {
      return this.searchAll(params);
    }

    const sourceId = params.source || this.adapterManager.getDefaultSourceId();

    const adapterQuery: AdapterSearchQuery = {
      keywords: params.searchTerm,
      type: params.type,
      license: params.license,
      language: params.language,
      page: params.page || 1,
      pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
    };

    const result = await this.adapterManager.search(sourceId, adapterQuery);

    return {
      data: result.items.map((item) => this.mapToOerItem(item, sourceId)),
      meta: {
        total: result.total,
        page: adapterQuery.page,
        pageSize: adapterQuery.pageSize,
        totalPages: Math.ceil(result.total / adapterQuery.pageSize),
      },
    };
  }

  /**
   * Search all configured sources in parallel using the all-sources orchestrator.
   */
  private async searchAll(params: SearchParams): Promise<SearchResult> {
    const sourceIds = this.adapterManager.getAllSourceIds();

    const searchFn: SingleSourceSearchFn = async (
      perSourceParams: PerSourceSearchParams,
      signal?: AbortSignal,
    ) => {
      const adapterQuery: AdapterSearchQuery = {
        keywords: params.searchTerm,
        type: params.type,
        license: params.license,
        language: params.language,
        page: perSourceParams.page,
        pageSize: perSourceParams.pageSize,
      };

      const result = await this.adapterManager.search(perSourceParams.source, adapterQuery, {
        signal,
      });

      return {
        data: result.items.map((item) => this.mapToOerItem(item, perSourceParams.source)),
        meta: {
          total: result.total,
          page: adapterQuery.page,
          pageSize: adapterQuery.pageSize,
          totalPages: Math.ceil(result.total / adapterQuery.pageSize),
        },
      };
    };

    return searchAllSources({
      sourceIds,
      searchFn,
      timeoutMs: ALL_SOURCES_TIMEOUT_MS,
      totalPageSize: params.pageSize || DEFAULT_PAGE_SIZE,
      previousState: params.allSourcesState,
    });
  }

  /**
   * Get the list of available sources from the adapter manager.
   */
  getAvailableSources(): SourceOption[] {
    return this.adapterManager.getAvailableSources();
  }

  /**
   * Get the default source ID.
   * Delegates to AdapterManager which prefers selected sources.
   */
  getDefaultSourceId(): string {
    return this.adapterManager.getDefaultSourceId();
  }

  /**
   * Map an ExternalOerItem to the OerItemSchema format expected by the plugin.
   */
  private mapToOerItem(item: ExternalOerItem, sourceId: string): OerItem {
    const system: SystemExtensions = {
      source: sourceId,
      foreignLandingUrl: item.extensions.foreignLandingUrl,
      attribution: item.extensions.attribution,
    };

    return {
      amb: item.amb as OerItem['amb'],
      extensions: {
        fileMetadata: null,
        images: this.mapImages(item),
        system,
      },
    };
  }

  /**
   * Map image URLs from the adapter to the expected format.
   * In direct mode, we use original URLs without imgproxy optimization.
   */
  private mapImages(item: ExternalOerItem): ImageUrls | null {
    // If the adapter already provides image URLs, use them
    if (item.extensions.images) {
      return item.extensions.images;
    }

    // Otherwise, try to create fallback from amb.image
    const imageUrl = item.amb.image;
    if (typeof imageUrl === 'string' && imageUrl.length > 0) {
      return {
        high: imageUrl,
        medium: imageUrl,
        small: imageUrl,
      };
    }

    return null;
  }
}
