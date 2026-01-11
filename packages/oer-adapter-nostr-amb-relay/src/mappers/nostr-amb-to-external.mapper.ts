import type {
  ExternalOerItem,
  AmbMetadata,
} from '@edufeed-org/oer-adapter-core';
import type { NostrAmbEvent } from '../nostr-amb-relay.types.js';
import { filterAmbMetadata } from '../nostr-amb-relay.types.js';

/**
 * Finds the first value for a given tag name.
 *
 * @param tags - Event tags array
 * @param tagName - Tag name to search for
 * @returns First value for the tag or null
 */
function findTagValue(tags: string[][], tagName: string): string | null {
  const tag = tags.find((t) => t[0] === tagName);
  return tag && tag.length > 1 ? tag[1] : null;
}

/**
 * Extracts all values for a given tag name.
 *
 * @param tags - Event tags array
 * @param tagName - Tag name to search for
 * @returns Array of values for the tag
 */
function extractTagValues(tags: string[][], tagName: string): string[] {
  return tags.filter((t) => t[0] === tagName && t.length > 1).map((t) => t[1]);
}

/**
 * Parses colon-separated tags into a nested object structure.
 * For example, ["license:id", "https://..."] becomes { license: { id: "https://..." } }
 *
 * @param tags - Event tags array
 * @returns Parsed metadata object
 */
function parseColonSeparatedTags(tags: string[][]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const tag of tags) {
    if (tag.length < 2) continue;

    const [key, value] = tag;
    const parts = key.split(':');

    if (parts.length === 1) {
      // Simple tag like ["name", "Resource Name"]
      result[key] = value;
    } else {
      // Nested tag like ["license:id", "https://..."]
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
    }
  }

  return result;
}

/**
 * Parses a boolean string value.
 *
 * @param value - String value to parse
 * @returns Boolean value or null
 */
function parseBoolean(value: string | null): boolean | null {
  if (value === null) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * Normalizes the inLanguage field to always be an array.
 *
 * @param value - The inLanguage value from metadata
 * @returns Array of language codes or undefined
 */
function normalizeInLanguage(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : undefined;
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return undefined;
}

/**
 * Map a Nostr AMB event to an ExternalOerItem.
 *
 * @param event - Nostr AMB event (kind 30142)
 * @returns ExternalOerItem with AMB metadata
 */
export function mapNostrAmbEventToExternalOerItem(
  event: NostrAmbEvent,
): ExternalOerItem {
  // Extract URL from "d" tag (the resource URL / identifier)
  const resourceUrl = findTagValue(event.tags, 'd');

  // Parse all tags to create nested JSON metadata structure
  const rawParsedMetadata = parseColonSeparatedTags(event.tags);

  // Filter to only include AMB-compliant fields
  const parsedMetadata = filterAmbMetadata(rawParsedMetadata);

  // Extract keywords from "t" tags
  const keywords = extractTagValues(event.tags, 't');

  // Extract license info
  const licenseId = findTagValue(event.tags, 'license:id');
  const isAccessibleForFree = parseBoolean(
    findTagValue(event.tags, 'isAccessibleForFree'),
  );

  // Normalize inLanguage to array
  const inLanguage = normalizeInLanguage(parsedMetadata.inLanguage);

  // Extract image URL from tags or metadata
  const imageUrl =
    findTagValue(event.tags, 'image') ??
    (typeof parsedMetadata.image === 'string' ? parsedMetadata.image : null);

  // Build AMB metadata
  const amb: AmbMetadata = {
    '@context': 'https://w3id.org/kim/amb/context.jsonld',
    id: resourceUrl ?? undefined,
    type: parsedMetadata.type as string | string[] | undefined,
    name: parsedMetadata.name as string | undefined,
    description: parsedMetadata.description as string | undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    inLanguage,
    image: imageUrl ?? undefined,
    creator: parsedMetadata.creator,
    contributor: parsedMetadata.contributor,
    publisher: parsedMetadata.publisher,
    funder: parsedMetadata.funder,
    dateCreated: parsedMetadata.dateCreated as string | undefined,
    datePublished: parsedMetadata.datePublished as string | undefined,
    dateModified: parsedMetadata.dateModified as string | undefined,
    license: licenseId ? { id: licenseId } : undefined,
    conditionsOfAccess: parsedMetadata.conditionsOfAccess,
    isAccessibleForFree: isAccessibleForFree ?? undefined,
    learningResourceType: parsedMetadata.learningResourceType,
    audience: parsedMetadata.audience,
    educationalLevel: parsedMetadata.educationalLevel,
    interactivityType: parsedMetadata.interactivityType,
    teaches: parsedMetadata.teaches,
    assesses: parsedMetadata.assesses,
    competencyRequired: parsedMetadata.competencyRequired,
    isBasedOn: parsedMetadata.isBasedOn,
    isPartOf: parsedMetadata.isPartOf,
    hasPart: parsedMetadata.hasPart,
    mainEntityOfPage: parsedMetadata.mainEntityOfPage,
    duration: parsedMetadata.duration as string | undefined,
    encoding: parsedMetadata.encoding,
    caption: parsedMetadata.caption,
    about: parsedMetadata.about,
    trailer: parsedMetadata.trailer,
  };

  // Clean up undefined values
  const cleanedAmb = Object.fromEntries(
    Object.entries(amb).filter(([, v]) => v !== undefined),
  ) as AmbMetadata;

  return {
    id: `nostr-amb-${event.id}`,
    amb: cleanedAmb,
    extensions: {
      images: imageUrl
        ? {
            high: imageUrl,
            medium: imageUrl,
            small: imageUrl,
          }
        : null,
      foreign_landing_url: resourceUrl,
      attribution: null,
    },
  };
}
