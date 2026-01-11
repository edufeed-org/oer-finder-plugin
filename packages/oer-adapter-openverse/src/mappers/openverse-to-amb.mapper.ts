import type { ExternalOerItem, AmbMetadata, ImageUrls } from '@edufeed-org/oer-adapter-core';
import type { OpenverseImage } from '../openverse.types.js';

/**
 * Map Openverse license codes to full Creative Commons license URLs.
 * Openverse uses short codes like "by", "by-sa", etc.
 */
function buildLicenseUri(license: string, version: string | null): string {
  const normalizedLicense = license.toLowerCase();
  const licenseVersion = version ?? '4.0';

  // Handle public domain marks
  if (normalizedLicense === 'pdm' || normalizedLicense === 'public-domain') {
    return 'https://creativecommons.org/publicdomain/mark/1.0/';
  }

  // Handle CC0 (public domain dedication)
  if (normalizedLicense === 'cc0') {
    return 'https://creativecommons.org/publicdomain/zero/1.0/';
  }

  // Handle standard CC licenses
  const ccLicenses = ['by', 'by-sa', 'by-nc', 'by-nd', 'by-nc-sa', 'by-nc-nd'];
  if (ccLicenses.includes(normalizedLicense)) {
    return `https://creativecommons.org/licenses/${normalizedLicense}/${licenseVersion}/`;
  }

  // Fallback: return a generic URL
  return `https://creativecommons.org/licenses/${normalizedLicense}/${licenseVersion}/`;
}

/**
 * Build image URLs at different resolutions.
 * Openverse provides a thumbnail URL and the original URL.
 */
export function buildImageUrls(image: OpenverseImage): ImageUrls {
  const highRes = image.url;
  const thumbnail = image.thumbnail ?? image.url;

  return {
    high: highRes,
    medium: thumbnail,
    small: thumbnail,
  };
}

/**
 * Extract keywords from the image's tags.
 */
export function extractKeywords(image: OpenverseImage): string[] {
  if (!image.tags || image.tags.length === 0) {
    return [];
  }

  return image.tags.map((tag) => tag.name.toLowerCase());
}

/**
 * Map file extension to MIME type.
 */
function getMimeType(filetype: string | null | undefined): string {
  if (!filetype) {
    return 'image/jpeg'; // Default assumption for images
  }

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  };

  return mimeTypes[filetype.toLowerCase()] ?? `image/${filetype.toLowerCase()}`;
}

/**
 * Determine if the image is free to use based on license.
 * All Openverse content should be openly licensed.
 */
function isFreeToUse(license: string): boolean {
  const freeLicenses = [
    'cc0',
    'pdm',
    'public-domain',
    'by',
    'by-sa',
    'by-nc',
    'by-nd',
    'by-nc-sa',
    'by-nc-nd',
  ];
  return freeLicenses.includes(license.toLowerCase());
}

/**
 * Map an Openverse image to AMB format.
 */
export function mapOpenverseImageToAmb(
  image: OpenverseImage,
): ExternalOerItem {
  const keywords = extractKeywords(image);
  const licenseUri = buildLicenseUri(image.license, image.license_version);
  const imageUrls = buildImageUrls(image);
  const mimeType = getMimeType(image.filetype);

  // Build AMB metadata
  const amb: AmbMetadata = {
    id: image.url, // Resource URL per Schema.org standard
    type: ['LearningResource', 'ImageObject'],
    name: image.title ?? undefined,
    keywords,
    license: {
      id: licenseUri,
    },
    isAccessibleForFree: isFreeToUse(image.license),
    learningResourceType: [
      {
        id: 'http://w3id.org/kim/hcrt/image',
        prefLabel: {
          en: 'Image',
          de: 'Bild',
        },
      },
    ],
    encoding: [
      {
        type: 'MediaObject',
        contentUrl: image.url,
        encodingFormat: mimeType,
        ...(image.width && { width: image.width.toString() }),
        ...(image.height && { height: image.height.toString() }),
        ...(image.filesize && { contentSize: image.filesize.toString() }),
      },
    ],
  };

  // Add creator if available
  if (image.creator) {
    amb.creator = [
      {
        type: 'Person',
        name: image.creator,
        ...(image.creator_url && { url: image.creator_url }),
      },
    ];
  }

  // Add publisher if source/provider available
  if (image.source || image.provider) {
    amb.publisher = [
      {
        type: 'Organization',
        name: image.source ?? image.provider,
      },
    ];
  }

  return {
    id: `openverse-${image.id}`,
    amb,
    extensions: {
      images: imageUrls,
      foreign_landing_url: image.foreign_landing_url,
      attribution: image.attribution ?? null,
    },
  };
}
