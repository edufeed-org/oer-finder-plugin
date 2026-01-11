import type { ExternalOerItem, AmbMetadata, ImageUrls } from '@edufeed-org/oer-adapter-core';
import type { ArasaacPictogram } from '../arasaac.types.js';

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
 * ARASAAC provides images at various sizes: 2500px, 500px, and 300px.
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
 * Get the primary keyword for use as the resource name.
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
 * Map an ARASAAC pictogram to AMB format.
 */
export function mapArasaacPictogramToAmb(
  pictogram: ArasaacPictogram,
  imageBaseUrl: string,
  language: string,
): ExternalOerItem {
  const primaryKeyword = getPrimaryKeyword(pictogram);
  const keywords = extractKeywords(pictogram);
  const imageUrls = buildImageUrls(pictogram._id, imageBaseUrl);
  const landingUrl = `${ARASAAC_WEB_BASE_URL}/${language}/${pictogram._id}`;
  const attribution =
    language === 'de' ? ARASAAC_ATTRIBUTION_DE : ARASAAC_ATTRIBUTION_EN;

  // Build AMB metadata
  const amb: AmbMetadata = {
    id: imageUrls.medium, // Resource URL per Schema.org standard
    type: ['LearningResource', 'ImageObject'],
    name: primaryKeyword ?? undefined,
    keywords,
    license: {
      id: ARASAAC_LICENSE_URI,
    },
    isAccessibleForFree: true,
    inLanguage: [language],
    creator: [
      {
        type: 'Organization',
        name: 'Sergio Palao / ARASAAC',
        url: 'https://arasaac.org',
      },
    ],
    publisher: [
      {
        type: 'Organization',
        name: 'Government of Aragon',
        url: 'https://www.aragon.es',
      },
    ],
    learningResourceType: [
      {
        id: 'http://w3id.org/kim/hcrt/pictogram',
        prefLabel: {
          en: 'Pictogram',
          de: 'Piktogramm',
        },
      },
    ],
    encoding: [
      {
        type: 'MediaObject',
        contentUrl: imageUrls.high,
        encodingFormat: 'image/png',
        width: '2500',
        height: '2500',
      },
      {
        type: 'MediaObject',
        contentUrl: imageUrls.medium,
        encodingFormat: 'image/png',
        width: '500',
        height: '500',
      },
      {
        type: 'MediaObject',
        contentUrl: imageUrls.small,
        encodingFormat: 'image/png',
        width: '300',
        height: '300',
      },
    ],
  };

  // Add optional date fields if available
  if (pictogram.created) {
    amb.dateCreated = pictogram.created;
  }
  if (pictogram.lastUpdated) {
    amb.dateModified = pictogram.lastUpdated;
  }

  return {
    id: `arasaac-${pictogram._id}`,
    amb,
    extensions: {
      images: imageUrls,
      foreign_landing_url: landingUrl,
      attribution,
    },
  };
}
