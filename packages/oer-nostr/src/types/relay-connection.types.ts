import type { Relay } from 'nostr-tools';

/** Subscription type inferred from Relay.subscribe return type */
type Subscription = ReturnType<Relay['subscribe']>;

/**
 * Represents a connection to a single Nostr relay with subscription and reconnection state.
 */
export interface RelayConnection {
  /**
   * The active relay connection, null if disconnected.
   */
  relay: Relay | null;

  /**
   * Active subscription to relay events, null if not subscribed.
   */
  subscription: Subscription | null;

  /**
   * Timeout handle for scheduled reconnection attempts, null if not scheduled.
   */
  reconnectTimeout: NodeJS.Timeout | null;

  /**
   * The relay WebSocket URL.
   */
  url: string;

  /**
   * Unix timestamp (seconds) of the most recent event received from this relay.
   * Used to request only new events on reconnection via the 'since' parameter.
   * Null on initial connection to fetch all historical events.
   */
  lastEventTimestamp: number | null;
}

/**
 * Configuration for relay subscriptions.
 */
export interface RelaySubscriptionConfig {
  /**
   * Event kinds to subscribe to.
   */
  kinds: number[];
}

/**
 * Default subscription configuration for OER events.
 * Includes deletion events (kind 5) for NIP-09 compliance.
 */
export const DEFAULT_SUBSCRIPTION_CONFIG: RelaySubscriptionConfig = {
  // Kind 5: Event deletion requests (NIP-09)
  // Kind 1063: File metadata events
  // Kind 30142: AMB (OER) events
  kinds: [5, 1063, 30142],
};
