import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import { isEmptySearch, EMPTY_RESULT } from '@edufeed-org/oer-adapter-core';
import { parseWikimediaSearchResponse } from './wikimedia.types.js';
import { mapWikimediaPageToAmb } from './mappers/wikimedia-to-amb.mapper.js';
import type { WikimediaPage } from './wikimedia.types.js';

const API_BASE_URL = 'https://commons.wikimedia.org/w/api.php';

/** Maximum results per request (anonymous API limit) */
const MAX_RESULTS_PER_REQUEST = 50;

const USER_AGENT =
  'edufeed-oer-finder-plugin/0.0.1 (https://github.com/edufeed-org/oer-finder-plugin)';

/**
 * Wikimedia Commons adapter for searching freely licensed media files.
 *
 * Uses the MediaWiki Action API with generator=search to find files
 * in the File namespace (ns=6) on Wikimedia Commons.
 *
 * API Documentation: https://www.mediawiki.org/wiki/API:Search
 * All content on Wikimedia Commons is freely licensed.
 */
export class WikimediaAdapter implements SourceAdapter {
  readonly sourceId = 'wikimedia';
  readonly sourceName = 'Wikimedia Commons';
  readonly capabilities: AdapterCapabilities = {
    supportedTypes: ['image'],
    supportsLicenseFilter: false,
    supportsEducationalLevelFilter: false,
  };

  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const keywords = query.keywords!.trim();
    const pageSize = Math.min(query.pageSize, MAX_RESULTS_PER_REQUEST);
    const offset = (query.page - 1) * pageSize;

    const url = this.buildSearchUrl(keywords, pageSize, offset);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Api-User-Agent': USER_AGENT,
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return EMPTY_RESULT;
      }
      throw new Error(
        `Wikimedia Commons API error: ${response.status} ${response.statusText}`,
      );
    }

    const rawData: unknown = await response.json();
    const parsed = parseWikimediaSearchResponse(rawData);

    if (!parsed.query?.pages) {
      return EMPTY_RESULT;
    }

    const pages = this.sortPagesByIndex(Object.values(parsed.query.pages));

    const pagesWithImages = pages.filter(
      (page): page is WikimediaPage & {
        imageinfo: NonNullable<WikimediaPage['imageinfo']>;
      } => Array.isArray(page.imageinfo) && page.imageinfo.length > 0,
    );

    const items = pagesWithImages.map((page) => mapWikimediaPageToAmb(page));

    // Estimate total: Wikimedia generator=search doesn't return totalhits directly.
    // If `continue` is present, there are more results beyond this page.
    const total = parsed.continue
      ? offset + pageSize + 1
      : offset + items.length;

    return { items, total };
  }

  private buildSearchUrl(
    keywords: string,
    limit: number,
    offset: number,
  ): string {
    const params = new URLSearchParams();
    params.set('action', 'query');
    params.set('generator', 'search');
    params.set('gsrsearch', keywords);
    params.set('gsrnamespace', '6');
    params.set('gsrlimit', limit.toString());
    params.set('gsroffset', offset.toString());
    params.set('prop', 'imageinfo');
    params.set('iiprop', 'url|size|mime|extmetadata');
    params.set(
      'iiextmetadatafilter',
      'LicenseUrl|LicenseShortName|Artist|ImageDescription|DateTimeOriginal|Categories',
    );
    params.set('iiurlwidth', '400');
    params.set('format', 'json');
    params.set('origin', '*');

    return `${API_BASE_URL}?${params.toString()}`;
  }

  private sortPagesByIndex(pages: WikimediaPage[]): WikimediaPage[] {
    return [...pages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }
}

/**
 * Factory function to create a WikimediaAdapter.
 */
export function createWikimediaAdapter(): WikimediaAdapter {
  return new WikimediaAdapter();
}
