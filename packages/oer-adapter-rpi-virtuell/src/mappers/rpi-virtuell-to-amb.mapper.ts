import type {
  ExternalOerItem,
  AmbMetadata,
  ImageUrls,
} from '@edufeed-org/oer-adapter-core';
import { AMB_CONTEXT_URL, buildExternalOerId } from '@edufeed-org/oer-adapter-core';
import type { RpiMaterialPost } from '../rpi-virtuell.types.js';

/**
 * Extract keywords from the material's tags.
 */
export function extractKeywords(material: RpiMaterialPost): string[] {
  const tags = material.tags?.tag;
  if (!tags || tags.length === 0) {
    return [];
  }
  return tags.map((tag) => tag.name.toLowerCase());
}

/**
 * HCRT (Hochschulcampus Ressourcentypen) vocabulary entry.
 * Uses http:// (not https://) to match existing project convention.
 */
export interface HcrtEntry {
  readonly id: string;
  readonly prefLabel: {
    readonly en: string;
    readonly de: string;
  };
}

/**
 * Maps RPI-Virtuell German medientyp names to HCRT vocabulary entries.
 */
const MEDIENTYP_TO_HCRT: Readonly<Record<string, HcrtEntry>> = {
  Bild: {
    id: 'http://w3id.org/kim/hcrt/image',
    prefLabel: { en: 'Image', de: 'Bild' },
  },
  Video: {
    id: 'http://w3id.org/kim/hcrt/video',
    prefLabel: { en: 'Video', de: 'Video' },
  },
  Audio: {
    id: 'http://w3id.org/kim/hcrt/audio',
    prefLabel: { en: 'Audio Recording', de: 'Audio' },
  },
  Podcast: {
    id: 'http://w3id.org/kim/hcrt/audio',
    prefLabel: { en: 'Audio Recording', de: 'Audio' },
  },
  'PDF-Dokument': {
    id: 'http://w3id.org/kim/hcrt/text',
    prefLabel: { en: 'Text', de: 'Textdokument' },
  },
  'Text/Aufsatz': {
    id: 'http://w3id.org/kim/hcrt/text',
    prefLabel: { en: 'Text', de: 'Textdokument' },
  },
  Arbeitsblatt: {
    id: 'http://w3id.org/kim/hcrt/worksheet',
    prefLabel: { en: 'Worksheet', de: 'Arbeitsmaterial' },
  },
  'E-Learning': {
    id: 'http://w3id.org/kim/hcrt/web_page',
    prefLabel: { en: 'Web Page', de: 'Webseite' },
  },
  Fachinformation: {
    id: 'http://w3id.org/kim/hcrt/text',
    prefLabel: { en: 'Text', de: 'Textdokument' },
  },
  Unterrichtsentwurf: {
    id: 'http://w3id.org/kim/hcrt/lesson_plan',
    prefLabel: { en: 'Lesson Plan', de: 'Unterrichtsplanung' },
  },
  Präsentation: {
    id: 'http://w3id.org/kim/hcrt/slide',
    prefLabel: { en: 'Presentation', de: 'Präsentation' },
  },
};

/**
 * Extract learning resource types from the material and map to HCRT vocabulary.
 * Deduplicates by HCRT id (e.g. Audio + Podcast both map to hcrt/audio).
 * Unknown types are silently skipped.
 */
