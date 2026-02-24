import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchResult,
  AdapterSearchOptions,
} from '@edufeed-org/oer-adapter-core';
import { isFilterIncompatible } from '@edufeed-org/oer-adapter-core';
import { createOpenverseAdapter } from '@edufeed-org/oer-adapter-openverse';
import { createArasaacAdapter } from '@edufeed-org/oer-adapter-arasaac';
import { createNostrAmbRelayAdapter } from '@edufeed-org/oer-adapter-nostr-amb-relay';
import { createRpiVirtuellAdapter } from '@edufeed-org/oer-adapter-rpi-virtuell';
import { createWikimediaAdapter } from '@edufeed-org/oer-adapter-wikimedia';
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
  private readonly checkedSourceIds: ReadonlySet<string>;

  private constructor(
    adapters: ReadonlyMap<string, SourceAdapter>,
    sourceLabels: ReadonlyMap<string, string>,
    checkedSourceIds: ReadonlySet<string>,
  ) {
    this.adapters = adapters;
    this.sourceLabels = sourceLabels;
    this.checkedSourceIds = checkedSourceIds;
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
        case 'wikimedia': {
          const adapter = createWikimediaAdapter();
          adapters.set(adapter.sourceId, adapter);
          break;
        }
        // Unknown IDs: skip silently (server-only sources like 'nostr')
      }
    }

    const checkedSourceIds = new Set(
      configs.filter((c) => c.checked === true && adapters.has(c.id)).map((c) => c.id),
    );

    return new AdapterManager(adapters, labels, checkedSourceIds);
  }

  /**
   * Get an adapter by its source ID.
   */
  getAdapter(sourceId: string): SourceAdapter | undefined {
    return this.adapters.get(sourceId);
  }

  /**
   * Get all registered source IDs.
   */
  getAllSourceIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get all available sources as options for the UI.
   */
  getAvailableSources(): SourceOption[] {
    return Array.from(this.adapters.values()).map((adapter) => ({
      id: adapter.sourceId,
      label: this.sourceLabels.get(adapter.sourceId) ?? adapter.sourceId,
      ...(this.checkedSourceIds.has(adapter.sourceId) && { checked: true }),
    }));
  }

  /**
   * Get the default source ID.
   * Prefers the explicitly checked source; falls back to the first available adapter.
   */
  getDefaultSourceId(): string {
    const firstChecked = [...this.checkedSourceIds][0];
    if (firstChecked) return firstChecked;
    const sources = this.getAvailableSources();
    return sources[0]?.id || 'openverse';
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

    if (isFilterIncompatible(adapter.capabilities, query)) {
      return { items: [], total: 0 };
    }

    return adapter.search(query, options);
  }
}
