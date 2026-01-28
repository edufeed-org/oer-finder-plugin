import type {
  ExternalOerItem,
  AmbMetadata,
  ImageUrls,
} from '@edufeed-org/oer-adapter-core';
import type { RpiMaterialPost } from '../rpi-virtuell.types.js';

/**
 * Extract keywords from the material's tags.
 */
export function extractKeywords(material: RpiMaterialPost): string[] {
  const tags = material.tags?.tag?.nodes;
  if (!tags || tags.length === 0) {
    return [];
  }
  return tags.map((tag) => tag.name.toLowerCase());
}

/**
 * Extract learning resource types from the material.
 */
export function extractLearningResourceTypes(
  material: RpiMaterialPost,
): string[] {
  const types = material.learningresourcetypes?.learningresourcetype?.nodes;
  if (!types || types.length === 0) {
    return [];
  }
  return types.map((type) => type.name);
}

/**
 * Extract educational levels from the material.
 */
export function extractEducationalLevels(material: RpiMaterialPost): string[] {
  const levels = material.educationallevels?.educationallevel?.nodes;
  if (!levels || levels.length === 0) {
    return [];
  }
  return levels.map((level) => level.name);
}

/**
 * Build image URLs from the material's image data.
 */
export function buildImageUrls(material: RpiMaterialPost): ImageUrls | null {
  const image = material.image;
  if (!image) {
    return null;
  }

  // Try to get the best available image URL
  const highRes =
    image.url ??
    image.altimages?.altimage?.node?.url ??
    image.altimages?.altimage?.node?.localurl;

  if (!highRes) {
    return null;
  }

  // RPI-Virtuell doesn't provide different resolutions, so we use the same URL
  return {
    high: highRes,
    medium: highRes,
    small: highRes,
  };
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string | null | undefined): string | undefined {
  if (!html) {
    return undefined;
  }
  // Remove HTML tags and decode common entities
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Map an RPI-Virtuell material to the AMB-based ExternalOerItem format.
 */
export function mapRpiMaterialToAmb(material: RpiMaterialPost): ExternalOerItem {
  const id = material.import_id?.toString() ?? material.url ?? '';
  const title = material.post?.title ?? undefined;
  const description =
    stripHtml(material.post?.excerpt) ??
    stripHtml(material.post?.content) ??
    undefined;
  const keywords = extractKeywords(material);
  const learningResourceTypes = extractLearningResourceTypes(material);
  const educationalLevels = extractEducationalLevels(material);
  const imageUrls = buildImageUrls(material);
  const imageUrl = imageUrls?.high ?? undefined;
  const resourceUrl = material.url ?? undefined;
  const datePublished = material.date ?? undefined;

  // Build AMB metadata
  const amb: AmbMetadata = {
    '@context': 'https://w3id.org/kim/amb/context.jsonld',
    id: resourceUrl,
    type: ['LearningResource'],
    name: title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    inLanguage: ['de'],
    image: imageUrl,
    datePublished,
    isAccessibleForFree: true,
    // RPI-Virtuell materials are typically openly licensed
    license: {
      id: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    learningResourceType:
      learningResourceTypes.length > 0
        ? learningResourceTypes.map((type) => ({
            '@type': 'DefinedTerm',
            name: type,
          }))
        : undefined,
    educationalLevel:
      educationalLevels.length > 0
        ? educationalLevels.map((level) => ({
            '@type': 'DefinedTerm',
            name: level,
          }))
        : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'RPI-Virtuell',
      url: 'https://rpi-virtuell.de',
    },
  };

  return {
    id,
    amb,
    extensions: {
      images: imageUrls,
      foreignLandingUrl: resourceUrl,
      attribution: material.image?.source ?? null,
    },
  };
}
