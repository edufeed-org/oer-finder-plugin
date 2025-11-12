/**
 * Event Factories and Fixtures
 *
 * This module provides factories for creating Nostr event test data:
 * - NostrEventFactory: Create NostrEvent entities
 * - EventFactory: Create nostr-tools Event objects
 * - Pre-configured fixtures for common scenarios
 * - Helper functions for specific event types
 */

import { NostrEvent } from '../../src/nostr/entities/nostr-event.entity';
import type { Event } from 'nostr-tools/core';

// Nostr Event Fixtures
import ambCompleteJson from './nostr-events/amb-complete.json';
import ambMinimalJson from './nostr-events/amb-minimal.json';
import ambWithUrisJson from './nostr-events/amb-with-uris.json';
import fileCompleteJson from './nostr-events/file-complete.json';

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
   * Complete file event with all metadata
   */
  fileComplete: (overrides?: Partial<NostrEvent>): NostrEvent =>
    NostrEventFactory.fromJson(fileCompleteJson, overrides),
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
