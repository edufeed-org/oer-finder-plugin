import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
} from '@edufeed-org/oer-adapter-core';
import { parseArasaacSearchResponse } from './arasaac.types.js';
import { mapArasaacPictogramToOerItem } from './arasaac.mapper.js';

/** API base URL */
const API_BASE_URL = 'https://api.arasaac.org/api';

/** Image base URL */
const IMAGE_BASE_URL = 'https://static.arasaac.org/pictograms';

/** Default language for searches when not specified in query */
const DEFAULT_LANGUAGE = 'en';

/**
 * ARASAAC adapter for searching AAC pictograms.
 *
 * ARASAAC (Aragonese Portal of Augmentative and Alternative Communication)
 * provides free pictographic resources for communication support.
 *
 * API Documentation: https://beta.arasaac.org/developers/api
 * License: CC BY-NC-SA 4.0
 */
export class ArasaacAdapter implements SourceAdapter {
  readonly sourceId = 'arasaac';
  readonly sourceName = 'ARASAAC';

  /**
   * Search for pictograms matching the query.
   *
   * ARASAAC API endpoint: GET /pictograms/{locale}/search/{searchText}
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    const keywords = query.keywords?.trim();
    if (!keywords) {
      return { items: [], total: 0 };
    }

    const language = query.language ?? DEFAULT_LANGUAGE;
    const encodedKeywords = encodeURIComponent(keywords);
    const url = `${API_BASE_URL}/pictograms/${language}/search/${encodedKeywords}`;

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
        `ARASAAC API error: ${response.status} ${response.statusText}`,
      );
    }

    const rawData: unknown = await response.json();
    const pictograms = parseArasaacSearchResponse(rawData);

    // Apply pagination to the results
    const total = pictograms.length;
    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize;
    const paginatedPictograms = pictograms.slice(start, end);

    const items = paginatedPictograms.map((pictogram) =>
      mapArasaacPictogramToOerItem(pictogram, IMAGE_BASE_URL, language),
    );

    return { items, total };
  }
}

/**
 * Factory function to create an ArasaacAdapter.
 */
export function createArasaacAdapter(): ArasaacAdapter {
  return new ArasaacAdapter();
}
