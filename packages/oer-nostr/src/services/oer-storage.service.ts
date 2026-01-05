import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { extractDatesFromMetadata } from '../utils/date-parser.util';
import {
  extractAmbMetadata,
  extractFileMetadataFields,
} from '../utils/metadata-extractor.util';
import {
  buildOerEntity,
  updateOerEntity,
  applyFileMetadataToEntity,
} from '../utils/oer-entity.mapper';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import { EVENT_FILE_KIND } from '../constants/event-kinds.constants';
import {
  DateFields,
  UpdateDecision,
  FileMetadata,
} from '../types/extraction.types';
import {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
} from '../constants/source.constants';
import { parseNostrEventData } from '../schemas/nostr-event.schema';
import type {
  OerSource,
  OpenEducationalResource,
} from '@edufeed-org/oer-entities';
import { OER_SOURCE_REPOSITORY } from './nostr-event-database.service';
import { OER_REPOSITORY } from './event-deletion.service';

/**
 * Injection token for OerStorageService
 */
export const OER_STORAGE_SERVICE = 'OER_STORAGE_SERVICE';

/**
 * Service responsible for OER database operations including:
 * - Creating and updating OER records
 * - Race condition handling on inserts
 * - Managing OER source links
 * - Querying OER records
 *
 * This service handles the storage layer while extraction logic
 * is delegated to pure functions (extractors and mappers).
 */
@Injectable()
export class OerStorageService {
  private readonly logger = new Logger(OerStorageService.name);

  constructor(
    @Inject(OER_REPOSITORY)
    private readonly oerRepository: Repository<OpenEducationalResource>,
    @Inject(OER_SOURCE_REPOSITORY)
    private readonly oerSourceRepository: Repository<OerSource>,
  ) {}

