import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Event } from 'nostr-tools/core';
import { NostrEvent } from '../entities/nostr-event.entity';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import { EVENT_AMB_KIND } from '../constants/event-kinds.constants';

/**
 * Result of a database save operation.
 * Provides type-safe handling of success/duplicate cases.
 */
export type SaveEventResult =
  | { success: true; event: NostrEvent }
  | { success: false; reason: 'duplicate' }
  | { success: false; reason: 'error'; error: unknown };

/**
 * Criteria for finding Nostr events.
 */
export interface FindEventCriteria {
  kind?: number;
  pubkey?: string;
  id?: string;
}

/**
 * Database service for Nostr event operations.
 * Encapsulates all TypeORM repository interactions and database-specific logic.
 */
@Injectable()
export class NostrEventDatabaseService {
  private readonly logger = new Logger(NostrEventDatabaseService.name);

  constructor(
    @InjectRepository(NostrEvent)
    private readonly repository: Repository<NostrEvent>,
  ) {}

  /**
   * Saves a Nostr event to the database.
   * Returns a type-safe result indicating success, duplicate, or error.
   *
   * @param event - The Nostr event to persist
   * @param relayUrl - The relay URL where this event came from
   * @returns SaveEventResult with outcome details
   */
  async saveEvent(event: Event, relayUrl: string): Promise<SaveEventResult> {
    try {
      const eventData = {
        id: event.id,
        kind: event.kind,
        pubkey: event.pubkey,
        created_at: event.created_at,
        content: event.content,
        tags: event.tags,
        raw_event: event as unknown as Record<string, unknown>,
        relay_url: relayUrl,
      };

      // Create the entity and save it (insert or update)
      const nostrEvent = this.repository.create(eventData);
      const savedEvent = await this.repository.save(nostrEvent);

      return { success: true, event: savedEvent };
    } catch (error) {
      // Handle duplicate key constraint violations
      if (DatabaseErrorClassifier.isDuplicateKeyError(error)) {
        return { success: false, reason: 'duplicate' };
      }

      return { success: false, reason: 'error', error };
    }
  }

  /**
   * Finds a single event by its ID.
   *
   * @param eventId - The event ID to search for
   * @returns The NostrEvent if found, null otherwise
   */
  async findEventById(eventId: string): Promise<NostrEvent | null> {
    return this.repository.findOne({ where: { id: eventId } });
  }

  /**
   * Finds events matching the specified criteria.
   *
   * @param criteria - Search criteria for events
   * @returns Array of matching NostrEvents
   */
  async findEvents(criteria: FindEventCriteria): Promise<NostrEvent[]> {
    return this.repository.find({ where: criteria });
  }

  /**
   * Finds all kind 30142 (AMB) events that don't have associated OER records.
   * This is used for processing historical events after EOSE.
   *
   * @returns Array of NostrEvents without OER records
   */
  async findUnprocessedOerEvents(): Promise<NostrEvent[]> {
    try {
      return await this.repository
        .createQueryBuilder('event')
        .leftJoin(
          'open_educational_resources',
          'oer',
          'oer.event_amb_id = event.id',
        )
        .where('event.kind = :kind', { kind: EVENT_AMB_KIND })
        .andWhere('oer.id IS NULL')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to find unprocessed OER events: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
      throw error;
    }
  }

  /**
   * Counts total events in the database.
   * Useful for monitoring and statistics.
   *
   * @returns Total event count
   */
  async countEvents(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Counts events by kind.
   * Useful for monitoring event type distribution.
   *
   * @param kind - The event kind to count
   * @returns Count of events with the specified kind
   */
  async countEventsByKind(kind: number): Promise<number> {
    return this.repository.count({ where: { kind } });
  }

  /**
   * Gets the most recent event timestamp for specified event kinds.
   * Used to resume synchronization from the last known event on server restart.
   *
   * @param kinds - Array of event kinds to consider
   * @returns The most recent created_at timestamp, or null if no events exist
   * @deprecated Use getLatestEventTimestampsByRelay for per-relay synchronization
   */
  async getLatestEventTimestamp(kinds: number[]): Promise<number | null> {
    try {
      const result = await this.repository
        .createQueryBuilder('event')
        .select('MAX(event.created_at)', 'max_timestamp')
        .where('event.kind IN (:...kinds)', { kinds })
        .getRawOne<{ max_timestamp: number | null }>();

      return result?.max_timestamp ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to get latest event timestamp: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
      throw error;
    }
  }

  /**
   * Gets the most recent event timestamp per relay for specified event kinds.
   * Used to resume synchronization from each relay's last known event on server restart.
   *
   * @param relayUrls - Array of relay URLs to query
   * @param kinds - Array of event kinds to consider
   * @returns Map of relay URL to most recent created_at timestamp
   */
  async getLatestEventTimestampsByRelay(
    relayUrls: readonly string[],
    kinds: number[],
  ): Promise<Map<string, number | null>> {
    try {
      const results = await this.repository
        .createQueryBuilder('event')
        .select('event.relay_url', 'relay_url')
        .addSelect('MAX(event.created_at)', 'max_timestamp')
        .where('event.relay_url IN (:...relayUrls)', { relayUrls })
        .andWhere('event.kind IN (:...kinds)', { kinds })
        .groupBy('event.relay_url')
        .getRawMany<{ relay_url: string; max_timestamp: number }>();

      // Create a map with all relay URLs, defaulting to null for relays with no events
      const timestampMap = new Map<string, number | null>();
      for (const url of relayUrls) {
        timestampMap.set(url, null);
      }

      // Update with actual timestamps from database
      for (const result of results) {
        timestampMap.set(result.relay_url, result.max_timestamp);
      }

      return timestampMap;
    } catch (error) {
      this.logger.error(
        `Failed to get latest event timestamps by relay: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
      throw error;
    }
  }
}
