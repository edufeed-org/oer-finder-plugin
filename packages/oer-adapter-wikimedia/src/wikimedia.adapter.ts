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
import { parseWikimediaSearchResponse } from './wikimedia.types.js';
import { mapWikimediaPageToAmb } from './mappers/wikimedia-to-amb.mapper.js';
import type { WikimediaPage } from './wikimedia.types.js';

const API_BASE_URL = 'https://commons.wikimedia.org/w/api.php';

/** Maximum results per request (anonymous API limit) */
const MAX_RESULTS_PER_REQUEST = 50;

const USER_AGENT =
  'edufeed-oer-finder-plugin/0.0.1 (https://github.com/edufeed-org/oer-finder-plugin)';

/**
 * Maps OER resource types to CirrusSearch filetype keywords.
 * @see https://www.mediawiki.org/wiki/Help:CirrusSearch#filetype
 */
const RESOURCE_TYPE_TO_FILETYPE: Readonly<Record<string, string>> = {
  image: 'bitmap',
  video: 'video',
  audio: 'audio',
};

/**
 * Maps CC license codes to Wikidata Q-IDs for structured data search.
 * Uses Wikidata property P275 (copyright license) with haswbstatement.
 * Multiple Q-IDs per code cover different license versions (4.0, 3.0, 2.0).
 */
const LICENSE_CODE_TO_WIKIDATA_IDS: Readonly<Record<string, readonly string[]>> =
  {
    by: ['Q20007257', 'Q14947546', 'Q19125045'],
    'by-sa': ['Q18199165', 'Q14946043', 'Q19068220'],
    'by-nc': ['Q34179348'],
    'by-nd': ['Q36795408'],
    'by-nc-sa': ['Q42553662'],
    'by-nc-nd': ['Q65071940'],
    cc0: ['Q6938433'],
    pdm: ['Q7257026'],
  };

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
    supportedTypes: ['image', 'video', 'audio'],
    supportsLicenseFilter: true,
    supportsEducationalLevelFilter: false,
  };

  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const licenseModifier = this.buildLicenseModifier(query.license);
    if (licenseModifier === null) {
      return EMPTY_RESULT;
    }

    const keywords = query.keywords!.trim();
    const searchTerm = this.buildSearchTerm(
      keywords,
      query.type,
      licenseModifier,
    );
    const pageSize = Math.min(query.pageSize, MAX_RESULTS_PER_REQUEST);
    const offset = (query.page - 1) * pageSize;

    const url = this.buildSearchUrl(searchTerm, pageSize, offset, query.language);

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
    searchTerm: string,
    limit: number,
    offset: number,
    language?: string,
  ): string {
    const params = new URLSearchParams();
    params.set('action', 'query');
    params.set('generator', 'search');
    params.set('gsrsearch', searchTerm);
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
    if (language) {
      params.set('iiextmetadatalanguage', language);
    }
    params.set('format', 'json');
    params.set('origin', '*');

    return `${API_BASE_URL}?${params.toString()}`;
  }

  /**
   * Strip CirrusSearch operator prefixes from user-supplied keywords
   * to prevent filter bypass via keyword injection.
   */
  private sanitizeKeywords(keywords: string): string {
    return keywords.replace(
      /\b(filetype|haswbstatement|intitle|incategory|linksto|hastemplate|insource|morelike|prefer-recent|boost-templates):/gi,
      '',
    );
  }

  /**
   * Build the full search term by appending CirrusSearch modifiers
   * for file type and license filtering to the user's keywords.
   */
  private buildSearchTerm(
    keywords: string,
    type: string | undefined,
    licenseModifier: string,
  ): string {
    const parts = [this.sanitizeKeywords(keywords)];

    const filetype = type ? RESOURCE_TYPE_TO_FILETYPE[type] : undefined;
    if (filetype) {
      parts.push(`filetype:${filetype}`);
    }

    if (licenseModifier) {
      parts.push(licenseModifier);
    }

    return parts.join(' ');
  }

  /**
   * Build a haswbstatement search modifier for the given license URI.
   * Returns empty string if no license filter is requested.
   * Returns null if the license URI is unrecognized (should return empty results).
   */
  private buildLicenseModifier(licenseUri: string | undefined): string | null {
    if (!licenseUri) {
      return '';
    }

    const code = ccLicenseUriToCode(licenseUri);
    if (!code) {
      return null;
    }

    const qIds = LICENSE_CODE_TO_WIKIDATA_IDS[code];
    if (!qIds || qIds.length === 0) {
      return null;
    }

    return `haswbstatement:P275=${qIds.join('|')}`;
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
