/**
 * Nostr AMB Relay API types
 * Based on the amb-relay search relay for AMB (Allgemeines Metadatenprofil für Bildungsressourcen)
 * @see https://github.com/edufeed-org/amb-relay
 */
import * as v from 'valibot';

/**
 * Kind 30142: AMB (General Media Data Profile for Educational Resources) Event
 */
export const EVENT_AMB_KIND = 30142;

/**
 * Valibot schema for Nostr event tag
 */
export const NostrEventTagSchema = v.array(v.string());

/**
 * Valibot schema for a Nostr event from the amb-relay
 */
export const NostrAmbEventSchema = v.object({
  /** Event ID (hex-encoded sha256 hash) */
  id: v.string(),
  /** Public key of the event author (hex-encoded) */
  pubkey: v.string(),
  /** Unix timestamp in seconds */
  created_at: v.number(),
  /** Event kind (30142 for AMB) */
  kind: v.number(),
  /** Event tags containing metadata */
  tags: v.array(NostrEventTagSchema),
  /** Event content (usually empty for AMB events) */
  content: v.string(),
  /** Schnorr signature */
  sig: v.string(),
});

/**
 * Nostr AMB event type
 */
export type NostrAmbEvent = v.InferOutput<typeof NostrAmbEventSchema>;

/**
 * Parses and validates a Nostr AMB event.
 * Throws a ValiError if the event doesn't match the expected schema.
 */
export function parseNostrAmbEvent(data: unknown): NostrAmbEvent {
  return v.parse(NostrAmbEventSchema, data);
}

/**
 * Configuration options for the Nostr AMB Relay adapter
 */
export interface NostrAmbRelayConfig {
  /** WebSocket URL of the amb-relay (e.g., 'wss://relay.example.com') */
  relayUrl: string;
  /** Timeout for relay requests in milliseconds (default: 10000) */
  timeoutMs?: number;
}

/**
 * Allowed AMB metadata fields according to AMB JSON Schema.
 * Reference: https://dini-ag-kim.github.io/amb/draft/#json-schema
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
 */
export function filterAmbMetadata(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => ALLOWED_AMB_FIELDS_SET.has(key)),
  );
}
