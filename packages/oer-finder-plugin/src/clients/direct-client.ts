import type { AdapterSearchQuery, ExternalOerItem } from '@edufeed-org/oer-adapter-core';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { AdapterManager, type AdapterManagerConfig } from '../adapters/adapter-manager.js';
import type {
  SearchClient,
  SearchResult,
  SearchParams,
  SourceOption,
} from './search-client.interface.js';

type OerItem = components['schemas']['OerItemSchema'];
type ImageUrls = components['schemas']['ImageUrlsSchema'];
type SystemExtensions = components['schemas']['SystemExtensionsSchema'];

/**
 * DirectClient performs searches directly using adapters from the browser.
 * Used when no api-url is provided to the component.
 */
export class DirectClient implements SearchClient {
  private adapterManager: AdapterManager;

  constructor(config: AdapterManagerConfig = {}) {
    this.adapterManager = new AdapterManager(config);
  }

  /**
   * Perform a search using the direct adapter.
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const sourceId = params.source || this.adapterManager.getDefaultSourceId();

    const adapterQuery: AdapterSearchQuery = {
      keywords: params.searchTerm,
      type: params.type,
      license: params.license,
      language: params.language,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
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
   * Get the list of available sources from the adapter manager.
   */
  getAvailableSources(): SourceOption[] {
    return this.adapterManager.getAvailableSources();
  }

  /**
   * Map an ExternalOerItem to the OerItemSchema format expected by the plugin.
   */
  private mapToOerItem(item: ExternalOerItem, sourceId: string): OerItem {
    // Note: The generated schema types for foreignLandingUrl and attribution are
    // incorrectly typed as Record<string, never> | null instead of string | null.
    // We use type assertions here to work around this schema generation issue.
    const system: SystemExtensions = {
      source: sourceId,
      foreignLandingUrl: item.extensions
        .foreign_landing_url as SystemExtensions['foreignLandingUrl'],
      attribution: item.extensions.attribution as SystemExtensions['attribution'],
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
