import { Injectable, Inject } from '@nestjs/common';
import { EVENT_AMB_KIND } from '../constants/event-kinds.constants';
import type {
  OerSource,
  OpenEducationalResource,
} from '@edufeed-org/oer-entities';
import { OerStorageService, OER_STORAGE_SERVICE } from './oer-storage.service';

/**
 * Injection token for OerExtractionService
 */
export const OER_EXTRACTION_SERVICE = 'OER_EXTRACTION_SERVICE';

/**
 * Facade service for OER extraction operations.
 *
 * This service provides backward-compatible API for consumers while
 * delegating actual database and extraction operations to OerStorageService.
 *
 * Primary responsibilities:
 * - Determining if events should trigger OER extraction
 * - Delegating extraction, storage, and update operations to OerStorageService
 */
@Injectable()
export class OerExtractionService {
  constructor(
    @Inject(OER_STORAGE_SERVICE)
    private readonly storageService: OerStorageService,
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
    return this.storageService.extractOerFromSource(oerSource);
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
  async findOersWithMissingFileMetadata(): Promise<OpenEducationalResource[]> {
    return this.storageService.findOersWithMissingFileMetadata();
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
    return this.storageService.updateFileMetadata(oer);
  }
}
