import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { NostrEvent } from '../../nostr/entities/nostr-event.entity';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';
import {
  parseColonSeparatedTags,
  extractTagValues,
  findTagValue,
  findEventIdByMarker,
  parseBoolean,
  parseBigInt,
} from '../../common/utils/tag-parser.util';
import { DatabaseErrorClassifier } from '../../nostr/utils/database-error.classifier';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../../nostr/constants/event-kinds.constants';
import {
  FileMetadataFields,
  LicenseInfo,
  DateFields,
  UpdateDecision,
  AmbMetadata,
  FileMetadata,
} from '../types/extraction.types';
import { DEFAULT_SOURCE } from '../constants';

@Injectable()
export class OerExtractionService {
  private readonly logger = new Logger(OerExtractionService.name);

  constructor(
    @InjectRepository(OpenEducationalResource)
    private readonly oerRepository: Repository<OpenEducationalResource>,
    @InjectRepository(NostrEvent)
    private readonly nostrEventRepository: Repository<NostrEvent>,
  ) {}

  /**
   * Extracts OER metadata from a kind 30142 (AMB) Nostr event and creates or updates an OER record.
   * This method is called synchronously during event ingestion.
   * If a record with the same URL already exists, it will be updated only if the new event is newer.
   *
   * @param nostrEvent - The kind 30142 (AMB) Nostr event to extract from
   * @returns The created or updated OER record
   */
  async extractOerFromEvent(
    nostrEvent: NostrEvent,
  ): Promise<OpenEducationalResource> {
    try {
      this.logger.debug(
        `Extracting OER from event ${nostrEvent.id} (kind: ${nostrEvent.kind})`,
      );

      // Extract all AMB metadata from the event
      const ambMetadata = this.extractAmbMetadata(nostrEvent);

      // Check if an OER with this URL already exists
      let existingOer: OpenEducationalResource | null = null;
      if (ambMetadata.url) {
        existingOer = await this.oerRepository.findOne({
          where: { url: ambMetadata.url },
          relations: ['eventAmb'],
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
      const fileMetadata = await this.extractFileMetadata(
        ambMetadata.fileEventId,
      );

      // Create or update OER record
      let oer: OpenEducationalResource;
      if (existingOer) {
        // Update existing record
        this.populateOerEntity(
          existingOer,
          ambMetadata,
          fileMetadata,
          nostrEvent.id,
        );
        oer = existingOer;
      } else {
        // Create new record with all fields
        oer = this.oerRepository.create(
          this.buildOerObject(ambMetadata, fileMetadata, nostrEvent.id),
        );
      }

      // Save with race condition protection
      return this.saveOerWithRaceProtection(
        oer,
        ambMetadata.url,
        !!existingOer,
      );
    } catch (error) {
      this.logger.error(
        `Failed to extract OER from event ${nostrEvent.id}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Checks if an event should trigger OER extraction.
   *
   * @param eventKind - The kind of Nostr event
   * @returns True if OER extraction should be performed
   */
  shouldExtractOer(eventKind: number): boolean {
    return eventKind === EVENT_AMB_KIND;
  }

  /**
   * Finds OER records that have an event_file_id but are missing file metadata.
   * This happens when the OER was extracted before the file event arrived.
   *
   * @returns Array of OER records with missing file metadata
   */
  async findOersWithMissingFileMetadata(): Promise<OpenEducationalResource[]> {
    return this.oerRepository.find({
      where: {
        event_file_id: Not(IsNull()),
        file_mime_type: IsNull(),
      },
    });
  }

  /**
   * Updates an OER record with file metadata from its referenced file event.
   *
   * @param oer - The OER record to update
   * @returns The updated OER record, or the original if no file event found
   */
  async updateFileMetadata(
    oer: OpenEducationalResource,
  ): Promise<OpenEducationalResource> {
    if (!oer.event_file_id) {
      this.logger.debug(`OER ${oer.id} has no event_file_id, skipping`);
      return oer;
    }

    try {
      // Extract file metadata using shared method
      const fileMetadata = await this.extractFileMetadata(oer.event_file_id);

      if (!fileMetadata) {
        this.logger.warn(
          `Could not extract file metadata for OER ${oer.id} from event ${oer.event_file_id}`,
        );
        return oer;
      }

      // Update OER record
      oer.file_mime_type = fileMetadata.mimeType;
      oer.file_dim = fileMetadata.dim;
      oer.file_size = fileMetadata.size;
      oer.file_alt = fileMetadata.alt;
      oer.description = fileMetadata.description;

      const updatedOer = await this.oerRepository.save(oer);

      this.logger.log(
        `Successfully updated file metadata for OER ${oer.id} from event ${oer.event_file_id}`,
      );

      return updatedOer;
    } catch (error) {
      this.logger.error(
        `Failed to update file metadata for OER ${oer.id}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Safely parses a date string from AMB metadata.
   * Returns null if the value is missing, invalid, or cannot be parsed.
   *
   * @param value - The date value from metadata (can be string, number, or other types)
   * @returns Parsed Date object or null
   */
  private parseDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    // Handle string values (ISO 8601 format like "2024-01-15" or "2024-01-15T10:30:00Z")
    if (typeof value === 'string') {
      const parsed = new Date(value);
      // Check if the date is valid
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle numeric timestamps (Unix timestamps in seconds or milliseconds)
    if (typeof value === 'number') {
      const parsed = new Date(value > 9999999999 ? value : value * 1000);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    this.logger.debug(`Failed to parse date value: ${value}`);
    return null;
  }

  /**
   * Returns the latest (most recent) date from multiple date values.
   * Returns null if all dates are null.
   *
   * @param dates - Variable number of dates to compare
   * @returns The latest date or null if all are null
   */
  private getLatestDate(...dates: (Date | null)[]): Date | null {
    const validDates = dates.filter((date): date is Date => date !== null);
    if (validDates.length === 0) {
      return null;
    }
    return validDates.reduce((latest, current) =>
      current > latest ? current : latest,
    );
  }

  /**
   * Extracts the 'id' field from a nested object in AMB metadata.
   * Used to extract URIs like educationalLevel.id and audience.id.
   * Returns null if the field is missing, null, or malformed.
   *
   * @param metadata - The AMB metadata object
   * @param fieldName - The name of the nested field (e.g., 'educationalLevel', 'audience')
   * @returns The extracted ID string or null
   */
  private extractNestedId(
    metadata: Record<string, unknown>,
    fieldName: string,
  ): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }

    const nestedField = metadata[fieldName];
    if (!nestedField || typeof nestedField !== 'object') {
      return null;
    }

    const id = (nestedField as Record<string, unknown>).id;
    if (typeof id === 'string' && id.length > 0) {
      return id;
    }

    return null;
  }

  /**
   * Extracts file metadata fields from a kind 1063 (File) Nostr event.
   * This is the shared implementation used by both extractOerFromEvent and updateFileMetadata.
   *
   * @param fileEvent - The kind 1063 (File) event to extract from
   * @returns File metadata fields
   */
  private extractFileMetadataFromEvent(
    fileEvent: NostrEvent,
  ): FileMetadataFields {
    const mimeType = findTagValue(fileEvent.tags, 'm');
    const dim = findTagValue(fileEvent.tags, 'dim');
    const sizeStr = findTagValue(fileEvent.tags, 'size');
    const size = parseBigInt(sizeStr);
    const alt = findTagValue(fileEvent.tags, 'alt');
    const description =
      findTagValue(fileEvent.tags, 'description') ||
      (fileEvent.content ? fileEvent.content : null);

    return {
      mimeType,
      dim,
      size,
      alt,
      description,
    };
  }

  /**
   * Extracts license information from event tags.
   *
   * @param tags - Event tags array
   * @returns License information
   */
  private extractLicenseInfo(tags: string[][]): LicenseInfo {
    const uri = findTagValue(tags, 'license:id');
    const freeToUseStr = findTagValue(tags, 'isAccessibleForFree');
    const freeToUse = parseBoolean(freeToUseStr);

    return {
      uri,
      freeToUse,
    };
  }

  /**
   * Extracts keywords from 't' tags.
   *
   * @param tags - Event tags array
   * @returns Array of keywords or null if none found
   */
  private extractKeywords(tags: string[][]): string[] | null {
    const keywords = extractTagValues(tags, 't');
    return keywords.length > 0 ? keywords : null;
  }

  /**
   * Creates a DateFields object with parsed dates and the latest date.
   *
   * @param created - Raw date created value
   * @param published - Raw date published value
   * @param modified - Raw date modified value
   * @returns DateFields object
   */
  private createDateFields(
    created: unknown,
    published: unknown,
    modified: unknown,
  ): DateFields {
    const parsedCreated = this.parseDate(created);
    const parsedPublished = this.parseDate(published);
    const parsedModified = this.parseDate(modified);
    const latest = this.getLatestDate(
      parsedCreated,
      parsedPublished,
      parsedModified,
    );

    return {
      created: parsedCreated,
      published: parsedPublished,
      modified: parsedModified,
      latest,
    };
  }

  /**
   * Extracts date fields from amb_metadata stored in an OER record.
   *
   * @param ambMetadata - The amb_metadata JSON object
   * @returns DateFields extracted from the metadata
   */
  private extractDatesFromAmbMetadata(
    ambMetadata: Record<string, unknown> | null,
  ): DateFields {
    if (!ambMetadata) {
      return { created: null, published: null, modified: null, latest: null };
    }

    return this.createDateFields(
      ambMetadata['dateCreated'],
      ambMetadata['datePublished'],
      ambMetadata['dateModified'],
    );
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

    // Extract dates from existing record's amb_metadata
    const existingDates = this.extractDatesFromAmbMetadata(
      existing.amb_metadata,
    );

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
    const isMissingFileMetadata = !existing.event_file_id && newFileEventId;
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
   * Normalizes the inLanguage field to always be an array.
   * If it's a string, wraps it in an array. If it's already an array, returns as-is.
   * If it's missing or invalid, returns null to remove it from metadata.
   *
   * @param value - The inLanguage value from metadata
   * @returns Array of language codes or null
   */
  private normalizeInLanguage(value: unknown): string[] | null {
    // If it's already an array, return as-is
    if (Array.isArray(value)) {
      return value.length > 0 ? value : null;
    }

    // If it's a string, wrap it in an array
    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }

    // Otherwise, return null to remove from metadata
    return null;
  }

  /**
   * Extracts all AMB metadata from a Nostr event into a structured object.
   *
   * @param nostrEvent - The kind 30142 (AMB) event to extract from
   * @returns AMB metadata object
   */
  private extractAmbMetadata(nostrEvent: NostrEvent): AmbMetadata {
    // Extract URL from "d" tag (the resource URL)
    const url = findTagValue(nostrEvent.tags, 'd');

    // Parse all tags to create nested JSON metadata structure
    const parsedMetadata = parseColonSeparatedTags(nostrEvent.tags);

    // Normalize inLanguage field to always be an array
    const normalizedLanguage = this.normalizeInLanguage(
      parsedMetadata.inLanguage,
    );
    if (normalizedLanguage !== null) {
      parsedMetadata.inLanguage = normalizedLanguage;
    } else {
      delete parsedMetadata.inLanguage;
    }

    // Extract URI fields from AMB metadata
    const educationalLevelUri = this.extractNestedId(
      parsedMetadata,
      'educationalLevel',
    );
    const audienceUri = this.extractNestedId(parsedMetadata, 'audience');

    // Extract and parse date fields from AMB metadata
    const dates = this.createDateFields(
      parsedMetadata.dateCreated,
      parsedMetadata.datePublished,
      parsedMetadata.dateModified,
    );

    // Extract license information
    const license = this.extractLicenseInfo(nostrEvent.tags);

    // Extract keywords from "t" tags
    const keywords = this.extractKeywords(nostrEvent.tags);

    // Extract file event reference
    const fileEventId = findEventIdByMarker(nostrEvent.tags, 'file');

    return {
      url,
      parsedMetadata,
      educationalLevelUri,
      audienceUri,
      dates,
      license,
      keywords,
      fileEventId,
    };
  }

  /**
   * Builds an OER object from extracted metadata.
   * Returns a plain object suitable for passing to repository.create().
   *
   * @param ambMetadata - AMB metadata extracted from the event
   * @param fileMetadata - File metadata (if available)
   * @param eventAmbId - The AMB event ID
   * @returns Plain object with OER fields
   */
  private buildOerObject(
    ambMetadata: AmbMetadata,
    fileMetadata: FileMetadata | null,
    eventAmbId: string,
  ): Partial<OpenEducationalResource> {
    return {
      url: ambMetadata.url,
      license_uri: ambMetadata.license.uri,
      free_to_use: ambMetadata.license.freeToUse,
      file_mime_type: fileMetadata?.mimeType ?? null,
      amb_metadata: ambMetadata.parsedMetadata,
      keywords: ambMetadata.keywords,
      file_dim: fileMetadata?.dim ?? null,
      file_size: fileMetadata?.size ?? null,
      file_alt: fileMetadata?.alt ?? null,
      description: fileMetadata?.description ?? null,
      audience_uri: ambMetadata.audienceUri,
      educational_level_uri: ambMetadata.educationalLevelUri,
      source: DEFAULT_SOURCE,
      event_amb_id: eventAmbId,
      event_file_id: fileMetadata?.eventId ?? null,
    };
  }

  /**
   * Populates an OER entity with extracted metadata.
   * This method is used for updating existing records.
   *
   * @param oer - The OER entity to populate
   * @param ambMetadata - AMB metadata extracted from the event
   * @param fileMetadata - File metadata (if available)
   * @param eventAmbId - The AMB event ID
   */
  private populateOerEntity(
    oer: OpenEducationalResource,
    ambMetadata: AmbMetadata,
    fileMetadata: FileMetadata | null,
    eventAmbId: string,
  ): void {
    oer.url = ambMetadata.url;
    oer.license_uri = ambMetadata.license.uri;
    oer.free_to_use = ambMetadata.license.freeToUse;
    oer.file_mime_type = fileMetadata?.mimeType ?? null;
    oer.amb_metadata = ambMetadata.parsedMetadata;
    oer.keywords = ambMetadata.keywords;
    oer.file_dim = fileMetadata?.dim ?? null;
    oer.file_size = fileMetadata?.size ?? null;
    oer.file_alt = fileMetadata?.alt ?? null;
    oer.description = fileMetadata?.description ?? null;
    oer.audience_uri = ambMetadata.audienceUri;
    oer.educational_level_uri = ambMetadata.educationalLevelUri;
    oer.source = DEFAULT_SOURCE;
    oer.event_amb_id = eventAmbId;
    oer.event_file_id = fileMetadata?.eventId ?? null;
  }

  /**
   * Fetches and extracts file metadata from a kind 1063 (File) Nostr event.
   * Returns null if the event doesn't exist, is the wrong kind, or lookup fails.
   *
   * @param fileEventId - The ID of the file event to fetch
   * @returns File metadata or null
   */
  private async extractFileMetadata(
    fileEventId: string | null,
  ): Promise<FileMetadata | null> {
    if (!fileEventId) {
      return null;
    }

    try {
      const fileEvent = await this.nostrEventRepository.findOne({
        where: { id: fileEventId },
      });

      if (!fileEvent) {
        this.logger.debug(
          `File event ${fileEventId} not found, will skip setting event_file_id`,
        );
        return null;
      }

      if (fileEvent.kind !== EVENT_FILE_KIND) {
        this.logger.warn(
          `Referenced event ${fileEventId} is not kind ${EVENT_FILE_KIND} (found kind: ${fileEvent.kind})`,
        );
        return null;
      }

      // Extract file metadata fields
      const fields = this.extractFileMetadataFromEvent(fileEvent);

      return {
        eventId: fileEventId,
        ...fields,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch file event ${fileEventId}: ${error}`);
      // Return null to continue with extraction even if file event lookup fails
      return null;
    }
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
        `Successfully ${isUpdate ? 'updated' : 'created'} OER record ${savedOer.id} for event ${oer.event_amb_id}`,
      );

      return savedOer;
    } catch (saveError) {
      // Handle race condition: another process may have created the same URL between our check and save
      if (DatabaseErrorClassifier.isDuplicateKeyError(saveError)) {
        this.logger.debug(
          `Duplicate URL ${url} detected for event ${oer.event_amb_id}, returning existing record`,
        );

        // Fetch and return the existing record
        const duplicateOer = url
          ? await this.oerRepository.findOne({ where: { url } })
          : null;

        if (duplicateOer) {
          return duplicateOer;
        }

        // If we still can't find the record, something is wrong - rethrow
        this.logger.error(
          `Duplicate key error but could not find existing record for URL ${url}`,
        );
        throw saveError;
      }

      // Not a duplicate key error - rethrow
      throw saveError;
    }
  }
}
