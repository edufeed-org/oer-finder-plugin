import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { Event } from 'nostr-tools';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import { EVENT_AMB_KIND } from '../constants/event-kinds.constants';
import {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
  createNostrSourceUri,
} from '../constants/source.constants';
import type { OerSource } from '@edufeed-org/oer-entities';

/**
 * Injection token for OerSource repository
 */
export const OER_SOURCE_REPOSITORY = 'OER_SOURCE_REPOSITORY';

/**
 * Injection token for NostrEventDatabaseService
 */
export const NOSTR_EVENT_DATABASE_SERVICE = 'NOSTR_EVENT_DATABASE_SERVICE';

/**
 * Result of a database save operation.
 * Provides type-safe handling of success/duplicate cases.
 */
export type SaveEventResult =
  | { success: true; source: OerSource }
  | { success: false; reason: 'duplicate' }
  | { success: false; reason: 'error'; error: unknown };

/**
 * Criteria for finding Nostr events.
 */
export interface FindEventCriteria {
  source_record_type?: string;
  source_identifier?: string;
  source_uri?: string;
}

/**
 * Database service for Nostr event operations.
 * Uses oer_sources table for storage, enabling unified source tracking.
 */
@Injectable()
export class NostrEventDatabaseService {
  private readonly logger = new Logger(NostrEventDatabaseService.name);

  constructor(
    @Inject(OER_SOURCE_REPOSITORY)
    private readonly repository: Repository<OerSource>,
  ) {}

  /**
   * Saves a Nostr event to the database as a pending OerSource.
   * Returns a type-safe result indicating success, duplicate, or error.
   *
   * @param event - The Nostr event to persist
   * @param relayUrl - The relay URL where this event came from
   * @returns SaveEventResult with outcome details
   */
  async saveEvent(event: Event, relayUrl: string): Promise<SaveEventResult> {
    try {
      const sourceIdentifier = createNostrSourceIdentifier(event.id);

      // Check if this event already exists
      const existing = await this.repository.findOne({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: sourceIdentifier,
        },
      });

      if (existing) {
        return { success: false, reason: 'duplicate' };
      }

      const sourceData = {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
        source_data: event as unknown as Record<string, unknown>,
        source_uri: createNostrSourceUri(relayUrl),
        source_timestamp: event.created_at,
        source_record_type: String(event.kind),
        status: 'pending' as const,
        oer_id: null, // Pending events have no OER yet
      };

      const oerSource = this.repository.create(sourceData);
      const savedSource = await this.repository.save(oerSource);

      return { success: true, source: savedSource };
    } catch (error) {
      // Handle duplicate key constraint violations
      if (DatabaseErrorClassifier.isDuplicateKeyError(error)) {
        return { success: false, reason: 'duplicate' };
      }

      return { success: false, reason: 'error', error };
    }
  }

  /**
   * Finds a single event source by its event ID.
   *
   * @param eventId - The Nostr event ID to search for
   * @returns The OerSource if found, null otherwise
   */
  async findEventById(eventId: string): Promise<OerSource | null> {
    const sourceIdentifier = createNostrSourceIdentifier(eventId);
    return this.repository.findOne({
      where: {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
      },
    });
  }

  /**
   * Finds event sources matching the specified criteria.
   *
   * @param criteria - Search criteria for events
   * @returns Array of matching OerSources
   */
  async findEvents(criteria: FindEventCriteria): Promise<OerSource[]> {
    const where: Record<string, unknown> = {
      source_name: SOURCE_NAME_NOSTR,
    };

    if (criteria.source_record_type !== undefined) {
      where.source_record_type = criteria.source_record_type;
    }
    if (criteria.source_identifier) {
      where.source_identifier = criteria.source_identifier;
    }
    if (criteria.source_uri) {
      where.source_uri = criteria.source_uri;
    }

    return this.repository.find({ where });
  }

  /**
   * Finds all pending kind 30142 (AMB) events that need OER extraction.
   * These are events that have been ingested but not yet linked to an OER.
   *
   * @returns Array of OerSources with pending AMB events
   */
  async findUnprocessedOerEvents(): Promise<OerSource[]> {
    try {
      return await this.repository.find({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_record_type: String(EVENT_AMB_KIND),
          status: 'pending',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find unprocessed OER events: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
      throw error;
    }
  }

  /**
   * Counts total Nostr events in the database.
   * Useful for monitoring and statistics.
   *
   * @returns Total event count
   */
  async countEvents(): Promise<number> {
    return this.repository.count({
      where: { source_name: SOURCE_NAME_NOSTR },
    });
  }

  /**
   * Counts events by record type.
   * Useful for monitoring event type distribution.
   *
   * @param recordType - The record type to count (e.g., '30142' for AMB events)
   * @returns Count of events with the specified record type
   */
  async countEventsByRecordType(recordType: string): Promise<number> {
    return this.repository.count({
      where: {
        source_name: SOURCE_NAME_NOSTR,
        source_record_type: recordType,
      },
    });
  }

  /**
   * Gets the most recent timestamp per relay for specified record types.
   * Used to resume synchronization from each relay's last known event on server restart.
   *
   * The source_uri field stores the relay URL directly (e.g., 'wss://relay.edufeed.org').
   *
   * @param relayUrls - Array of relay URLs to query
   * @param recordTypes - Array of record types to consider (e.g., ['30142', '1063'])
   * @returns Map of relay URL to most recent source_timestamp
   */
  async getLatestTimestampsByRelay(
    relayUrls: readonly string[],
    recordTypes: string[],
  ): Promise<Map<string, number | null>> {
    try {
      // Create a map with all relay URLs, defaulting to null for relays with no events
      const timestampMap = new Map<string, number | null>();
      for (const url of relayUrls) {
        timestampMap.set(url, null);
      }

      // Query each relay separately using exact match on source_uri
      for (const relayUrl of relayUrls) {
        const result = await this.repository
          .createQueryBuilder('source')
          .select('MAX(source.source_timestamp)', 'max_timestamp')
          .where('source.source_name = :sourceName', {
            sourceName: SOURCE_NAME_NOSTR,
          })
          .andWhere('source.source_uri = :relayUrl', { relayUrl })
          .andWhere('source.source_record_type IN (:...recordTypes)', {
            recordTypes,
          })
          .getRawOne<{ max_timestamp: string | null }>();

        if (result?.max_timestamp) {
          timestampMap.set(relayUrl, parseInt(result.max_timestamp, 10));
        }
      }

      return timestampMap;
    } catch (error) {
      this.logger.error(
        `Failed to get latest timestamps by relay: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
      throw error;
    }
  }

  /**
   * Marks an event source as processed after successful OER extraction.
   *
   * @param eventId - The Nostr event ID
   * @param oerId - The OER ID that was created/updated
   */
  async markEventProcessed(eventId: string, oerId: string): Promise<void> {
    const sourceIdentifier = createNostrSourceIdentifier(eventId);
    await this.repository.update(
      {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
      },
      {
        status: 'processed',
        oer_id: oerId,
      },
    );
  }

  /**
   * Marks an event source as failed after extraction failure.
   *
   * @param eventId - The Nostr event ID
   */
  async markEventFailed(eventId: string): Promise<void> {
    const sourceIdentifier = createNostrSourceIdentifier(eventId);
    await this.repository.update(
      {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
      },
      {
        status: 'failed',
      },
    );
  }
}
