import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import {
  isEmptySearch,
  EMPTY_RESULT,
  ccLicenseUriToCode,
} from '@edufeed-org/oer-adapter-core';
import { parseOpenverseSearchResponse } from './openverse.types.js';
import { mapOpenverseImageToAmb } from './mappers/openverse-to-amb.mapper.js';

const OPENVERSE_API_BASE_URLS = [
  'https://api.openverse.org/v1',
  'https://api.openverse.engineering/v1',
] as const;
const OPENVERSE_SEARCH_PATHS = ['images/', 'images'] as const;
const DEFAULT_USER_AGENT =
  'edufeed-oer-finder-plugin/0.0.1 (+https://github.com/edufeed-org/oer-finder-plugin)';

interface OpenverseHttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

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
  readonly capabilities: AdapterCapabilities = {
    supportedTypes: ['image'],
    supportsLicenseFilter: true,
    supportsEducationalLevelFilter: false,
  };

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
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const keywords = query.keywords!.trim();
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

    const response = await this.fetchFromOpenverse(params, options?.signal);

    if (!response.ok) {
      if (response.status === 404) {
        return EMPTY_RESULT;
      }
      throw await this.buildApiError(response);
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

  private buildSearchUrl(
    apiBaseUrl: string,
    path: string,
    params: URLSearchParams,
  ): string {
    const url = new URL(path, `${apiBaseUrl}/`);
    url.search = params.toString();
    return url.toString();
  }

  private async fetchFromOpenverse(
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<OpenverseHttpResponse> {
    let lastResponse: OpenverseHttpResponse | null = null;
    let lastError: Error | null = null;

    for (const baseUrl of OPENVERSE_API_BASE_URLS) {
      for (const path of OPENVERSE_SEARCH_PATHS) {
        const url = this.buildSearchUrl(baseUrl, path, params);

        try {
          const response = (await fetch(url, {
            headers: this.buildHeaders(),
            signal,
          })) as OpenverseHttpResponse;

          if (response.ok || response.status === 404) {
            return response;
          }

          lastResponse = response;

          if (!this.shouldTryNextEndpoint(response.status)) {
            return response;
          }
        } catch (error) {
          lastError = this.normalizeError(error);
        }
      }
    }

    if (lastResponse) {
      return lastResponse;
    }

    if (lastError) {
      throw new Error(`Openverse API network error: ${lastError.message}`);
    }

    throw new Error('Openverse API network error: No endpoint responded');
  }

  private shouldTryNextEndpoint(status: number): boolean {
    return status === 403 || status === 429 || status >= 500;
  }

  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private buildHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'User-Agent': DEFAULT_USER_AGENT,
    };
  }

  private async buildApiError(response: OpenverseHttpResponse): Promise<Error> {
    let responseBody = '';

    try {
      responseBody = (await response.text()).trim();
    } catch {
      responseBody = '';
    }

    const detail = responseBody ? ` - ${responseBody.slice(0, 200)}` : '';

    return new Error(
      `Openverse API error: ${response.status} ${response.statusText}${detail}`,
    );
  }

  /**
   * Map a license URI to Openverse license parameter.
   * Openverse accepts license codes like "by", "by-sa", "cc0", etc.
   */
  private mapLicenseToOpenverse(licenseUri: string): string | null {
    return ccLicenseUriToCode(licenseUri);
  }
}

/**
 * Factory function to create an OpenverseAdapter.
 */
export function createOpenverseAdapter(): OpenverseAdapter {
  return new OpenverseAdapter();
}
