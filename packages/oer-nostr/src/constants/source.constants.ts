/**
 * Source name constant for Nostr events
 */
export const SOURCE_NAME_NOSTR = 'nostr';

/**
 * Helper function to create a source identifier for Nostr events
 * @param eventId The Nostr event ID
 * @returns Formatted source identifier (e.g., 'event:abc123')
 */
export function createNostrSourceIdentifier(eventId: string): string {
  return `event:${eventId}`;
}

/**
 * Helper function to create a source identifier with relay information
 * @param eventId The Nostr event ID
 * @param relayUrl The relay URL (optional)
 * @returns Formatted source identifier (e.g., 'event:abc123@relay:wss://relay.url')
 */
export function createNostrSourceIdentifierWithRelay(
  eventId: string,
  relayUrl?: string,
): string {
  if (relayUrl) {
    return `event:${eventId}@relay:${relayUrl}`;
  }
  return createNostrSourceIdentifier(eventId);
}

/**
 * Helper function to create a source URI for Nostr events.
 * The source_uri stores just the relay URL for simplicity.
 * The event ID is already stored in source_identifier.
 *
 * @param relayUrl The relay URL (e.g., 'wss://relay.edufeed.org')
 * @returns The relay URL as source_uri
 */
export function createNostrSourceUri(relayUrl: string): string {
  return relayUrl;
}

/**
 * Extracts the relay URL from a source URI.
 * For Nostr events, the source_uri IS the relay URL.
 *
 * @param sourceUri The source URI (e.g., 'wss://relay.edufeed.org')
 * @returns The relay URL or null if empty
 */
export function extractRelayUrlFromSourceUri(
  sourceUri: string | null,
): string | null {
  return sourceUri || null;
}
