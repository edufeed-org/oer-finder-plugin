/**
 * Unified source configuration for the OER Finder Plugin.
 *
 * Replaces the fragmented SourceOption + AdapterManagerConfig approach
 * with a single flat interface that works for both server-proxy and
 * direct-adapter modes.
 */
export interface SourceConfig {
  /** Unique source identifier (e.g., 'openverse', 'nostr-amb-relay') */
  readonly id: string;
  /** Human-readable label for the UI dropdown */
  readonly label: string;
  /** Base URL for the source adapter (e.g., relay URL, API endpoint) */
  readonly baseUrl?: string;
  /** Mark this source as pre-checked in the UI. Only checked sources are selected by default. First checked source is also used as the default source ID. */
  readonly checked?: boolean;
}
