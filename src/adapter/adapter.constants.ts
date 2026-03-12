/**
 * Known adapter source IDs. This is the single source of truth for valid
 * adapter identifiers. Used by the DTO layer for input validation and by
 * the loader service for type-safe adapter instantiation.
 *
 * When adding a new adapter, add its ID here first.
 */
export const KNOWN_ADAPTER_IDS = [
  'arasaac',
  'openverse',
  'rpi-virtuell',
  'wikimedia',
] as const;

/**
 * The source name for the internal Nostr database.
 * This is not an adapter — it routes to a direct database query in OerQueryService.
 */
export const NOSTR_SOURCE_ID = 'nostr' as const;

/**
 * All valid source IDs accepted by the API: adapters + internal sources.
 */
export const ALL_SOURCE_IDS = [...KNOWN_ADAPTER_IDS, NOSTR_SOURCE_ID] as const;

export type AllSourceId = (typeof ALL_SOURCE_IDS)[number];

export type KnownAdapterId = (typeof KNOWN_ADAPTER_IDS)[number];
