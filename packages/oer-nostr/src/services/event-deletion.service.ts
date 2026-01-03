import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { Event } from 'nostr-tools/core';
import {
  EVENT_FILE_KIND,
  EVENT_AMB_KIND,
} from '../constants/event-kinds.constants';
import {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
} from '../constants/source.constants';
import type {
  OerSourceEntity,
  OpenEducationalResourceEntity,
} from '../types/entities.types';
import {
  parseNostrEventData,
  type NostrEventData,
} from '../schemas/nostr-event.schema';
import { OER_SOURCE_REPOSITORY } from './nostr-event-database.service';

/**
 * Injection token for OpenEducationalResource repository
 */
export const OER_REPOSITORY = 'OER_REPOSITORY';

/**
 * Injection token for EventDeletionService
 */
export const EVENT_DELETION_SERVICE = 'EVENT_DELETION_SERVICE';

/**
 * Service for handling NIP-09 event deletion requests.
 * Validates deletion requests and handles cascading deletions via OerSource.
 * - AMB events (kind 30142): Deleting the source cascades to remove associated OER records
 * - File events (kind 1063): Nullifies file metadata fields before deletion
 */
@Injectable()
export class EventDeletionService {
  private readonly logger = new Logger(EventDeletionService.name);

  constructor(
    @Inject(OER_REPOSITORY)
    private readonly oerRepository: Repository<OpenEducationalResourceEntity>,
    @Inject(OER_SOURCE_REPOSITORY)
    private readonly oerSourceRepository: Repository<OerSourceEntity>,
  ) {}

  /**
   * Processes a kind 5 deletion event according to NIP-09.
   * Validates the deletion request and cascades deletions to dependent entities.
   *
   * @param deleteEvent - The kind 5 deletion event from Nostr
   */
  async processDeleteEvent(deleteEvent: Event): Promise<void> {
    const eventIds = this.extractEventReferences(deleteEvent);

    if (eventIds.length === 0) {
      this.logger.warn(
        `Deletion event ${deleteEvent.id} has no 'e' tag references, skipping`,
      );
      return;
    }

    this.logger.log(
      `Processing deletion event ${deleteEvent.id} with ${eventIds.length} event reference(s)`,
    );

    // Process each referenced event
    for (const eventId of eventIds) {
      await this.processSingleDeletion(deleteEvent, eventId);
    }
  }

