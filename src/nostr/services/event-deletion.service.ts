import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Event } from 'nostr-tools/core';
import { NostrEvent } from '../entities/nostr-event.entity';
import { OpenEducationalResource } from '../../oer/entities/open-educational-resource.entity';
import { EVENT_FILE_KIND } from '../constants/event-kinds.constants';

/**
 * Service for handling NIP-09 event deletion requests.
 * Validates deletion requests and relies on database constraints for cascading:
 * - AMB events (kind 30142): ON DELETE CASCADE removes associated OER records
 * - File events (kind 1063): Nullifies file metadata fields, then ON DELETE SET NULL removes reference
 */
@Injectable()
export class EventDeletionService {
  private readonly logger = new Logger(EventDeletionService.name);

  constructor(
    @InjectRepository(NostrEvent)
    private readonly nostrEventRepository: Repository<NostrEvent>,
    @InjectRepository(OpenEducationalResource)
    private readonly oerRepository: Repository<OpenEducationalResource>,
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
      // Find the referenced event
      const referencedEvent = await this.nostrEventRepository.findOne({
        where: { id: eventId },
      });

      if (!referencedEvent) {
        this.logger.debug(
          `Referenced event ${eventId} not found in database, skipping deletion`,
        );
        return;
      }

      // Validate deletion request per NIP-09
      if (!this.validateDeletionRequest(deleteEvent, referencedEvent)) {
        this.logger.warn(
          `Deletion validation failed for event ${eventId}: pubkey mismatch (delete pubkey: ${deleteEvent.pubkey}, event pubkey: ${referencedEvent.pubkey})`,
        );
        return;
      }

      // Perform cascade deletion based on event kind
      await this.deleteEventAndCascade(eventId, referencedEvent.kind);
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
   * @param referencedEvent - The event being referenced for deletion
   * @returns true if deletion is valid, false otherwise
   */
  private validateDeletionRequest(
    deleteEvent: Event,
    referencedEvent: NostrEvent,
  ): boolean {
    return deleteEvent.pubkey === referencedEvent.pubkey;
  }

  /**
   * Deletes an event and handles cascading to dependent entities.
   *
   * Behavior by event kind:
   * - AMB events (kind 30142): Database CASCADE deletes associated OER records
   * - File events (kind 1063): Nullifies file metadata fields before deletion, then database SET NULL removes reference
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

      const result = await this.nostrEventRepository.delete({ id: eventId });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Deleted event ${eventId} (kind: ${eventKind})`);
      } else {
        this.logger.debug(`Event ${eventId} not found in database`);
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
   *
   * @param fileEventId - The ID of the file event being deleted
   */
  private async nullifyFileMetadataForEvent(
    fileEventId: string,
  ): Promise<void> {
    const result = await this.oerRepository.update(
      { event_file_id: fileEventId },
      {
        file_mime_type: null,
        file_size: null,
        file_dim: null,
        file_alt: null,
      },
    );

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
