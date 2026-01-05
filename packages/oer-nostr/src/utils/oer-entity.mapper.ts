import { SOURCE_NAME_NOSTR } from '../constants/source.constants';
import type {
  AmbMetadata,
  FileMetadata,
  FileMetadataFields,
} from '../types/extraction.types';
import type { OpenEducationalResource } from '@edufeed-org/oer-entities';

/**
 * Builds an OER object from extracted metadata.
 * Returns a plain object suitable for passing to repository.create().
 * Source tracking is handled separately via OerSource entities.
 *
 * @param ambMetadata - AMB metadata extracted from the event
 * @param fileMetadata - File metadata (if available)
 * @returns Plain object with OER fields
 */
export function buildOerEntity(
  ambMetadata: AmbMetadata,
  fileMetadata: FileMetadata | null,
): Partial<OpenEducationalResource> {
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
 * Updates an OER entity with extracted metadata.
 * This function mutates the provided entity.
 * Source tracking is handled separately via OerSource entities.
 *
 * @param oer - The OER entity to update
 * @param ambMetadata - AMB metadata extracted from the event
 * @param fileMetadata - File metadata (if available)
 */
export function updateOerEntity(
  oer: OpenEducationalResource,
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
 * Applies file metadata fields to an OER entity.
 * This function mutates the provided entity.
 * Used when updating an existing OER with newly fetched file metadata.
 *
 * @param oer - The OER entity to update
 * @param fileMetadata - File metadata fields to apply
 */
export function applyFileMetadataToEntity(
  oer: OpenEducationalResource,
  fileMetadata: FileMetadataFields,
): void {
  oer.file_mime_type = fileMetadata.mimeType;
  oer.file_dim = fileMetadata.dim;
  oer.file_size = fileMetadata.size;
  oer.file_alt = fileMetadata.alt;
  oer.description = fileMetadata.description;
}
