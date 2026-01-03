import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  parseColonSeparatedTags,
  extractTagValues,
  findTagValue,
  parseBoolean,
  parseBigInt,
} from '../utils/tag-parser.util';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../constants/event-kinds.constants';
import {
  FileMetadataFields,
  LicenseInfo,
  DateFields,
  UpdateDecision,
  AmbMetadata,
  FileMetadata,
} from '../types/extraction.types';
import {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
} from '../constants/source.constants';
import { filterAmbMetadata } from '../schemas/amb-metadata.schema';
import {
  parseNostrEventData,
  type NostrEventData,
} from '../schemas/nostr-event.schema';
import type {
  OerSourceEntity,
  OpenEducationalResourceEntity,
} from '../types/entities.types';
import { OER_SOURCE_REPOSITORY } from './nostr-event-database.service';
import { OER_REPOSITORY } from './event-deletion.service';

/**
 * Injection token for OerExtractionService
 */
export const OER_EXTRACTION_SERVICE = 'OER_EXTRACTION_SERVICE';

@Injectable()
export class OerExtractionService {
  private readonly logger = new Logger(OerExtractionService.name);

  constructor(
    @Inject(OER_REPOSITORY)
    private readonly oerRepository: Repository<OpenEducationalResourceEntity>,
    @Inject(OER_SOURCE_REPOSITORY)
    private readonly oerSourceRepository: Repository<OerSourceEntity>,
  ) {}

  /**
   * Backwards-compatible method for extracting OER from a NostrEvent-like object.
   * Creates a temporary OerSource and delegates to extractOerFromSource.
   *
   * @deprecated Use extractOerFromSource instead
   * @param nostrEvent - The kind 30142 (AMB) Nostr event to extract from
   * @returns The created or updated OER record
   */
  async extractOerFromEvent(nostrEvent: {
    id: string;
    kind: number;
    pubkey: string;
    created_at: number;
    content: string;
    tags: string[][];
    sig?: string;
    relay_url?: string | null;
    raw_event?: Record<string, unknown>;
  }): Promise<OpenEducationalResourceEntity> {
    const sourceIdentifier = createNostrSourceIdentifier(nostrEvent.id);

    // Check if a source with this identifier already exists
    let source = await this.oerSourceRepository.findOne({
      where: {
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
      },
    });

    if (source) {
      // Update existing source with latest data
      source.source_data =
        nostrEvent.raw_event ||
        (nostrEvent as unknown as Record<string, unknown>);
      source.source_uri = nostrEvent.relay_url || source.source_uri;
      source.source_timestamp = nostrEvent.created_at;
      source.source_record_type = String(nostrEvent.kind);
      source.updated_at = new Date();
    } else {
      // Create a new OerSource object
      source = {
        id: crypto.randomUUID(),
        oer_id: null,
        oer: null,
        source_name: SOURCE_NAME_NOSTR,
        source_identifier: sourceIdentifier,
        source_data:
          nostrEvent.raw_event ||
          (nostrEvent as unknown as Record<string, unknown>),
        status: 'pending',
        source_uri: nostrEvent.relay_url || null,
        source_timestamp: nostrEvent.created_at,
        source_record_type: String(nostrEvent.kind),
        created_at: new Date(),
        updated_at: new Date(),
      } as OerSourceEntity;
    }

    return this.extractOerFromSource(source);
  }

