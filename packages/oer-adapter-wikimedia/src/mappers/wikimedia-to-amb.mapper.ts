import type {
  ExternalOerItem,
  AmbMetadata,
  ImageUrls,
} from '@edufeed-org/oer-adapter-core';
import {
  AMB_CONTEXT_URL,
  buildExternalOerId,
} from '@edufeed-org/oer-adapter-core';
import type {
  WikimediaPage,
  WikimediaExtmetadata,
} from '../wikimedia.types.js';

const WIKIMEDIA_COMMONS_BASE = 'https://commons.wikimedia.org/wiki';

interface AmbMediaTypeInfo {
  readonly schemaType: string;
  readonly hcrtId: string;
  readonly hcrtLabel: { readonly en: string; readonly de: string };
}

const IMAGE_TYPE: AmbMediaTypeInfo = {
  schemaType: 'ImageObject',
  hcrtId: 'http://w3id.org/kim/hcrt/image',
  hcrtLabel: { en: 'Image', de: 'Bild' },
};

const VIDEO_TYPE: AmbMediaTypeInfo = {
  schemaType: 'VideoObject',
  hcrtId: 'http://w3id.org/kim/hcrt/video',
  hcrtLabel: { en: 'Video', de: 'Video' },
};

const AUDIO_TYPE: AmbMediaTypeInfo = {
  schemaType: 'AudioObject',
  hcrtId: 'http://w3id.org/kim/hcrt/audio',
  hcrtLabel: { en: 'Audio', de: 'Audio' },
};

/**
 * Resolve AMB media type info from a MIME type string.
 * Maps image/*, video/*, audio/* (and application/ogg) to their
 * corresponding Schema.org type and HCRT learning resource type.
 */
export function resolveAmbMediaType(mime: string): AmbMediaTypeInfo {
  if (mime.startsWith('video/')) return VIDEO_TYPE;
  if (mime.startsWith('audio/') || mime === 'application/ogg') return AUDIO_TYPE;
  return IMAGE_TYPE;
}

/**
 * Strip "File:" prefix and file extension from a Wikimedia page title.
 * "File:Sunset over mountains.jpg" -> "Sunset over mountains"
 */
export function cleanTitle(rawTitle: string): string {
  const withoutPrefix = rawTitle.replace(/^File:/, '');
  const lastDot = withoutPrefix.lastIndexOf('.');
  if (lastDot > 0) {
    return withoutPrefix.substring(0, lastDot);
  }
  return withoutPrefix;
}

/**
 * Decode common HTML entities that appear in Wikimedia extmetadata.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/**
 * Strip HTML tags from a string and decode entities.
 * Handles unclosed tags (missing closing >) via optional `>?`.
 * Wikimedia extmetadata fields often contain HTML anchor tags and entities.
 */
export function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>?/g, '')).trim();
}

/**
 * Extract categories from pipe-separated string.
 * "Sunsets|Nature|Photographs" -> ["Sunsets", "Nature", "Photographs"]
 */
export function parseCategories(categoriesValue: string): string[] {
  return categoriesValue
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/**
 * Normalize a Wikimedia license URL to include a trailing slash
 * so it matches the CC_LICENSE_URIS format.
 */
export function normalizeLicenseUrl(url: string): string {
  if (url.endsWith('/')) {
    return url;
  }
  return `${url}/`;
}

/**
 * Build image URLs for three resolutions using Wikimedia's thumb URL.
 * If thumburl is not available, falls back to the original URL for all sizes.
 */
export function buildImageUrls(
  originalUrl: string,
  thumbUrl: string | undefined,
): ImageUrls {
  if (!thumbUrl) {
    return {
      high: originalUrl,
      medium: originalUrl,
      small: originalUrl,
    };
  }

  return {
    high: originalUrl,
    medium: thumbUrl,
    small: thumbUrl,
  };
}

function buildLandingUrl(title: string): string {
  return `${WIKIMEDIA_COMMONS_BASE}/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function buildAttribution(
  extmetadata: WikimediaExtmetadata | undefined,
  title: string,
): string {
  const artist = extmetadata?.Artist
    ? stripHtmlTags(extmetadata.Artist.value)
    : 'Unknown author';
  const licenseName = extmetadata?.LicenseShortName
    ? stripHtmlTags(extmetadata.LicenseShortName.value)
    : 'Wikimedia Commons';

  return `"${cleanTitle(title)}" by ${artist}, ${licenseName}, via Wikimedia Commons`;
}

/**
 * Map a Wikimedia Commons page to ExternalOerItem with AMB metadata.
 */
export function mapWikimediaPageToAmb(page: WikimediaPage): ExternalOerItem {
  const imageInfo = page.imageinfo?.[0];
  const extmetadata = imageInfo?.extmetadata;
  const title = cleanTitle(page.title);

  const keywords = extmetadata?.Categories
    ? parseCategories(extmetadata.Categories.value).map((c) => c.toLowerCase())
    : [];

  const rawLicenseUrl = extmetadata?.LicenseUrl?.value;
  const licenseUrl = rawLicenseUrl
    ? normalizeLicenseUrl(rawLicenseUrl)
    : undefined;

  const originalUrl = imageInfo?.url ?? '';
  const imageUrls = buildImageUrls(originalUrl, imageInfo?.thumburl);
  const mimeType = imageInfo?.mime ?? 'image/jpeg';

  const description = extmetadata?.ImageDescription
    ? stripHtmlTags(extmetadata.ImageDescription.value)
    : undefined;

  const artistRaw = extmetadata?.Artist?.value;
  const artistName = artistRaw ? stripHtmlTags(artistRaw) : undefined;

  const landingUrl =
    imageInfo?.descriptionurl ?? buildLandingUrl(page.title);
  const attribution = buildAttribution(extmetadata, page.title);

  const mediaType = resolveAmbMediaType(mimeType);

  const amb: AmbMetadata = {
    '@context': AMB_CONTEXT_URL,
    id: originalUrl,
    type: ['LearningResource', mediaType.schemaType],
    name: title || undefined,
    description: description || undefined,
    keywords,
    license: licenseUrl ? { id: licenseUrl } : undefined,
    isAccessibleForFree: true,
    learningResourceType: [
      {
        id: mediaType.hcrtId,
        prefLabel: mediaType.hcrtLabel,
      },
    ],
    encoding: imageInfo
      ? [
          {
            type: 'MediaObject',
            contentUrl: originalUrl,
            encodingFormat: mimeType,
            ...(imageInfo.width && { width: imageInfo.width.toString() }),
            ...(imageInfo.height && { height: imageInfo.height.toString() }),
            ...(imageInfo.size && { contentSize: imageInfo.size.toString() }),
          },
        ]
      : undefined,
    publisher: [
      {
        type: 'Organization',
        name: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org',
      },
    ],
  };

  if (artistName) {
    amb.creator = [{ type: 'Person', name: artistName }];
  }

  if (extmetadata?.DateTimeOriginal) {
    amb.dateCreated = extmetadata.DateTimeOriginal.value;
  }

  return {
    id: buildExternalOerId('wikimedia', page.pageid),
    amb,
    extensions: {
      images: originalUrl ? imageUrls : null,
      foreignLandingUrl: landingUrl,
      attribution,
    },
  };
}
