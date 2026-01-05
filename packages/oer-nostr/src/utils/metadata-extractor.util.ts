import {
  parseColonSeparatedTags,
  findTagValue,
  extractTagValues,
  parseBoolean,
  parseBigInt,
} from './tag-parser.util';
import { createDateFields } from './date-parser.util';
import { filterAmbMetadata } from '../schemas/amb-metadata.schema';
import type { NostrEventData } from '../schemas/nostr-event.schema';
import type {
  AmbMetadata,
  FileMetadataFields,
  LicenseInfo,
} from '../types/extraction.types';

/**
 * Extracts the 'id' field from a nested object in AMB metadata.
 * Used to extract URIs like educationalLevel.id and audience.id.
 * Returns null if the field is missing, null, or malformed.
 *
 * @param metadata - The AMB metadata object
 * @param fieldName - The name of the nested field (e.g., 'educationalLevel', 'audience')
 * @returns The extracted ID string or null
 */
export function extractNestedId(
  metadata: Record<string, unknown>,
  fieldName: string,
): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const nestedField = metadata[fieldName];
  if (!nestedField || typeof nestedField !== 'object') {
    return null;
  }

  const id = (nestedField as Record<string, unknown>).id;
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }

  return null;
}

/**
 * Extracts license information from event tags.
 *
 * @param tags - Event tags array
 * @returns License information
 */
export function extractLicenseInfo(tags: string[][]): LicenseInfo {
  const uri = findTagValue(tags, 'license:id');
  const freeToUseStr = findTagValue(tags, 'isAccessibleForFree');
  const freeToUse = parseBoolean(freeToUseStr);

  return {
    uri,
    freeToUse,
  };
}

/**
 * Extracts keywords from 't' tags.
 *
 * @param tags - Event tags array
 * @returns Array of keywords or null if none found
 */
export function extractKeywords(tags: string[][]): string[] | null {
  const keywords = extractTagValues(tags, 't');
  return keywords.length > 0 ? keywords : null;
}

/**
 * Normalizes the inLanguage field to always be an array.
 * If it's a string, wraps it in an array. If it's already an array, returns as-is.
 * If it's missing or invalid, returns null to remove it from metadata.
 *
 * @param value - The inLanguage value from metadata
 * @returns Array of language codes or null
 */
export function normalizeInLanguage(value: unknown): string[] | null {
  // If it's already an array, return as-is
  if (Array.isArray(value)) {
    return value.length > 0 ? value : null;
  }

  // If it's a string, wrap it in an array
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  // Otherwise, return null to remove from metadata
  return null;
}

/**
 * Extracts all AMB metadata from a Nostr event data into a structured object.
 *
 * @param nostrEventData - The kind 30142 (AMB) event data to extract from
 * @returns AMB metadata object
 */
export function extractAmbMetadata(
  nostrEventData: NostrEventData,
): AmbMetadata {
  // Extract URL from "d" tag (the resource URL)
  const url = findTagValue(nostrEventData.tags, 'd');

  // Parse all tags to create nested JSON metadata structure
  // Then filter to only include AMB-compliant fields (strips Nostr-specific tags like d, e, t)
  const rawParsedMetadata = parseColonSeparatedTags(nostrEventData.tags);
  const parsedMetadata = filterAmbMetadata(rawParsedMetadata);

  // Normalize inLanguage field to always be an array
  const normalizedLanguage = normalizeInLanguage(parsedMetadata.inLanguage);
  if (normalizedLanguage !== null) {
    parsedMetadata.inLanguage = normalizedLanguage;
  } else {
    delete parsedMetadata.inLanguage;
  }

  // Extract URI fields from AMB metadata
  const educationalLevelUri = extractNestedId(
    parsedMetadata,
    'educationalLevel',
  );
  const audienceUri = extractNestedId(parsedMetadata, 'audience');

  // Extract and parse date fields from AMB metadata
  const dates = createDateFields(
    parsedMetadata.dateCreated,
    parsedMetadata.datePublished,
    parsedMetadata.dateModified,
  );

  // Extract license information
  const license = extractLicenseInfo(nostrEventData.tags);

  // Extract keywords from "t" tags
  const keywords = extractKeywords(nostrEventData.tags);

  // Extract file event reference (first 'e' tag pointing to a kind 1063 event)
  const fileEventId = findTagValue(nostrEventData.tags, 'e');

  return {
    url,
    parsedMetadata,
    educationalLevelUri,
    audienceUri,
    dates,
    license,
    keywords,
    fileEventId,
  };
}

/**
 * Extracts file metadata fields from a kind 1063 (File) Nostr event data.
 * This is a pure function that performs no I/O operations.
 *
 * @param fileEventData - The kind 1063 (File) event data to extract from
 * @returns File metadata fields
 */
export function extractFileMetadataFields(
  fileEventData: NostrEventData,
): FileMetadataFields {
  const mimeType = findTagValue(fileEventData.tags, 'm');
  const dim = findTagValue(fileEventData.tags, 'dim');
  const sizeStr = findTagValue(fileEventData.tags, 'size');
  const size = parseBigInt(sizeStr);
  const alt = findTagValue(fileEventData.tags, 'alt');
  const description =
    findTagValue(fileEventData.tags, 'description') ||
    (fileEventData.content ? fileEventData.content : null);

  return {
    mimeType,
    dim,
    size,
    alt,
    description,
  };
}
