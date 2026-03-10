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

/** Maximum number of events to collect per relay to prevent memory exhaustion */
const MAX_EVENTS = 500;

/** @see https://w3id.org/kim/hcrt/scheme */
const HCRT = {
  IMAGE: 'https://w3id.org/kim/hcrt/image',
  VIDEO: 'https://w3id.org/kim/hcrt/video',
  AUDIO: 'https://w3id.org/kim/hcrt/audio',
  TEXT: 'https://w3id.org/kim/hcrt/text',
} as const;

/** @see http://w3id.org/openeduhub/vocabs/learningResourceType */
const OEH_LRT = {
  IMAGE: 'http://w3id.org/openeduhub/vocabs/learningResourceType/image',
  VIDEO: 'http://w3id.org/openeduhub/vocabs/learningResourceType/video',
  AUDIO: 'http://w3id.org/openeduhub/vocabs/learningResourceType/audio',
  TEXT: 'http://w3id.org/openeduhub/vocabs/learningResourceType/text',
} as const;

/**
 * Maps UI resource types to vocabulary entries for relay filtering.
 *
 * The relay groups filter tokens by base field name (before the first dot) and
 * OR's values within the same group. All `learningResourceType.*` tokens are
 * OR'd together, matching resources tagged with any of the HCRT URI,
 * OpenEduHub URI, or prefLabel in any language.
 *
 * Note: As the AMB relay currently does not support multiple OR's on root-level
 * attributes, additional filters like `encoding.encodingFormat:image/png` or
 * `type:ImageObject` could also improve matching but are currently skipped.
 */
interface TypeFilterTokens {
  readonly hcrtId: string;
  readonly hcrtPrefLabelEn: string;
  readonly hcrtPrefLabelsDe: readonly string[];
  readonly openEduHubId: string;
}

const TEXT_FILTER: TypeFilterTokens = {
  hcrtId: HCRT.TEXT,
  hcrtPrefLabelEn: 'Text',
  hcrtPrefLabelsDe: ['Text'],
  openEduHubId: OEH_LRT.TEXT,
};

const TYPE_FILTER_CONFIG: Readonly<Record<string, TypeFilterTokens>> = {
  image: {
    hcrtId: HCRT.IMAGE,
    hcrtPrefLabelEn: 'Image',
    hcrtPrefLabelsDe: ['Bild', 'Abbildung'],
    openEduHubId: OEH_LRT.IMAGE,
  },
  video: {
    hcrtId: HCRT.VIDEO,
    hcrtPrefLabelEn: 'Video',
    hcrtPrefLabelsDe: ['Video'],
    openEduHubId: OEH_LRT.VIDEO,
  },
  audio: {
    hcrtId: HCRT.AUDIO,
    hcrtPrefLabelEn: 'Audio',
    hcrtPrefLabelsDe: ['Audio'],
    openEduHubId: OEH_LRT.AUDIO,
  },
  text: TEXT_FILTER,
  'application/pdf': TEXT_FILTER,
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
    const searchParts: string[] = [sanitizeKeywords(query.keywords ?? '')];

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
        for (const label of config.hcrtPrefLabelsDe) {
          searchParts.push(`learningResourceType.prefLabel.de:${label}`);
        }
        searchParts.push(`learningResourceType.id:${config.openEduHubId}`);
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
          if (events.length < MAX_EVENTS) {
            events.push(event);
          }
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

/**
 * Strips field:value tokens from user-provided keywords to prevent
 * injection of filter directives into the relay search string.
 */
function sanitizeKeywords(keywords: string): string {
  return keywords
    .replace(/\S+:\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the "d" tag value (resource URL) from a Nostr event,
 * falling back to the Nostr event ID when no "d" tag exists.
 */
const getResourceKey = (event: Event): string =>
  event.tags.find((tag) => tag[0] === 'd' && tag.length >= 2)?.[1] ?? event.id;

/**
 * Deduplicates events by resource identity (the "d" tag / resource URL).
 *
 * The same resource can appear with different Nostr event IDs when published
 * by multiple relays or republished. For each unique resource URL, the newest
 * event (highest `created_at`) is kept.
 */
const deduplicateEvents = (events: readonly Event[]): Event[] =>
  Array.from(
    events
      .reduce((seen, event) => {
        const key = getResourceKey(event);
        const existing = seen.get(key);
        if (!existing || event.created_at > existing.created_at) {
          seen.set(key, event);
        }
        return seen;
      }, new Map<string, Event>())
      .values(),
  );

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
