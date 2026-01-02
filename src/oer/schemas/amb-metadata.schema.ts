/**
 * AMB (Allgemeines Metadatenprofil für Bildungsressourcen) metadata schema.
 *
 * This module defines the allowed top-level fields for AMB metadata
 * and provides a filter function to strip non-AMB fields (like Nostr-specific tags).
 *
 * Reference: https://dini-ag-kim.github.io/amb/draft/#json-schema
 */

/**
 * Allowed top-level field names according to AMB JSON Schema.
 * Only first-layer validation - nested objects are passed through as-is.
 */
export const ALLOWED_AMB_FIELDS = [
  'id',
  'type',
  'name',
  'description',
  'about',
  'keywords',
  'inLanguage',
  'image',
  'trailer',
  'creator',
  'contributor',
  'publisher',
  'funder',
  'dateCreated',
  'datePublished',
  'dateModified',
  'license',
  'conditionsOfAccess',
  'isAccessibleForFree',
  'learningResourceType',
  'audience',
  'educationalLevel',
  'interactivityType',
  'teaches',
  'assesses',
  'competencyRequired',
  'isBasedOn',
  'isPartOf',
  'hasPart',
  'mainEntityOfPage',
  'duration',
  'encoding',
  'caption',
] as const;

/**
 * Type for allowed AMB field names.
 */
export type AllowedAmbField = (typeof ALLOWED_AMB_FIELDS)[number];

/**
 * Set for O(1) lookup of allowed fields.
 */
const ALLOWED_AMB_FIELDS_SET: ReadonlySet<string> = new Set(ALLOWED_AMB_FIELDS);

/**
 * Filters parsed metadata to only include allowed AMB fields.
 * Strips Nostr-specific tags like 'd', 'e', 't', 'p' etc.
 *
 * Only validates first-layer keys - nested objects are passed through unchanged.
 *
 * @param raw - Raw parsed metadata from Nostr event tags
 * @returns Filtered metadata containing only AMB-compliant fields
 */
export function filterAmbMetadata(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => ALLOWED_AMB_FIELDS_SET.has(key)),
  );
}
