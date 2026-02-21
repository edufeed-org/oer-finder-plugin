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
  /** Mark this source as the default selection. First marked source wins. */
  readonly selected?: boolean;
}
