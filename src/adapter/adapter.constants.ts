/**
 * Known adapter source IDs. This is the single source of truth for valid
 * adapter identifiers. Used by the DTO layer for input validation and by
 * the loader service for type-safe adapter instantiation.
 *
 * When adding a new adapter, add its ID here first.
 */
export const KNOWN_ADAPTER_IDS = [
  'arasaac',
  'nostr-amb-relay',
  'openverse',
  'rpi-virtuell',
  'wikimedia',
] as const;

export type KnownAdapterId = (typeof KNOWN_ADAPTER_IDS)[number];
