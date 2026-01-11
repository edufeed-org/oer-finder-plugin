import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
} from '@edufeed-org/oer-adapter-core';
import { Relay } from 'nostr-tools';
import type { Event, Filter } from 'nostr-tools';
import {
  EVENT_AMB_KIND,
  parseNostrAmbEvent,
  type NostrAmbRelayConfig,
} from './nostr-amb-relay.types.js';
import { mapNostrAmbEventToExternalOerItem } from './mappers/nostr-amb-to-external.mapper.js';

/** Default timeout for relay requests */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Nostr AMB Relay adapter for searching educational metadata.
 *
 * The amb-relay is a specialized search relay for educational metadata
 * built on the AMB (Allgemeines Metadatenprofil für Bildungsressourcen) standard.
 * It combines Typesense full-text search with the Nostr protocol.
 *
 * @see https://github.com/edufeed-org/amb-relay
 */
export class NostrAmbRelayAdapter implements SourceAdapter {
  readonly sourceId = 'nostr-amb-relay';
  readonly sourceName = 'Nostr AMB Relay';

  private readonly relayUrl: string;
  private readonly timeoutMs: number;

  constructor(config: NostrAmbRelayConfig) {
    this.relayUrl = config.relayUrl;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Search for educational resources matching the query.
   *
   * The amb-relay supports full-text search through the Nostr protocol
   * using the 'search' filter parameter.
   *
   * Supported filters:
   * - search: Full-text search across all AMB metadata fields
   * - limit: Number of results to return (maps to pageSize)
   *
   * Field-specific queries can be performed using the format:
   * "field.subfield:value" (e.g., "publisher.name:example")
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    const keywords = query.keywords?.trim();
    if (!keywords) {
      return { items: [], total: 0 };
    }

    let relay: Relay | null = null;

    try {
      // Connect to the relay
      relay = await Relay.connect(this.relayUrl);

      // Build the filter with search query
      const filter: Filter & { search?: string } = {
        kinds: [EVENT_AMB_KIND],
        limit: query.pageSize,
        search: keywords,
      };

      // Collect events from the relay
      const events: Event[] = [];

      await new Promise<void>((resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
          reject(new Error(`Relay request timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);

        // Handle external abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        }

        // Subscribe to events
        const sub = relay!.subscribe([filter], {
          onevent: (event: Event) => {
            events.push(event);
          },
          oneose: () => {
            clearTimeout(timeoutId);
            sub.close();
            resolve();
          },
        });
      });

      // Map events to ExternalOerItem
      const items = events.map((event) => {
        const parsedEvent = parseNostrAmbEvent(event);
        return mapNostrAmbEventToExternalOerItem(parsedEvent);
      });

      // Handle pagination
      // Note: The relay returns all matching results up to the limit.
      // For proper pagination, we would need server-side support.
      // Currently, we skip items based on page number.
      const startIndex = (query.page - 1) * query.pageSize;
      const paginatedItems = items.slice(startIndex, startIndex + query.pageSize);

      return {
        items: paginatedItems,
        // Total is an estimate since the relay doesn't provide exact count
        total: events.length,
      };
    } catch (error) {
      // Handle connection errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('timed out') || error.message.includes('aborted')) {
          throw error;
        }
        throw new Error(`Nostr AMB Relay error: ${error.message}`);
      }
      throw new Error('Nostr AMB Relay error: Unknown error');
    } finally {
      // Always close the relay connection
      if (relay) {
        relay.close();
      }
    }
  }
}

/**
 * Factory function to create a NostrAmbRelayAdapter.
 *
 * @param config - Configuration options for the adapter
 */
export function createNostrAmbRelayAdapter(
  config: NostrAmbRelayConfig,
): NostrAmbRelayAdapter {
  return new NostrAmbRelayAdapter(config);
}
