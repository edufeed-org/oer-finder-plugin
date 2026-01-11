import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
} from '@edufeed-org/oer-adapter-core';
import { parseOpenverseSearchResponse } from './openverse.types.js';
import { mapOpenverseImageToAmb } from './mappers/openverse-to-amb.mapper.js';

/** API base URL */
const API_BASE_URL = 'https://api.openverse.org/v1';

/**
 * Openverse adapter for searching openly licensed images.
 *
 * Openverse is a search engine for openly licensed media, including images and audio.
 * It aggregates content from multiple sources like Flickr, Wikimedia Commons,
 * Metropolitan Museum of Art, and many others.
 *
 * API Documentation: https://api.openverse.org/v1/
 * All content is openly licensed (CC licenses, public domain, etc.)
 */
export class OpenverseAdapter implements SourceAdapter {
  readonly sourceId = 'openverse';
  readonly sourceName = 'Openverse';

  /**
   * Search for images matching the query.
   *
   * Openverse API endpoint: GET /v1/images/?q={searchText}
   *
   * Mapped filters:
   * - license: Maps CC license URIs to Openverse codes (by, by-sa, cc0, pdm, etc.)
   *
   * Default filters applied:
   * - mature=false: Excludes mature content (safe for educational use)
   * - filter_dead=true: Excludes broken/dead links
   *
   * Note: The `type` parameter from OerQueryDto is not mapped since this endpoint
   * only returns images. Filtering by media type (image/video/audio) is not
   * applicable here.
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    const keywords = query.keywords?.trim();
    if (!keywords) {
      return { items: [], total: 0 };
    }

    const params = new URLSearchParams();
    params.set('q', keywords);
    params.set('page', query.page.toString());
    params.set('page_size', query.pageSize.toString());

    // Default filters for educational/safe content
    params.set('mature', 'false');
    params.set('filter_dead', 'true');

    // Filter by license if specified
    if (query.license) {
      const licenseParam = this.mapLicenseToOpenverse(query.license);
      if (licenseParam) {
        params.set('license', licenseParam);
      }
    }

    const url = `${API_BASE_URL}/images/?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { items: [], total: 0 };
      }
      throw new Error(
        `Openverse API error: ${response.status} ${response.statusText}`,
      );
    }

    const rawData: unknown = await response.json();
    const searchResponse = parseOpenverseSearchResponse(rawData);

    const items = searchResponse.results.map((image) =>
      mapOpenverseImageToAmb(image),
    );

    return {
      items,
      total: searchResponse.result_count,
    };
  }

  /**
   * Map a license URI to Openverse license parameter.
   * Openverse accepts license codes like "by", "by-sa", "cc0", etc.
   */
  private mapLicenseToOpenverse(licenseUri: string): string | null {
    const licenseMap: Record<string, string> = {
      'creativecommons.org/licenses/by/': 'by',
      'creativecommons.org/licenses/by-sa/': 'by-sa',
      'creativecommons.org/licenses/by-nc/': 'by-nc',
      'creativecommons.org/licenses/by-nd/': 'by-nd',
      'creativecommons.org/licenses/by-nc-sa/': 'by-nc-sa',
      'creativecommons.org/licenses/by-nc-nd/': 'by-nc-nd',
      'creativecommons.org/publicdomain/zero/': 'cc0',
      'creativecommons.org/publicdomain/mark/': 'pdm',
    };

    for (const [pattern, code] of Object.entries(licenseMap)) {
      if (licenseUri.includes(pattern)) {
        return code;
      }
    }

    return null;
  }

}

/**
 * Factory function to create an OpenverseAdapter.
 */
export function createOpenverseAdapter(): OpenverseAdapter {
  return new OpenverseAdapter();
}
