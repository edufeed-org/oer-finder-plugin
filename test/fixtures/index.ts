/**
 * Test Fixtures Helper
 *
 * This module provides factories and builders for test fixtures following best practices:
 * - Factory Pattern: Simple creation with default values and overrides
 * - Builder Pattern: Step-by-step construction with fluent interface
 * - Type-safe: Proper TypeScript types throughout
 * - DRY: Reusable helpers to avoid code duplication
 */

import { NostrEvent } from '../../src/nostr/entities/nostr-event.entity';
import { OpenEducationalResource } from '../../src/oer/entities/open-educational-resource.entity';
import type { Event } from 'nostr-tools/core';

// Nostr Event Fixtures
import ambCompleteJson from './nostr-events/amb-complete.json';
import ambMinimalJson from './nostr-events/amb-minimal.json';
import ambWithUrisJson from './nostr-events/amb-with-uris.json';
import ambWithDatesJson from './nostr-events/amb-with-dates.json';
import fileCompleteJson from './nostr-events/file-complete.json';
import fileWithDescriptionJson from './nostr-events/file-with-description.json';
import deleteSingleJson from './nostr-events/delete-single.json';
import deleteMultipleJson from './nostr-events/delete-multiple.json';

// OER Fixtures
import oerCompleteJson from './oer/oer-complete.json';
import oerMinimalJson from './oer/oer-minimal.json';
import oerQueryFixturesJson from './oer/oer-query-fixtures.json';

/**
 * Helper to convert date strings to Date objects recursively
 */
function convertDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    // Handle date fields specifically
    if (
      (key === 'amb_date_created' ||
        key === 'amb_date_published' ||
        key === 'amb_date_modified') &&
      typeof value === 'string'
    ) {
      (result as Record<string, unknown>)[key] = new Date(value);
    }
  }

  return result;
}

/**
 * Factory for creating NostrEvent entities with type-safe defaults
 */
export class NostrEventFactory {
  private static readonly defaults: Readonly<NostrEvent> = {
    id: 'default-id',
    kind: 1,
    pubkey: 'default-pubkey',
    created_at: 1234567890,
    content: '',
    tags: [],
    raw_event: {},
    relay_url: 'wss://relay.example.com',
    ingested_at: new Date(),
  };

  /**
   * Create a NostrEvent with defaults and overrides
   * Uses spread operator to merge defaults with custom values
   */
  static create(
    base?: Partial<NostrEvent>,
    overrides?: Partial<NostrEvent>,
  ): NostrEvent {
    const merged = {
      ...this.defaults,
      ...base,
      ...overrides,
    };

    // Ensure ingested_at is a Date object
    if (!(merged.ingested_at instanceof Date)) {
      merged.ingested_at = new Date();
    }

    return merged;
  }

  /**
   * Create from JSON fixture with proper type conversion
   */
  static fromJson(
    json: Record<string, unknown>,
    overrides?: Partial<NostrEvent>,
  ): NostrEvent {
    return this.create(json as Partial<NostrEvent>, overrides);
  }
}

/**
 * Factory for creating Event (nostr-tools) with type-safe defaults
 */
export class EventFactory {
  private static readonly defaults: Readonly<Event> = {
    id: 'default-id',
    kind: 1,
    pubkey: 'default-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [],
    sig: 'default-signature',
  };

  static create(base?: Partial<Event>, overrides?: Partial<Event>): Event {
    return {
      ...this.defaults,
      ...base,
      ...overrides,
    };
  }

  static fromJson(
    json: Record<string, unknown>,
    overrides?: Partial<Event>,
  ): Event {
    return this.create(json as Partial<Event>, overrides);
  }
}

/**
 * Factory for creating OpenEducationalResource entities
 *
 * Note: Returns Partial<OpenEducationalResource> to allow flexible test data creation.
 * This is intentional for testing purposes where not all fields may be needed.
 */
