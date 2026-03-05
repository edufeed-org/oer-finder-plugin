import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import {
  ALL_RESOURCE_TYPES,
  isEmptySearch,
  EMPTY_RESULT,
  paginateItems,
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

/** Maximum number of relay URLs allowed to prevent resource exhaustion */
const MAX_RELAY_COUNT = 10;

/**
 * Maps UI resource types to HCRT (Hochschulcurriculare Ressourcentypen) vocabulary entries.
 *
 * The relay groups filter tokens by base field name (before the first dot) and
 * OR's values within the same group. Using `learningResourceType.id` and
 * `learningResourceType.prefLabel.en` ensures they share the `learningResourceType`
 * group and are OR'd together, matching resources tagged with either the HCRT URI
 * or the English label.
 *
 * @see https://w3id.org/kim/hcrt/scheme
 */
interface TypeFilterTokens {
  readonly hcrtId: string;
  readonly hcrtPrefLabelEn: string;
}

const TYPE_FILTER_CONFIG: Readonly<Record<string, TypeFilterTokens>> = {
  image: {
    hcrtId: 'https://w3id.org/kim/hcrt/image',
    hcrtPrefLabelEn: 'Image',
  },
  video: {
    hcrtId: 'https://w3id.org/kim/hcrt/video',
    hcrtPrefLabelEn: 'Video',
  },
  audio: {
    hcrtId: 'https://w3id.org/kim/hcrt/audio',
    hcrtPrefLabelEn: 'Audio',
  },
  text: {
    hcrtId: 'https://w3id.org/kim/hcrt/text',
    hcrtPrefLabelEn: 'Text',
  },
  'application/pdf': {
    hcrtId: 'https://w3id.org/kim/hcrt/text',
    hcrtPrefLabelEn: 'Text',
  },
};

interface RelayQueryResults {
  readonly events: readonly Event[];
  readonly errors: readonly Error[];
}

/**
 * Nostr AMB Relay adapter for searching educational metadata.
 *
 * The amb-relay is a specialized search relay for educational metadata
 * built on the AMB (Allgemeines Metadatenprofil für Bildungsressourcen) standard.
 * It combines Typesense full-text search with the Nostr protocol.
 *
 * Supports multiple relay URLs for fan-out queries with result merging and deduplication.
 *
 * @see https://github.com/edufeed-org/amb-relay
 */
export class NostrAmbRelayAdapter implements SourceAdapter {
  readonly sourceId = 'nostr-amb-relay';
  readonly sourceName = 'Nostr AMB Relay';
  readonly capabilities: AdapterCapabilities = {
    supportedTypes: ALL_RESOURCE_TYPES,
    supportsLicenseFilter: true,
    supportsEducationalLevelFilter: true,
  };

  private readonly relayUrls: readonly string[];
  private readonly timeoutMs: number;

  constructor(config: NostrAmbRelayConfig) {
    if (config.relayUrls.length === 0) {
      throw new Error('At least one relay URL must be provided');
    }
    if (config.relayUrls.length > MAX_RELAY_COUNT) {
      throw new Error(
        `Too many relay URLs (${config.relayUrls.length}). Maximum is ${MAX_RELAY_COUNT}.`,
      );
    }
    const validatedUrls = config.relayUrls.map((url) => {
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        throw new Error(
          `Invalid relay URL scheme: ${url}. Must use ws:// or wss://`,
        );
      }
      return url;
    });
    this.relayUrls = validatedUrls;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Search for educational resources matching the query.
   *
   * Fans out to all configured relays concurrently. Results are merged and
   * deduplicated by event ID. Partial results are returned if some relays fail;
   * an error is thrown only when all relays fail.
   */
  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const filter = this.buildFilter(query);
    const { events, errors } = await this.queryAllRelays(
      filter,
      options?.signal,
    );

    if (events.length === 0 && errors.length > 0) {
      throw this.wrapError(errors[0]);
    }

    const deduplicatedEvents = deduplicateEvents(events);
    const items = this.mapEventsToItems(deduplicatedEvents);
    const paginatedItems = paginateItems(items, query.page, query.pageSize);

    return {
      items: paginatedItems,
      total: deduplicatedEvents.length,
    };
  }

  private async queryAllRelays(
    filter: Filter,
    signal?: AbortSignal,
  ): Promise<RelayQueryResults> {
    const settled = await Promise.allSettled(
      this.relayUrls.map((url) => this.queryRelay(url, filter, signal)),
    );
    return collectResults(settled);
  }

  private async queryRelay(
    url: string,
    filter: Filter,
    signal?: AbortSignal,
  ): Promise<Event[]> {
    const relay = await Relay.connect(url);
    try {
      return await this.subscribeToEvents(relay, filter, signal);
    } finally {
      relay.close();
    }
  }

  /**
   * Build the Nostr filter with field-specific queries appended to the search string.
   *
   * The amb-relay backend parses field:value tokens from the search string
   * and converts them to Typesense filter_by expressions. This allows
   * filtering by language, license, and type without protocol-level changes.
   */
  private buildFilter(query: AdapterSearchQuery): Filter & { search?: string } {
    const searchParts: string[] = [query.keywords?.trim() ?? ''];

    if (query.language) {
      searchParts.push(`inLanguage:${query.language}`);
    }

    if (query.license) {
      searchParts.push(`license.id:${query.license}`);
    }

    if (query.type) {
      const config = TYPE_FILTER_CONFIG[query.type];
      if (config) {
        searchParts.push(`learningResourceType.id:${config.hcrtId}`);
        searchParts.push(
          `learningResourceType.prefLabel.en:${config.hcrtPrefLabelEn}`,
        );
      }
    }

    if (query.educationalLevel) {
      searchParts.push(`educationalLevel.id:${query.educationalLevel}`);
    }

    return {
      kinds: [EVENT_AMB_KIND],
      limit: query.pageSize,
      search: searchParts.join(' '),
    };
  }

  private async subscribeToEvents(
    relay: Relay,
    filter: Filter,
    signal?: AbortSignal,
  ): Promise<Event[]> {
    const events: Event[] = [];

    await new Promise<void>((resolve, reject) => {
      let sub: { close: () => void } | undefined;

      const cleanup = () => {
        sub?.close();
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Relay request timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      const onAbort = () => {
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Request aborted'));
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      sub = relay.subscribe([filter], {
        onevent: (event: Event) => {
          events.push(event);
        },
        oneose: () => {
          clearTimeout(timeoutId);
          signal?.removeEventListener('abort', onAbort);
          sub?.close();
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

function deduplicateEvents(events: readonly Event[]): Event[] {
  return Array.from(
    events
      .reduce(
        (seen, event) => (seen.has(event.id) ? seen : seen.set(event.id, event)),
        new Map<string, Event>(),
      )
      .values(),
  );
}

function collectResults(
  settled: readonly PromiseSettledResult<Event[]>[],
): RelayQueryResults {
  const fulfilled = settled.filter(
    (r): r is PromiseFulfilledResult<Event[]> => r.status === 'fulfilled',
  );
  const rejected = settled.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected',
  );

  return {
    events: fulfilled.flatMap((r) => r.value),
    errors: rejected.map((r) =>
      r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
    ),
  };
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
