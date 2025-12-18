import type {
  ExternalOerItem,
  ImageUrls,
  Creator,
} from '@edufeed-org/oer-adapter-core';
import type { OpenverseImage } from './openverse.types.js';

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

  // Fallback: return the license as-is or a generic URL
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
 * Build file dimensions string from width and height.
 */
function buildFileDimensions(image: OpenverseImage): string | null {
  if (image.width && image.height) {
    return `${image.width}x${image.height}`;
  }
  return null;
}

/**
 * Map file extension to MIME type.
 */
function getMimeType(filetype: string | null | undefined): string | null {
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
 * Build creator information for Openverse images.
 */
export function buildCreators(image: OpenverseImage): Creator[] {
  if (!image.creator) {
    return [];
  }

  return [
    {
      type: 'person',
      name: image.creator,
      link: image.creator_url ?? null,
    },
  ];
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
 * Map an Openverse image to the ExternalOerItem format.
 */
export function mapOpenverseImageToOerItem(
  image: OpenverseImage,
): ExternalOerItem {
  const keywords = extractKeywords(image);
  const licenseUri = buildLicenseUri(image.license, image.license_version);

  return {
    id: `openverse-${image.id}`,
    url: image.url,
    foreign_landing_url: image.foreign_landing_url,
    name: image.title,
    description: null,
    attribution: image.attribution ?? null,
    keywords,
    license_uri: licenseUri,
    free_to_use: isFreeToUse(image.license),
    file_mime_type: getMimeType(image.filetype),
    file_size: image.filesize ?? null,
    file_dim: buildFileDimensions(image),
    file_alt: image.title,
    images: buildImageUrls(image),
    creators: buildCreators(image),
  };
}
