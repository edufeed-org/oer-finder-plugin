import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchResult,
  AdapterSearchOptions,
} from '@edufeed-org/oer-adapter-core';
import { createOpenverseAdapter } from '@edufeed-org/oer-adapter-openverse';
import { createArasaacAdapter } from '@edufeed-org/oer-adapter-arasaac';
import { createNostrAmbRelayAdapter } from '@edufeed-org/oer-adapter-nostr-amb-relay';
import { createRpiVirtuellAdapter } from '@edufeed-org/oer-adapter-rpi-virtuell';
import type { SourceOption } from '../oer-search/OerSearch.js';
import type { SourceConfig } from '../types/source-config.js';

/**
 * Manages adapter instances and provides search routing.
 * Use `AdapterManager.fromSourceConfigs()` to create an instance.
 * Adapters are immutable after construction.
 */
export class AdapterManager {
  private readonly adapters: ReadonlyMap<string, SourceAdapter>;
  private readonly sourceLabels: ReadonlyMap<string, string>;

  private constructor(
    adapters: ReadonlyMap<string, SourceAdapter>,
    sourceLabels: ReadonlyMap<string, string>,
  ) {
    this.adapters = adapters;
    this.sourceLabels = sourceLabels;
  }

  /**
   * Create an AdapterManager from unified SourceConfig array.
   * Only known adapter IDs are instantiated; unknown IDs are skipped silently.
   * For nostr-amb-relay, baseUrl is required — skipped if missing.
   */
  static fromSourceConfigs(configs: readonly SourceConfig[]): AdapterManager {
    const adapters = new Map<string, SourceAdapter>();
    const labels = new Map<string, string>();

    for (const config of configs) {
      labels.set(config.id, config.label);

      switch (config.id) {
        case 'openverse': {
          const adapter = createOpenverseAdapter();
          adapters.set(adapter.sourceId, adapter);
          break;
        }
        case 'arasaac': {
          const adapter = createArasaacAdapter();
          adapters.set(adapter.sourceId, adapter);
          break;
        }
        case 'nostr-amb-relay': {
          if (config.baseUrl) {
            const adapter = createNostrAmbRelayAdapter({ relayUrl: config.baseUrl });
            adapters.set(adapter.sourceId, adapter);
          }
          break;
        }
        case 'rpi-virtuell': {
          const adapter = createRpiVirtuellAdapter({ apiUrl: config.baseUrl });
          adapters.set(adapter.sourceId, adapter);
          break;
        }
        // Unknown IDs: skip silently (server-only sources like 'nostr')
      }
    }

    return new AdapterManager(adapters, labels);
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
      label: this.sourceLabels.get(adapter.sourceId) ?? adapter.sourceId,
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
