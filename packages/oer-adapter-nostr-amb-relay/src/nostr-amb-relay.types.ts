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
