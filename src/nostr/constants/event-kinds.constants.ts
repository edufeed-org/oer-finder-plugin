/**
 * Nostr Event Kind Constants
 *
 * These constants define the event kinds used in the application.
 * @see https://github.com/nostr-protocol/nips
 */

/**
 * Kind 1063: File Metadata Event
 * Used to store metadata about files (MIME type, dimensions, size, etc.)
 * @see https://github.com/nostr-protocol/nips/blob/master/94.md
 */
export const EVENT_FILE_KIND = 1063;

/**
 * Kind 30142: AMB (General Media Data Profile for Educational Ressources) Event
 * Used to store Open Educational Resource (OER) metadata
 * @see https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md
 */
export const EVENT_AMB_KIND = 30142;

/**
 * Kind 5: Event Deletion Request
 * Used to request deletion of events (NIP-09)
 * @see https://github.com/nostr-protocol/nips/blob/master/09.md
 */
export const EVENT_DELETE_KIND = 5;