export class OerFactory {
  /**
   * Create an OER with sensible defaults and custom overrides
   *
   * All fields default to null except:
   * - url: 'https://example.edu/default.pdf'
   * - created_at, updated_at: current timestamp
   *
   * Uses nullish coalescing (??) to preserve falsy values like false and 0
   */
  static create(
    base?: Partial<OpenEducationalResource>,
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> {
    const now = new Date();

    const result = {
      // Default URL (nullable in entity but commonly needed in tests)
      url: base?.url ?? 'https://example.edu/default.pdf',

      // Nullable fields - use nullish coalescing to preserve false/0 values
      amb_license_uri: base?.amb_license_uri ?? null,
      amb_free_to_use: base?.amb_free_to_use ?? null,
      file_mime_type: base?.file_mime_type ?? null,
      amb_metadata: base?.amb_metadata ?? null,
      amb_keywords: base?.amb_keywords ?? null,
      file_dim: base?.file_dim ?? null,
      file_size: base?.file_size ?? null,
      file_alt: base?.file_alt ?? null,
      amb_description: base?.amb_description ?? null,
      audience_uri: base?.audience_uri ?? null,
      educational_level_uri: base?.educational_level_uri ?? null,
      amb_date_created: base?.amb_date_created ?? null,
      amb_date_published: base?.amb_date_published ?? null,
      amb_date_modified: base?.amb_date_modified ?? null,
      event_amb_id: base?.event_amb_id ?? null,
      event_file_id: base?.event_file_id ?? null,

      // Relations (nullable)
      eventAmb: base?.eventAmb ?? null,
      eventFile: base?.eventFile ?? null,

      // Required timestamps (not nullable in entity)
      created_at: base?.created_at ?? now,
      updated_at: base?.updated_at ?? now,

      // Apply overrides last to ensure they take precedence
      ...overrides,
    };

    return result;
  }

  /**
   * Create from JSON fixture with automatic date string conversion
   */
  static fromJson(
    json: Record<string, unknown>,
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> {
    const converted = convertDates(json);
    return this.create(
      converted as Partial<OpenEducationalResource>,
      overrides,
    );
  }
}

/**
 * Builder pattern for NostrEvent - allows fluent, step-by-step construction
 */
export class NostrEventBuilder {
  private event: Partial<NostrEvent> = {};

  constructor(base?: Partial<NostrEvent>) {
    if (base) {
      this.event = { ...base };
    }
  }

  id(id: string): this {
    this.event.id = id;
    return this;
  }

  kind(kind: number): this {
    this.event.kind = kind;
    return this;
  }

  pubkey(pubkey: string): this {
    this.event.pubkey = pubkey;
    return this;
  }

  createdAt(timestamp: number): this {
    this.event.created_at = timestamp;
    return this;
  }

  content(content: string): this {
    this.event.content = content;
    return this;
  }

  tags(tags: string[][]): this {
    this.event.tags = tags;
    return this;
  }

  addTag(tag: string[]): this {
    if (!this.event.tags) {
      this.event.tags = [];
    }
    this.event.tags.push(tag);
    return this;
  }

  relayUrl(url: string): this {
    this.event.relay_url = url;
    return this;
  }

  build(): NostrEvent {
    return NostrEventFactory.create(this.event);
  }
}

/**
 * Builder pattern for OER - allows fluent, step-by-step construction
 */
export class OerBuilder {
  private oer: Partial<OpenEducationalResource> = {};

  constructor(base?: Partial<OpenEducationalResource>) {
    if (base) {
      this.oer = { ...base };
    }
  }

  url(url: string): this {
    this.oer.url = url;
    return this;
  }

  license(uri: string): this {
    this.oer.amb_license_uri = uri;
    return this;
  }

  freeToUse(free: boolean): this {
    this.oer.amb_free_to_use = free;
    return this;
  }

  mimeType(mimeType: string): this {
    this.oer.file_mime_type = mimeType;
    return this;
  }

  keywords(keywords: string[]): this {
    this.oer.amb_keywords = keywords;
    return this;
  }

  description(description: string): this {
    this.oer.amb_description = description;
    return this;
  }

  dateCreated(date: Date | string): this {
    this.oer.amb_date_created =
      typeof date === 'string' ? new Date(date) : date;
    return this;
  }

  datePublished(date: Date | string): this {
    this.oer.amb_date_published =
      typeof date === 'string' ? new Date(date) : date;
    return this;
  }

  eventAmbId(id: string): this {
    this.oer.event_amb_id = id;
    return this;
  }

  eventFileId(id: string): this {
    this.oer.event_file_id = id;
    return this;
  }

  build(): Partial<OpenEducationalResource> {
    return OerFactory.create(this.oer);
  }
}

/**
 * Pre-configured fixtures for common test scenarios
 */
export const nostrEventFixtures = {
  /**
   * Complete AMB event with all fields populated
   */
  ambComplete: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(ambCompleteJson, overrides),

  /**
   * Minimal AMB event with only required fields
   */
  ambMinimal: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(ambMinimalJson, overrides),

  /**
   * AMB event with educational level and audience URIs
   */
  ambWithUris: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(ambWithUrisJson, overrides),

  /**
   * AMB event with date fields (created, published, modified)
   */
  ambWithDates: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(ambWithDatesJson, overrides),

  /**
   * Complete file event with all metadata
   */
  fileComplete: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(fileCompleteJson, overrides),

  /**
   * File event with description tag and content
   */
  fileWithDescription: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(fileWithDescriptionJson, overrides),

  /**
   * Delete event referencing a single event
   */
  deleteSingle: (overrides?: Partial<Event>): Event =>
    EventFactory.fromJson(deleteSingleJson, overrides),

  /**
   * Delete event referencing multiple events
   */
  deleteMultiple: (overrides?: Partial<Event>): Event =>
    EventFactory.fromJson(deleteMultipleJson, overrides),
};

/**
 * Pre-configured OER fixtures
 */
export const oerFixtures = {
  /**
   * Complete OER with all fields populated
   */
  complete: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> =>
    OerFactory.fromJson(oerCompleteJson, overrides),

  /**
   * Minimal OER with only required fields
   */
  minimal: (
    overrides?: Partial<OpenEducationalResource>,
  ): Partial<OpenEducationalResource> =>
    OerFactory.fromJson(oerMinimalJson, overrides),

  /**
   * Query fixtures for testing various filter scenarios
   */
  query: oerQueryFixturesJson.map((fixture) => ({
    name: fixture.name,
    data: OerFactory.fromJson(fixture.data),
  })),

  /**
   * Get a specific query fixture by name
   */
  queryByName: (name: string): Partial<OpenEducationalResource> | undefined => {
    const fixture = oerQueryFixturesJson.find((f) => f.name === name);
    return fixture ? OerFactory.fromJson(fixture.data) : undefined;
  },
};

/**
 * Test data generators for bulk test data
 */
export const testDataGenerators = {
  /**
   * Generate multiple OERs for pagination tests
   */
  generateOers: (
    count: number,
    baseUrl = 'https://example.edu/resource',
  ): Array<Partial<OpenEducationalResource>> => {
    return Array.from({ length: count }, (_, i) =>
      OerFactory.create({
        url: `${baseUrl}-${i + 1}.png`,
        file_mime_type: 'image/png',
        amb_description: `Test resource ${i + 1}`,
      }),
    );
  },

  /**
   * Generate multiple AMB events for testing
   */
  generateAmbEvents: (
    count: number,
    basePubkey = 'test-pubkey',
  ): NostrEvent[] => {
    return Array.from({ length: count }, (_, i) =>
      NostrEventFactory.create({
        id: `amb-event-${i + 1}`,
        kind: 30142,
        pubkey: basePubkey,
        created_at: 1234567890 + i,
        tags: [
          ['d', `https://example.edu/resource-${i + 1}.png`],
          ['type', 'LearningResource'],
        ],
      }),
    );
  },
};

/**
 * Factory helpers for creating specific types of events
 */
export const eventFactoryHelpers = {
  /**
   * Create an AMB event (kind 30142) with sensible defaults
   */
  createAmbEvent: (overrides?: Partial<NostrEvent>): NostrEvent => {
    return NostrEventFactory.create(
      {
        kind: 30142,
        tags: [
          ['d', 'https://example.edu/default-resource.pdf'],
          ['type', 'LearningResource'],
        ],
      },
      overrides,
    );
  },

  /**
   * Create a File event (kind 1063) with sensible defaults
   */
  createFileEvent: (overrides?: Partial<NostrEvent>): NostrEvent => {
    return NostrEventFactory.create(
      {
        kind: 1063,
        content: 'Default file description',
        tags: [
          ['m', 'application/pdf'],
          ['size', '1024000'],
        ],
      },
      overrides,
    );
  },

  /**
   * Create a Delete event (kind 5) for testing deletions
   */
  createDeleteEvent: (
    targetEventIds: string | string[],
    pubkey = 'test-pubkey',
    overrides?: Partial<Event>,
  ): Event => {
    const ids = Array.isArray(targetEventIds)
      ? targetEventIds
      : [targetEventIds];
    return EventFactory.create(
      {
        kind: 5,
        pubkey,
        content: 'Deleting event(s)',
        tags: ids.map((id) => ['e', id]),
      },
      overrides,
    );
  },
};
