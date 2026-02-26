import type { AdapterSearchQuery, ExternalOerItem } from '../types/adapter-core-types.js';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { AdapterManager } from '../adapters/adapter-manager.js';
import { DEFAULT_PAGE_SIZE } from '../constants.js';
import type { SearchParams, SourceOption } from '../oer-search/OerSearch.js';
import type { SourceConfig } from '../types/source-config.js';
import type { SearchClient, SearchResult } from './search-client.interface.js';

type OerItem = components['schemas']['OerItemSchema'];
type ImageUrls = components['schemas']['ImageUrlsSchema'];
type SystemExtensions = components['schemas']['SystemExtensionsSchema'];

/**
 * DirectClient performs searches directly using adapters from the browser.
 * Used when no api-url is provided to the component.
 * Handles single-source searches only. Multi-source orchestration
 * is managed by OerSearch which calls search() per source in parallel.
 *
 * All adapter registrations (via `registerAdapter()`) must be completed
 * before the first call to `search()` or `getAvailableSources()`.
 * The adapter set is frozen on first use.
 */
export class DirectClient implements SearchClient {
  private adapterManager: AdapterManager | null = null;
  private readonly sources: readonly SourceConfig[];

  constructor(sources: readonly SourceConfig[]) {
    this.sources = sources;
  }

  private getAdapterManager(): AdapterManager {
    if (!this.adapterManager) {
      this.adapterManager = AdapterManager.fromSourceConfigs(this.sources);
    }
    return this.adapterManager;
  }

  /**
   * Search a single source using the direct adapter.
   */
  async search(params: SearchParams, signal?: AbortSignal): Promise<SearchResult> {
    if (!params.source) {
      throw new Error('source is required for direct searches');
    }

    const adapterQuery: AdapterSearchQuery = {
      keywords: params.searchTerm,
      type: params.type,
      license: params.license,
      language: params.language,
      educationalLevel: params.educational_level,
      page: params.page || 1,
      pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
    };

    const result = await this.getAdapterManager().search(params.source, adapterQuery, {
      signal,
    });

    return {
      data: result.items.map((item) => this.mapToOerItem(item, params.source!)),
      meta: {
        total: result.total,
        page: adapterQuery.page,
        pageSize: adapterQuery.pageSize,
        totalPages: Math.ceil(result.total / adapterQuery.pageSize),
      },
    };
  }

  /**
   * Get the list of available sources from the adapter manager.
   */
  getAvailableSources(): SourceOption[] {
    return this.getAdapterManager().getAvailableSources();
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
