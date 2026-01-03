// Re-export Nostr-specific constants from the package
export {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
  createNostrSourceIdentifierWithRelay,
  createNostrSourceUri,
  extractRelayUrlFromSourceUri,
} from '@edufeed-org/oer-nostr';

/**
 * Source name constants for non-Nostr OER sources
 */
export const SOURCE_NAME_ARASAAC = 'arasaac';
export const SOURCE_NAME_OPENVERSE = 'openverse';

/**
 * Default source name for resources (Nostr network)
 */
export { SOURCE_NAME_NOSTR as DEFAULT_SOURCE } from '@edufeed-org/oer-nostr';
