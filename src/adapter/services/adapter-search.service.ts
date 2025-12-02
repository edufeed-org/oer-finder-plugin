import { Injectable, Logger } from '@nestjs/common';
import type {
  AdapterSearchQuery,
  AdapterSearchResult,
  ExternalOerItem,
  ExternalOerItemWithSource,
  SourceAdapter,
} from '@edufeed-org/oer-adapter-core';
import { AdapterRegistryService } from './adapter-registry.service';
import { OerQueryDto } from '../../oer/dto/oer-query.dto';

export interface AdapterSearchResponse {
  items: ExternalOerItemWithSource[];
  total: number;
}

/**
 * Service that routes search requests to specific source adapters.
 */
@Injectable()
export class AdapterSearchService {
  private readonly logger = new Logger(AdapterSearchService.name);

  constructor(private readonly adapterRegistry: AdapterRegistryService) {}

  /**
   * Search a specific adapter by its source ID.
   * Returns results only from that adapter.
   */
  async searchBySource(
    query: OerQueryDto,
    sourceId: string,
  ): Promise<AdapterSearchResponse> {
    const adapter = this.adapterRegistry.getAdapter(sourceId);

    if (!adapter) {
      this.logger.warn(`Adapter "${sourceId}" not found or not enabled`);
      return { items: [], total: 0 };
    }

    const adapterQuery = this.toAdapterQuery(query);
    const timeoutMs = this.adapterRegistry.getTimeoutMs();

    try {
      const searchResult = await this.searchWithTimeout(
        adapter,
        adapterQuery,
        timeoutMs,
      );

      // Add source to each item
      const itemsWithSource: ExternalOerItemWithSource[] =
        searchResult.items.map((item: ExternalOerItem) => ({
          ...item,
          source: sourceId,
        }));

      this.logger.debug(
        `Adapter "${sourceId}" returned ${searchResult.items.length} items (total: ${searchResult.total})`,
      );

      return {
        items: itemsWithSource,
        total: searchResult.total,
      };
    } catch (error) {
      // Check if it was an abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(
          `Adapter "${sourceId}" timed out after ${timeoutMs}ms`,
        );
      } else {
        this.logger.warn(`Adapter "${sourceId}" failed: ${error}`);
      }
      return { items: [], total: 0 };
    }
  }

  /**
   * Translate OerQueryDto to AdapterSearchQuery.
   * Only includes fields that adapters can handle.
   */
  private toAdapterQuery(query: OerQueryDto): AdapterSearchQuery {
    return {
      keywords: query.keywords,
      type: query.type,
      license: query.license,
      language: query.language,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /**
   * Execute a search with timeout using AbortController.
   * Properly cancels the underlying HTTP request when timeout is reached.
   */
  private async searchWithTimeout(
    adapter: SourceAdapter,
    query: AdapterSearchQuery,
    timeoutMs: number,
  ): Promise<AdapterSearchResult> {
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeoutMs);

    try {
      const result = await adapter.search(query, {
        signal: abortController.signal,
      });
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
