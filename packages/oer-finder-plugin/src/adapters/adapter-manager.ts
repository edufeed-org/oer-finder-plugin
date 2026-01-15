import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchResult,
  AdapterSearchOptions,
} from '@edufeed-org/oer-adapter-core';
import { createOpenverseAdapter } from '@edufeed-org/oer-adapter-openverse';
import { createArasaacAdapter } from '@edufeed-org/oer-adapter-arasaac';
import { createNostrAmbRelayAdapter } from '@edufeed-org/oer-adapter-nostr-amb-relay';
import type { SourceOption } from '../oer-search/OerSearch.js';

/**
 * Configuration for the Nostr AMB relay adapter.
 */
export interface NostrAmbRelayConfig {
  relayUrl: string;
  timeoutMs?: number;
}

/**
 * Configuration for which adapters to enable.
 * Passed from component attributes at construction time.
 */
export interface AdapterManagerConfig {
  /** Enable Openverse adapter (default: true) */
  openverse?: boolean;
  /** Enable ARASAAC adapter (default: true) */
  arasaac?: boolean;
  /** Nostr AMB relay configuration (enabled only when relayUrl is provided) */
  nostrAmbRelay?: NostrAmbRelayConfig;
}

/**
 * Manages adapter instances and provides search routing.
 * Initialized based on component attributes, not config files.
 * Adapters are immutable after construction.
 */
export class AdapterManager {
  private readonly adapters: ReadonlyMap<string, SourceAdapter>;

  constructor(config: AdapterManagerConfig = {}) {
    this.adapters = this.createAdapters(config);
  }

  private createAdapters(config: AdapterManagerConfig): ReadonlyMap<string, SourceAdapter> {
    const adapters = new Map<string, SourceAdapter>();

    if (config.openverse !== false) {
      const adapter = createOpenverseAdapter();
      adapters.set(adapter.sourceId, adapter);
    }

    if (config.arasaac !== false) {
      const adapter = createArasaacAdapter();
      adapters.set(adapter.sourceId, adapter);
    }

    if (config.nostrAmbRelay?.relayUrl) {
      const adapter = createNostrAmbRelayAdapter({
        relayUrl: config.nostrAmbRelay.relayUrl,
        timeoutMs: config.nostrAmbRelay.timeoutMs,
      });
      adapters.set(adapter.sourceId, adapter);
    }

    return adapters;
  }

  /**
   * Get an adapter by its source ID.
   */
  getAdapter(sourceId: string): SourceAdapter | undefined {
    return this.adapters.get(sourceId);
  }

  /**
   * Get all available sources as options for the UI.
   */
  getAvailableSources(): SourceOption[] {
    return Array.from(this.adapters.values()).map((adapter) => ({
      value: adapter.sourceId,
      label: adapter.sourceName,
    }));
  }

  /**
   * Get the default source ID (first available adapter).
   */
  getDefaultSourceId(): string {
    const sources = this.getAvailableSources();
    return sources[0]?.value || 'openverse';
  }

  /**
   * Search using the specified adapter.
   * @param sourceId - The source adapter to use
   * @param query - Search query parameters
   * @param options - Optional search options (e.g., AbortSignal)
   * @returns Search results from the adapter
   * @throws Error if the adapter is not found or not enabled
   */
  async search(
    sourceId: string,
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    const adapter = this.getAdapter(sourceId);

    if (!adapter) {
      throw new Error(`Adapter "${sourceId}" not found or not enabled`);
    }

    return adapter.search(query, options);
  }
}