  /**
   * Processes deletion of a single referenced event.
   *
   * @param deleteEvent - The kind 5 deletion event
   * @param eventId - The ID of the event to delete
   */
  private async processSingleDeletion(
    deleteEvent: Event,
    eventId: string,
  ): Promise<void> {
    try {
      // Find the referenced event source
      const sourceIdentifier = createNostrSourceIdentifier(eventId);
      const referencedSource = await this.oerSourceRepository.findOne({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: sourceIdentifier,
        },
      });

      if (!referencedSource) {
        this.logger.debug(
          `Referenced event ${eventId} not found in database, skipping deletion`,
        );
        return;
      }

      // Extract and validate the original event data from source_data
      const parseResult = parseNostrEventData(referencedSource.source_data);
      if (!parseResult.success) {
        this.logger.error(
          `Invalid source_data for event ${eventId}: ${parseResult.error}`,
        );
        return;
      }
      const eventData = parseResult.data;

      // Validate deletion request per NIP-09
      if (!this.validateDeletionRequest(deleteEvent, eventData)) {
        this.logger.warn(
          `Deletion validation failed for event ${eventId}: pubkey mismatch (delete pubkey: ${deleteEvent.pubkey}, event pubkey: ${eventData.pubkey})`,
        );
        return;
      }

      // Get the event kind from source_record_type, with NaN validation
      const parsedKind = referencedSource.source_record_type
        ? parseInt(referencedSource.source_record_type, 10)
        : NaN;
      const eventKind = Number.isNaN(parsedKind) ? eventData.kind : parsedKind;

      // Perform cascade deletion based on event kind
      await this.deleteEventAndCascade(eventId, eventKind);
    } catch (error) {
      this.logger.error(
        `Failed to process deletion for event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Continue processing other deletions even if one fails
    }
  }

  /**
   * Validates a deletion request according to NIP-09.
   * The pubkey of the deletion event must match the pubkey of the event being deleted.
   *
   * @param deleteEvent - The kind 5 deletion event
   * @param referencedEventData - The event data being referenced for deletion
   * @returns true if deletion is valid, false otherwise
   */
  private validateDeletionRequest(
    deleteEvent: Event,
    referencedEventData: NostrEventData,
  ): boolean {
    return deleteEvent.pubkey === referencedEventData.pubkey;
  }

  /**
   * Deletes an event source and handles cascading to dependent entities.
   *
   * Behavior by event kind:
   * - AMB events (kind 30142): Deleting the OerSource may cascade to OER if it's the only source
   * - File events (kind 1063): Nullifies file metadata fields before deletion
   * - Other events: Direct deletion
   *
   * @param eventId - The ID of the event to delete
   * @param eventKind - The kind of the event
   */
  async deleteEventAndCascade(
    eventId: string,
    eventKind: number,
  ): Promise<void> {
    try {
      // For file events, nullify file metadata fields in associated OER records before deletion
      if (eventKind === EVENT_FILE_KIND) {
        await this.nullifyFileMetadataForEvent(eventId);
      }

      const sourceIdentifier = createNostrSourceIdentifier(eventId);

      // Find the source and its linked OER before deleting
      const sourceToDelete = await this.oerSourceRepository.findOne({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: sourceIdentifier,
        },
      });

      if (!sourceToDelete) {
        this.logger.debug(`Event source ${eventId} not found in database`);
        return;
      }

      const oerId = sourceToDelete.oer_id;

      // Delete the source
      await this.oerSourceRepository.delete({ id: sourceToDelete.id });
      this.logger.log(`Deleted event source ${eventId} (kind: ${eventKind})`);

      // For AMB events, check if the OER should be deleted (no more sources)
      if (eventKind === EVENT_AMB_KIND && oerId) {
        const remainingSources = await this.oerSourceRepository.count({
          where: { oer_id: oerId },
        });

        if (remainingSources === 0) {
          await this.oerRepository.delete({ id: oerId });
          this.logger.log(`Deleted OER ${oerId} (no remaining sources)`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Nullifies file metadata fields (file_*) in OER records that reference the given file event.
   * Finds OERs via the oer_sources table and nullifies their file metadata.
   *
   * @param fileEventId - The ID of the file event being deleted
   */
  private async nullifyFileMetadataForEvent(
    fileEventId: string,
  ): Promise<void> {
    // Find all OER sources that reference this file event
    const sourceIdentifier = createNostrSourceIdentifier(fileEventId);
    const sources = await this.oerSourceRepository.find({
      where: {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
      },
    });

    if (sources.length === 0) {
      this.logger.debug(`No OER records found for file event ${fileEventId}`);
      return;
    }

    // Nullify file metadata for all affected OERs
    const oerIds = sources
      .map((source) => source.oer_id)
      .filter((id): id is string => id !== null);

    if (oerIds.length === 0) {
      return;
    }

    const result = await this.oerRepository
      .createQueryBuilder()
      .update()
      .set({
        file_mime_type: null,
        file_size: null,
        file_dim: null,
        file_alt: null,
      })
      .whereInIds(oerIds)
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Nullified file metadata in ${result.affected} OER record(s) for file event ${fileEventId}`,
      );
    }
  }

  /**
   * Extracts event IDs from 'e' tags in a deletion event.
   *
   * @param deleteEvent - The kind 5 deletion event
   * @returns Array of event IDs to delete
   */
  private extractEventReferences(deleteEvent: Event): string[] {
    const eventIds: string[] = [];

    for (const tag of deleteEvent.tags) {
      // 'e' tags contain event IDs to delete
      if (tag[0] === 'e' && tag[1]) {
        eventIds.push(tag[1]);
      }
    }

    return eventIds;
  }
}