export function extractLearningResourceTypes(
  material: RpiMaterialPost,
): HcrtEntry[] {
  const types = material.learningresourcetypes?.learningresourcetype;
  if (!types || types.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: HcrtEntry[] = [];

  for (const type of types) {
    const hcrt = MEDIENTYP_TO_HCRT[type.name];
    if (hcrt && !seen.has(hcrt.id)) {
      seen.add(hcrt.id);
      result.push(hcrt);
    }
  }

  return result;
}

/**
 * Extract educational levels from the material.
 */
export function extractEducationalLevels(material: RpiMaterialPost): string[] {
  const levels = material.educationallevels?.educationallevel;
  if (!levels || levels.length === 0) {
    return [];
  }
  return levels.map((level) => level.name);
}

/**
 * Convert a slug to a display name.
 * E.g., "horst-heller" -> "Horst Heller"
 */
function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build a full name from first and last name.
 */
function buildFullName(
  first: string | null | undefined,
  last: string | null | undefined,
): string | null {
  const parts = [first?.trim(), last?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Extract authors from the material (CPT with fallback to interim text field).
 * First tries to get authors from the CPT relationship (autorMeta.materialAutoren).
 * If none found, falls back to the interim text field (herkunft.materialAutorInterim).
 * Returns array of author objects with name for AMB creator field.
 */
export function extractAuthors(
  material: RpiMaterialPost,
): Array<{ '@type': 'Person'; name: string; url?: string }> {
  // Try CPT relationship first
  const authors = material.authors?.authorList?.author;
  if (authors && authors.length > 0) {
    const result: Array<{ '@type': 'Person'; name: string; url?: string }> = [];
    for (const author of authors) {
      // Try to build name from first/last name, fall back to slug
      const fullName = buildFullName(author.name?.first, author.name?.last);
      const name =
        fullName ?? (author.slug ? slugToDisplayName(author.slug) : null);
      if (name) {
        const entry: { '@type': 'Person'; name: string; url?: string } = {
          '@type': 'Person',
          name,
        };
        if (author.link) {
          entry.url = author.link;
        }
        result.push(entry);
      }
    }
    if (result.length > 0) {
      return result;
    }
  }

  // Fallback to interim text field
  const authorInterim = material.origin?.authorInterim?.trim();
  if (authorInterim) {
    return [
      {
        '@type': 'Person' as const,
        name: authorInterim,
      },
    ];
  }

  return [];
}

/**
 * Extract publisher/organisation from the material (CPT with fallback to interim text field).
 * First tries to get organisation from the CPT relationship (organisationMeta.materialOrganisation).
 * If none found, falls back to the interim text field (herkunft.materialOrganisationInterim).
 * Returns organisation object for AMB publisher field, or undefined if none found.
 */
export function extractPublisher(
  material: RpiMaterialPost,
): { '@type': 'Organization'; name: string; url?: string } | undefined {
  // Try CPT relationship first
  const organisations = material.organisations?.organisationList?.organisation;
  if (organisations && organisations.length > 0) {
    const org = organisations[0]; // Use first organisation as publisher
    // Prefer short title, fall back to long title, then slug
    const name =
      org.name?.short?.trim() ||
      org.name?.long?.trim() ||
      (org.slug ? slugToDisplayName(org.slug) : null);
    if (name) {
      const publisher: { '@type': 'Organization'; name: string; url?: string } =
        {
          '@type': 'Organization',
          name,
        };
      if (org.link) {
        publisher.url = org.link;
      }
      return publisher;
    }
  }

  // Fallback to interim text field
  const organisationInterim = material.origin?.organisationInterim?.trim();
  if (organisationInterim) {
    return {
      '@type': 'Organization',
      name: organisationInterim,
    };
  }

  return undefined;
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
    image.altimages?.altimage?.url ??
    image.altimages?.altimage?.localurl;

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
 * Map of RPI-Virtuell license names (or patterns) to standard CC license URLs.
 * The keys are lowercase patterns to match against the license name.
 */
const LICENSE_MAPPINGS: ReadonlyArray<{
  pattern: RegExp;
  url: string;
}> = [
  // Public Domain / CC0
  {
    pattern: /\bcc\s*0\b|public\s*domain/i,
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  // CC BY-NC-ND (most restrictive, check first)
  {
    pattern: /\bcc\s*by[- ]?nc[- ]?nd\b/i,
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  },
  // CC BY-NC-SA
  {
    pattern: /\bcc\s*by[- ]?nc[- ]?sa\b/i,
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
  // CC BY-NC (after NC-SA and NC-ND)
  {
    pattern: /\bcc\s*by[- ]?nc\b|nicht\s*kommerziell/i,
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
  // CC BY-ND
  {
    pattern: /\bcc\s*by[- ]?nd\b/i,
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
  },
  // CC BY-SA
  {
    pattern: /\bcc\s*by[- ]?sa\b/i,
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  // CC BY (most permissive, check last among CC licenses)
  {
    pattern: /\bcc\s*by\b/i,
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
];

/**
 * Extract and map the license from the material to a standard CC license URL.
 * Returns the first matching license URL, or undefined if no license info or no match found.
 */
export function extractLicenseUrl(
  material: RpiMaterialPost,
): string | undefined {
  const licenses = material.licenses?.license;
  if (!licenses || licenses.length === 0) {
    return undefined;
  }

  // Try to find a matching license from all license entries
  for (const license of licenses) {
    const licenseName = license.name;
    for (const mapping of LICENSE_MAPPINGS) {
      if (mapping.pattern.test(licenseName)) {
        return mapping.url;
      }
    }
  }

  // No mapping found
  return undefined;
}

/**
 * Map an RPI-Virtuell material to the AMB-based ExternalOerItem format.
 */
export function mapRpiMaterialToAmb(
  material: RpiMaterialPost,
): ExternalOerItem {
  const rawId = material.import_id?.toString() ?? material.url ?? '';
  const id = buildExternalOerId('rpi-virtuell', rawId);
  const title = material.post?.title ?? undefined;
  const description =
    stripHtml(material.post?.excerpt) ??
    stripHtml(material.post?.content) ??
    undefined;
  const keywords = extractKeywords(material);
  const learningResourceTypes = extractLearningResourceTypes(material);
  const educationalLevels = extractEducationalLevels(material);
  const authors = extractAuthors(material);
  const publisher = extractPublisher(material);
  const imageUrls = buildImageUrls(material);
  const imageUrl = imageUrls?.high ?? undefined;
  const resourceUrl = material.url ?? undefined;
  const datePublished = material.date ?? undefined;
  const licenseUrl = extractLicenseUrl(material);

  // Build AMB metadata
  const amb: AmbMetadata = {
    '@context': AMB_CONTEXT_URL,
    id: resourceUrl,
    type: ['LearningResource'],
    name: title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    inLanguage: ['de'],
    image: imageUrl,
    datePublished,
    isAccessibleForFree: true,
    license: licenseUrl ? { id: licenseUrl } : undefined,
    creator: authors.length > 0 ? authors : undefined,
    learningResourceType:
      learningResourceTypes.length > 0 ? learningResourceTypes : undefined,
    educationalLevel:
      educationalLevels.length > 0
        ? educationalLevels.map((level) => ({
            '@type': 'DefinedTerm',
            name: level,
          }))
        : undefined,
    publisher,
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