  /**
   * Extracts OER metadata from a kind 30142 (AMB) OerSource and creates or updates an OER record.
   * This method is called synchronously during event ingestion.
   * If a record with the same URL already exists, it will be updated only if the new event is newer.
   *
   * @param oerSource - The OerSource containing a kind 30142 (AMB) Nostr event
   * @returns The created or updated OER record
   */
  async extractOerFromSource(
    oerSource: OerSourceEntity,
  ): Promise<OpenEducationalResourceEntity> {
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
      const ambMetadata = this.extractAmbMetadata(nostrEvent);

      // Check if an OER with this URL and source already exists
      // Each source has its own entry for the same URL (unique constraint on url + source_name)
      let existingOer: OpenEducationalResourceEntity | null = null;
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
      const fileMetadata = await this.extractFileMetadata(
        ambMetadata.fileEventId,
      );

      // Create or update OER record
      let oer: OpenEducationalResourceEntity;
      if (existingOer) {
        // Update existing record
        this.populateOerEntity(existingOer, ambMetadata, fileMetadata);
        oer = existingOer;
      } else {
        // Create new record with all fields
        oer = this.oerRepository.create(
          this.buildOerObject(ambMetadata, fileMetadata),
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
   * Checks if an event should trigger OER extraction.
   *
   * @param eventKind - The kind of Nostr event
   * @returns True if OER extraction should be performed
   */
  shouldExtractOer(eventKind: number): boolean {
    return eventKind === EVENT_AMB_KIND;
  }

  /**
   * Finds OER records that are missing file metadata.
   * This happens when the OER was extracted before the file event arrived,
   * or when file metadata extraction failed.
   *
   * @returns Array of OER records with missing file metadata
   */
  async findOersWithMissingFileMetadata(): Promise<
    OpenEducationalResourceEntity[]
  > {
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
    oer: OpenEducationalResourceEntity,
  ): Promise<OpenEducationalResourceEntity> {
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
        const fileMetadata = await this.extractFileMetadata(fileEventId);

        if (fileMetadata) {
          // Update OER record with file metadata
          oer.file_mime_type = fileMetadata.mimeType;
          oer.file_dim = fileMetadata.dim;
          oer.file_size = fileMetadata.size;
          oer.file_alt = fileMetadata.alt;
          oer.description = fileMetadata.description;

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
   * Extracts file metadata fields from a kind 1063 (File) Nostr event data.
   * This is the shared implementation used by both extractOerFromSource and updateFileMetadata.
   *
   * @param fileEventData - The kind 1063 (File) event data to extract from
   * @returns File metadata fields
   */
  private extractFileMetadataFromEventData(
    fileEventData: NostrEventData,
  ): FileMetadataFields {
    const mimeType = findTagValue(fileEventData.tags, 'm');
    const dim = findTagValue(fileEventData.tags, 'dim');
    const sizeStr = findTagValue(fileEventData.tags, 'size');
    const size = parseBigInt(sizeStr);
    const alt = findTagValue(fileEventData.tags, 'alt');
    const description =
      findTagValue(fileEventData.tags, 'description') ||
      (fileEventData.content ? fileEventData.content : null);

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
   * Extracts date fields from metadata stored in an OER record.
   *
   * @param metadata - The metadata JSON object
   * @returns DateFields extracted from the metadata
   */
  private extractDatesFromMetadata(
    metadata: Record<string, unknown> | null,
  ): DateFields {
    if (!metadata) {
      return { created: null, published: null, modified: null, latest: null };
    }

    return this.createDateFields(
      metadata['dateCreated'],
      metadata['datePublished'],
      metadata['dateModified'],
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
    existing: OpenEducationalResourceEntity,
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
    const existingDates = this.extractDatesFromMetadata(
      existing.metadata ?? null,
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
   * Extracts all AMB metadata from a Nostr event data into a structured object.
   *
   * @param nostrEventData - The kind 30142 (AMB) event data to extract from
   * @returns AMB metadata object
   */
  private extractAmbMetadata(nostrEventData: NostrEventData): AmbMetadata {
    // Extract URL from "d" tag (the resource URL)
    const url = findTagValue(nostrEventData.tags, 'd');

    // Parse all tags to create nested JSON metadata structure
    // Then filter to only include AMB-compliant fields (strips Nostr-specific tags like d, e, t)
    const rawParsedMetadata = parseColonSeparatedTags(nostrEventData.tags);
    const parsedMetadata = filterAmbMetadata(rawParsedMetadata);

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
    const license = this.extractLicenseInfo(nostrEventData.tags);

    // Extract keywords from "t" tags
    const keywords = this.extractKeywords(nostrEventData.tags);

    // Extract file event reference (first 'e' tag pointing to a kind 1063 event)
    const fileEventId = findTagValue(nostrEventData.tags, 'e');

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
   * Source tracking is handled separately via OerSource entities.
   *
   * @param ambMetadata - AMB metadata extracted from the event
   * @param fileMetadata - File metadata (if available)
   * @returns Plain object with OER fields
   */
  private buildOerObject(
    ambMetadata: AmbMetadata,
    fileMetadata: FileMetadata | null,
  ): Partial<OpenEducationalResourceEntity> {
    return {
      url: ambMetadata.url ?? '',
      // source_name identifies which source system owns/controls this OER entry
      source_name: SOURCE_NAME_NOSTR,
      license_uri: ambMetadata.license.uri,
      free_to_use: ambMetadata.license.freeToUse,
      file_mime_type: fileMetadata?.mimeType ?? null,
      metadata: ambMetadata.parsedMetadata,
      metadata_type: 'amb',
      keywords: ambMetadata.keywords,
      file_dim: fileMetadata?.dim ?? null,
      file_size: fileMetadata?.size ?? null,
      file_alt: fileMetadata?.alt ?? null,
      description: fileMetadata?.description ?? null,
      audience_uri: ambMetadata.audienceUri,
      educational_level_uri: ambMetadata.educationalLevelUri,
      name: ambMetadata.parsedMetadata.name as string | null,
      attribution: ambMetadata.parsedMetadata.author as string | null,
    };
  }

  /**
   * Populates an OER entity with extracted metadata.
   * This method is used for updating existing records.
   * Source tracking is handled separately via OerSource entities.
   *
   * @param oer - The OER entity to populate
   * @param ambMetadata - AMB metadata extracted from the event
   * @param fileMetadata - File metadata (if available)
   */
  private populateOerEntity(
    oer: OpenEducationalResourceEntity,
    ambMetadata: AmbMetadata,
    fileMetadata: FileMetadata | null,
  ): void {
    oer.url = ambMetadata.url ?? '';
    // source_name should already be set for existing records, but ensure it's correct
    oer.source_name = SOURCE_NAME_NOSTR;
    oer.license_uri = ambMetadata.license.uri;
    oer.free_to_use = ambMetadata.license.freeToUse;
    oer.file_mime_type = fileMetadata?.mimeType ?? null;
    oer.metadata = ambMetadata.parsedMetadata;
    oer.metadata_type = 'amb';
    oer.keywords = ambMetadata.keywords;
    oer.file_dim = fileMetadata?.dim ?? null;
    oer.file_size = fileMetadata?.size ?? null;
    oer.file_alt = fileMetadata?.alt ?? null;
    oer.description = fileMetadata?.description ?? null;
    oer.audience_uri = ambMetadata.audienceUri;
    oer.educational_level_uri = ambMetadata.educationalLevelUri;
    oer.name = ambMetadata.parsedMetadata.name as string | null;
    oer.attribution = ambMetadata.parsedMetadata.author as string | null;
  }

  /**
   * Fetches and extracts file metadata from a kind 1063 (File) Nostr event source.
   * Returns null if the event source doesn't exist, is the wrong kind, or lookup fails.
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
      const fields = this.extractFileMetadataFromEventData(parseResult.data);

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
    oer: OpenEducationalResourceEntity,
    url: string | null,
    isUpdate: boolean,
  ): Promise<OpenEducationalResourceEntity> {
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
    oer: OpenEducationalResourceEntity,
    ambSource: OerSourceEntity,
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
}
