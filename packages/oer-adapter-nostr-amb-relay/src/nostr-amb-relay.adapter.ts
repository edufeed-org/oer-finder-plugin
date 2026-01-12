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
      relay = await Relay.connect(this.relayUrl);

      const filter = this.buildFilter(keywords, query.pageSize);
      const events = await this.subscribeToEvents(
        relay,
        filter,
        options?.signal,
      );
      const items = this.mapEventsToItems(events);
      const paginatedItems = this.paginateItems(
        items,
        query.page,
        query.pageSize,
      );

      return {
        items: paginatedItems,
        total: events.length,
      };
    } catch (error) {
      throw this.wrapError(error);
    } finally {
      relay?.close();
    }
  }

  private buildFilter(
    keywords: string,
    pageSize: number,
  ): Filter & { search?: string } {
    return {
      kinds: [EVENT_AMB_KIND],
      limit: pageSize,
      search: keywords,
    };
  }

  private async subscribeToEvents(
    relay: Relay,
    filter: Filter,
    signal?: AbortSignal,
  ): Promise<Event[]> {
    const events: Event[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Relay request timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Request aborted'));
      });

      const sub = relay.subscribe([filter], {
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

    return events;
  }

  private mapEventsToItems(events: Event[]) {
    return events.map((event) => {
      const parsedEvent = parseNostrAmbEvent(event);
      return mapNostrAmbEventToExternalOerItem(parsedEvent);
    });
  }

  private paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }

  private wrapError(error: unknown): Error {
    if (error instanceof Error) {
      if (
        error.message.includes('timed out') ||
        error.message.includes('aborted')
      ) {
        return error;
      }
      return new Error(`Nostr AMB Relay error: ${error.message}`);
    }
    return new Error('Nostr AMB Relay error: Unknown error');
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
