/**
 * Interface for OER Source entity as used by Nostr services.
 * The actual entity is defined in the main application.
 */
export interface OerSourceEntity {
  id: string;
  source_name: string;
  source_identifier: string;
  source_data: Record<string, unknown>;
  source_uri: string | null;
  source_timestamp: number | null;
  source_record_type: string | null;
  status: 'pending' | 'processed' | 'failed';
  oer_id: string | null;
  oer?: OpenEducationalResourceEntity | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Open Educational Resource entity as used by Nostr services.
 * The actual entity is defined in the main application.
 */
export interface OpenEducationalResourceEntity {
  id: string;
  url: string;
  source_name?: string;
  file_mime_type: string | null;
  file_size: number | null;
  file_dim: string | null;
  file_alt: string | null;
  description?: string | null;
  license_uri?: string | null;
  free_to_use?: boolean | null;
  metadata?: Record<string, unknown> | null;
  metadata_type?: string | null;
  keywords?: string[] | null;
  audience_uri?: string | null;
  educational_level_uri?: string | null;
  name?: string | null;
  attribution?: string | null;
  sources?: OerSourceEntity[];
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for OER Extraction Service as used by NostrClientService.
 * The actual service is defined in the main application.
 */
export interface OerExtractionServiceInterface {
  shouldExtractOer(eventKind: number): boolean;
  extractOerFromSource(source: OerSourceEntity): Promise<void>;
  findOersWithMissingFileMetadata(): Promise<OpenEducationalResourceEntity[]>;
  updateFileMetadata(oer: OpenEducationalResourceEntity): Promise<void>;
}