  /**
   * Extracts OER metadata from a kind 30142 (AMB) OerSource and creates or updates an OER record.
   * This method is called synchronously during event ingestion.
   * If a record with the same URL already exists, it will be updated only if the new event is newer.
   *
   * @param oerSource - The OerSource containing a kind 30142 (AMB) Nostr event
   * @returns The created or updated OER record
   */
  async extractOerFromSource(
    oerSource: OerSource,
  ): Promise<OpenEducationalResource> {
    // Extract and validate the Nostr event data from source_data
    const parseResult = parseNostrEventData(oerSource.source_data);
    if (!parseResult.success) {
      throw new Error(
        `Invalid source_data for source ${oerSource.id}: ${parseResult.error}`,
      );
    }
    const nostrEvent = parseResult.data;

    try {
      this.logger.debug(
        `Extracting OER from source ${oerSource.id} (event: ${nostrEvent.id}, kind: ${nostrEvent.kind})`,
      );

      // Extract all AMB metadata from the event
      const ambMetadata = extractAmbMetadata(nostrEvent);

      // Check if an OER with this URL and source already exists
      // Each source has its own entry for the same URL (unique constraint on url + source_name)
      let existingOer: OpenEducationalResource | null = null;
      if (ambMetadata.url) {
        existingOer = await this.oerRepository.findOne({
          where: { url: ambMetadata.url, source_name: SOURCE_NAME_NOSTR },
          relations: ['sources'],
        });
      }

      // If exists, check if we should update it
      if (existingOer) {
        const decision = this.shouldUpdateExistingOer(
          existingOer,
          ambMetadata.dates,
          ambMetadata.fileEventId,
        );

        if (!decision.shouldUpdate) {
          this.logger.debug(
            `Skipping OER update for URL ${ambMetadata.url}: ${decision.reason}`,
          );
          return existingOer;
        }

        this.logger.log(
          `Updating OER ${existingOer.id} for URL ${ambMetadata.url}: ${decision.reason}`,
        );
      }

      // Try to fetch file metadata from linked kind 1063 (File) event if available
      const fileMetadata = await this.fetchFileMetadata(
        ambMetadata.fileEventId,
      );

      // Create or update OER record
      let oer: OpenEducationalResource;
      if (existingOer) {
        // Update existing record
        updateOerEntity(existingOer, ambMetadata, fileMetadata);
        oer = existingOer;
      } else {
        // Create new record with all fields
        oer = this.oerRepository.create(
          buildOerEntity(ambMetadata, fileMetadata),
        );
      }

      // Save OER with race condition protection
      const savedOer = await this.saveOerWithRaceProtection(
        oer,
        ambMetadata.url,
        !!existingOer,
      );

      // Create or update OerSource entries for this Nostr event
      await this.createOrUpdateOerSources(
        savedOer,
        oerSource,
        ambMetadata.fileEventId,
      );

      return savedOer;
    } catch (error) {
      this.logger.error(
        `Failed to extract OER from source ${oerSource.id}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Finds OER records that are missing file metadata.
   * This happens when the OER was extracted before the file event arrived,
   * or when file metadata extraction failed.
   *
   * @returns Array of OER records with missing file metadata
   */
  async findOersWithMissingFileMetadata(): Promise<OpenEducationalResource[]> {
    // Find OERs that have no file_mime_type (indicating missing file metadata)
    // and have at least one Nostr source (which may reference file events)
    return this.oerRepository
      .createQueryBuilder('oer')
      .leftJoin('oer.sources', 'source')
      .where('oer.file_mime_type IS NULL')
      .andWhere('source.source_name = :sourceName', {
        sourceName: SOURCE_NAME_NOSTR,
      })
      .getMany();
  }

  /**
   * Updates an OER record with file metadata from Nostr file events in its sources.
   * Searches through the OER's sources to find file event references.
   *
   * @param oer - The OER record to update (must include sources relation)
   * @returns The updated OER record, or the original if no file metadata found
   */
  async updateFileMetadata(
    oer: OpenEducationalResource,
  ): Promise<OpenEducationalResource> {
    // Load sources if not already loaded
    if (!oer.sources) {
      const loaded = await this.oerRepository.findOne({
        where: { id: oer.id },
        relations: ['sources'],
      });
      if (!loaded) {
        this.logger.warn(`OER ${oer.id} not found`);
        return oer;
      }
      oer = loaded;
    }

    try {
      // Look for file event IDs in the source_identifier field
      const fileEventIds = (oer.sources ?? [])
        .filter(
          (source) =>
            source.source_name === SOURCE_NAME_NOSTR &&
            source.source_identifier?.startsWith('event:'),
        )
        .map((source) => {
          // Extract event ID from 'event:abc123' or 'event:abc123@relay:...'
          const match = source.source_identifier?.match(/^event:([^@]+)/);
          return match ? match[1] : null;
        })
        .filter((id): id is string => id !== null);

      if (fileEventIds.length === 0) {
        this.logger.debug(`OER ${oer.id} has no file event IDs, skipping`);
        return oer;
      }

      // Try each file event ID until we find file metadata
      for (const fileEventId of fileEventIds) {
        const fileMetadata = await this.fetchFileMetadata(fileEventId);

        if (fileMetadata) {
          // Update OER record with file metadata
          applyFileMetadataToEntity(oer, fileMetadata);

          const updatedOer = await this.oerRepository.save(oer);

          this.logger.log(
            `Successfully updated file metadata for OER ${oer.id} from event ${fileEventId}`,
          );

          return updatedOer;
        }
      }

      this.logger.warn(
        `Could not extract file metadata for OER ${oer.id} from any source`,
      );
      return oer;
    } catch (error) {
      this.logger.error(
        `Failed to update file metadata for OER ${oer.id}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Determines whether an existing OER should be updated based on date comparison
   * and missing metadata. Uses guard clauses and early returns for clarity.
   *
   * @param existing - The existing OER record
   * @param newDates - Date fields from the new event
   * @param newFileEventId - File event ID from the new event (if any)
   * @returns Update decision with shouldUpdate flag and reason
   */
  private shouldUpdateExistingOer(
    existing: OpenEducationalResource,
    newDates: DateFields,
    newFileEventId: string | null,
  ): UpdateDecision {
    // Early return: No new dates provided
    if (!newDates.latest) {
      return {
        shouldUpdate: false,
        reason:
          'new event has no date fields (dateCreated, datePublished, or dateModified)',
      };
    }

    // Extract dates from existing record's metadata
    const existingDates = extractDatesFromMetadata(existing.metadata ?? null);

    // Early return: Existing has no dates, allow update
    if (!existingDates.latest) {
      return {
        shouldUpdate: true,
        reason: 'existing has no dates, updating with new dates',
      };
    }

    // Dates comparison
    if (newDates.latest > existingDates.latest) {
      return {
        shouldUpdate: true,
        reason: 'new dates are newer than existing dates',
      };
    }

    // Special case: Missing file metadata
    // Check if we have no file metadata but the new event has a file reference
    const isMissingFileMetadata =
      !existing.file_mime_type && newFileEventId !== null;
    if (isMissingFileMetadata) {
      return {
        shouldUpdate: true,
        reason: 'dates are same but file metadata is missing',
      };
    }

    // Default: Don't update
    return {
      shouldUpdate: false,
      reason: 'new events date fields are not newer',
    };
  }

  /**
   * Saves an OER record with protection against race conditions.
   * Handles duplicate key errors by fetching and returning the existing record.
   *
   * @param oer - The OER record to save
   * @param url - The URL of the OER (used for duplicate lookup)
   * @param isUpdate - Whether this is an update operation
   * @returns The saved OER record
   */
  private async saveOerWithRaceProtection(
    oer: OpenEducationalResource,
    url: string | null,
    isUpdate: boolean,
  ): Promise<OpenEducationalResource> {
    try {
      const savedOer = await this.oerRepository.save(oer);

      this.logger.log(
        `Successfully ${isUpdate ? 'updated' : 'created'} OER record ${savedOer.id}`,
      );

      return savedOer;
    } catch (saveError) {
      // Handle race condition: another process may have created the same URL + source_name between our check and save
      if (DatabaseErrorClassifier.isDuplicateKeyError(saveError)) {
        this.logger.debug(
          `Duplicate URL ${url} for source ${oer.source_name} detected, returning existing record`,
        );

        // Fetch and return the existing record (unique by url + source_name)
        const duplicateOer = url
          ? await this.oerRepository.findOne({
              where: { url, source_name: oer.source_name },
            })
          : null;

        if (duplicateOer) {
          return duplicateOer;
        }

        // If we still can't find the record, something is wrong - rethrow
        this.logger.error(
          `Duplicate key error but could not find existing record for URL ${url} and source ${oer.source_name}`,
        );
        throw saveError;
      }

      // Not a duplicate key error - rethrow
      throw saveError;
    }
  }

  /**
   * Creates or updates OerSource entries for a Nostr event.
   * Links the AMB source to the OER and handles file event sources.
   *
   * @param oer - The OER record to create sources for
   * @param ambSource - The OerSource containing the AMB event (kind 30142)
   * @param fileEventId - The file event ID referenced by the AMB event (if any)
   */
  private async createOrUpdateOerSources(
    oer: OpenEducationalResource,
    ambSource: OerSource,
    fileEventId: string | null,
  ): Promise<void> {
    // Validate source_data for logging and comparison purposes
    const parseResult = parseNostrEventData(ambSource.source_data);
    if (!parseResult.success) {
      this.logger.error(
        `Invalid source_data for AMB source ${ambSource.id}: ${parseResult.error}`,
      );
      return;
    }
    const nostrEventData = parseResult.data;

    try {
      // Update the AMB source to link it to the OER and mark as processed
      ambSource.oer_id = oer.id;
      ambSource.status = 'processed';
      await this.oerSourceRepository.save(ambSource);
      this.logger.debug(
        `Updated OerSource ${ambSource.id} for AMB event ${nostrEventData.id}`,
      );

      // Link the file event source to the OER if it exists and is different
      if (fileEventId && fileEventId !== nostrEventData.id) {
        const fileSourceIdentifier = createNostrSourceIdentifier(fileEventId);
        const fileSource = await this.oerSourceRepository.findOne({
          where: {
            source_name: SOURCE_NAME_NOSTR,
            source_identifier: fileSourceIdentifier,
          },
        });

        if (fileSource) {
          // Link the file source to the OER and mark as processed
          fileSource.oer_id = oer.id;
          fileSource.status = 'processed';
          await this.oerSourceRepository.save(fileSource);
          this.logger.debug(
            `Updated OerSource ${fileSource.id} for file event ${fileEventId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to create/update OerSource for OER ${oer.id}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - source creation failure shouldn't fail the entire extraction
    }
  }

  /**
   * Fetches and extracts file metadata from a kind 1063 (File) Nostr event source.
   * Returns null if the event source doesn't exist, is the wrong kind, or lookup fails.
   *
   * @param fileEventId - The ID of the file event to fetch
   * @returns File metadata or null
   */
  private async fetchFileMetadata(
    fileEventId: string | null,
  ): Promise<FileMetadata | null> {
    if (!fileEventId) {
      return null;
    }

    try {
      // Look up file event in oer_sources by source_identifier
      const sourceIdentifier = createNostrSourceIdentifier(fileEventId);
      const fileSource = await this.oerSourceRepository.findOne({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: sourceIdentifier,
        },
      });

      if (!fileSource) {
        this.logger.debug(
          `File event source ${fileEventId} not found, skipping file metadata extraction`,
        );
        return null;
      }

      if (fileSource.source_record_type !== String(EVENT_FILE_KIND)) {
        this.logger.warn(
          `Referenced source ${fileEventId} is not kind ${EVENT_FILE_KIND} (found record type: ${fileSource.source_record_type})`,
        );
        return null;
      }

      // Extract and validate file metadata fields from source_data
      const parseResult = parseNostrEventData(fileSource.source_data);
      if (!parseResult.success) {
        this.logger.warn(
          `Invalid source_data for file source ${fileEventId}: ${parseResult.error}`,
        );
        return null;
      }
      const fields = extractFileMetadataFields(parseResult.data);

      return {
        eventId: fileEventId,
        ...fields,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch file source ${fileEventId}: ${error}`);
      // Return null to continue with extraction even if file event lookup fails
      return null;
    }
  }
}
