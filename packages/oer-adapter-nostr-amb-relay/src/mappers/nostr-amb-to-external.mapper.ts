import {
  type ExternalOerItem,
  type AmbMetadata,
  filterAmbMetadata,
} from '@edufeed-org/oer-adapter-core';
import type { NostrAmbEvent } from '../nostr-amb-relay.types.js';
import {
  parseColonSeparatedTags,
  findTagValue,
  extractTagValues,
  parseBoolean,
} from '../utils/tag-parser.util.js';

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
