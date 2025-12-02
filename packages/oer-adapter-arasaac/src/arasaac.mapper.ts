import type { ExternalOerItem, ImageUrls, Creator } from '@edufeed-org/oer-adapter-core';
import type { ArasaacPictogram } from './arasaac.types.js';

/** ARASAAC Creative Commons BY-NC-SA license URL */
const ARASAAC_LICENSE_URI = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';

/** Base URL for ARASAAC pictogram detail pages */
const ARASAAC_WEB_BASE_URL = 'https://arasaac.org/pictograms';

/** ARASAAC attribution notice as required by their license */
const ARASAAC_ATTRIBUTION_EN =
  'Pictograms author: Sergio Palao. Origin: ARASAAC (http://www.arasaac.org). License: CC (BY-NC-SA). Owner: Government of Aragon (Spain)';

const ARASAAC_ATTRIBUTION_DE =
  'Piktogramm-Urheber Sergio Palao. Herkunft: ARASAAC (http://www.arasaac.org). Lizenz: CC (BY-NC-SA). Eigentümer: Regierung von Aragon (Spanien)';

/**
 * Build image URLs for a pictogram at different resolutions.
 * ARASAAC provides images at various sizes: 500px, 300px, and smaller.
 */
export function buildImageUrls(
  pictogramId: number,
  imageBaseUrl: string,
): ImageUrls {
  return {
    high: `${imageBaseUrl}/${pictogramId}/${pictogramId}_2500.png`,
    medium: `${imageBaseUrl}/${pictogramId}/${pictogramId}_500.png`,
    small: `${imageBaseUrl}/${pictogramId}/${pictogramId}_300.png`,
  };
}

/**
 * Extract keywords from the pictogram's keyword array.
 */
export function extractKeywords(pictogram: ArasaacPictogram): string[] {
  const keywordsSet = new Set<string>();

  for (const kw of pictogram.keywords) {
    if (kw.keyword) {
      keywordsSet.add(kw.keyword.toLowerCase());
    }
    if (kw.plural) {
      keywordsSet.add(kw.plural.toLowerCase());
    }
  }

  for (const tag of pictogram.tags) {
    keywordsSet.add(tag.toLowerCase());
  }

  return Array.from(keywordsSet);
}

/**
 * Get the primary keyword for use as description.
 */
export function getPrimaryKeyword(pictogram: ArasaacPictogram): string | null {
  if (pictogram.keywords.length > 0) {
    return pictogram.keywords[0].keyword;
  }
  if (pictogram.tags.length > 0) {
    return pictogram.tags[0];
  }
  return null;
}

/**
 * Build creator information for ARASAAC pictograms.
 * ARASAAC pictograms are created by the ARASAAC organization.
 */
export function buildCreators(): Creator[] {
  return [
    {
      type: 'organization',
      name: 'ARASAAC - Gobierno de Aragón',
      link: 'https://arasaac.org',
    },
  ];
}

/**
 * Map an ARASAAC pictogram to the ExternalOerItem format.
 */
export function mapArasaacPictogramToOerItem(
  pictogram: ArasaacPictogram,
  imageBaseUrl: string,
  language: string,
): ExternalOerItem {
  const primaryKeyword = getPrimaryKeyword(pictogram);
  const keywords = extractKeywords(pictogram);

  const attribution =
    language === 'de' ? ARASAAC_ATTRIBUTION_DE : ARASAAC_ATTRIBUTION_EN;

  return {
    id: `arasaac-${pictogram._id}`,
    url: `${ARASAAC_WEB_BASE_URL}/${language}/${pictogram._id}`,
    name: primaryKeyword,
    description: null,
    attribution,
    keywords,
    license_uri: ARASAAC_LICENSE_URI,
    free_to_use: true,
    file_mime_type: 'image/png',
    file_size: null,
    file_dim: '500x500',
    file_alt: primaryKeyword,
    images: buildImageUrls(pictogram._id, imageBaseUrl),
    creators: buildCreators(),
  };
}
