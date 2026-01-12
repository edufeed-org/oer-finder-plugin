/**
 * AMB (Allgemeines Metadatenprofil für Bildungsressourcen) metadata utilities.
 *
 * Defines allowed top-level fields for AMB metadata and provides
 * a filter function to strip non-AMB fields.
 *
 * Reference: https://dini-ag-kim.github.io/amb/draft/#json-schema
 */

/**
 * Allowed top-level field names according to AMB JSON Schema.
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

const ALLOWED_AMB_FIELDS_SET: ReadonlySet<string> = new Set(ALLOWED_AMB_FIELDS);

/**
 * Filters parsed metadata to only include allowed AMB fields.
 * Strips non-AMB fields like Nostr-specific tags ('d', 'e', 't', 'p', etc).
 *
 * @param raw - Raw parsed metadata
 * @returns Filtered metadata containing only AMB-compliant fields
 */
export function filterAmbMetadata(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => ALLOWED_AMB_FIELDS_SET.has(key)),
  );
}
