import type { ImageUrls, AmbMetadata } from '@edufeed-org/oer-adapter-core';

// Re-export shared types from adapter-core for convenience
export type { ImageUrls, AmbMetadata } from '@edufeed-org/oer-adapter-core';

export interface OerMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Creator information - person or organization.
 */
export interface Creator {
  /** Type of creator, e.g., "person", "organization" */
  type: string;
  /** Name of the creator */
  name: string;
  /** URL to external provider profile/resource, or null if unavailable */
  link: string | null;
}

/**
 * Information about a source that provided data for an OER.
 * Each OER can have multiple sources that contributed to its metadata.
 */
export interface OerSourceInfo {
  /**
   * Name/category of the source system (e.g., 'nostr', 'arasaac', 'openverse')
   */
  source_name: string;

  /**
   * Optional detailed identifier within the source type.
   * For Nostr: 'event:{event_id}' or 'event:{id}@relay:{url}'
   * For external APIs: Resource ID, API endpoint, etc.
   */
  source_identifier: string | null;

  /**
   * When this source was first associated with the OER
   */
  created_at: Date;
}

/**
 * File metadata extensions (dimensions and alt text not covered by AMB).
 * Note: MIME type and file size should be in AMB encoding field.
 */
export interface FileMetadataExtensions {
  fileDim?: string | null;
  fileAlt?: string | null;
}

/**
 * System extensions (source info, etc.).
 * Note: Creators are in amb.creator per AMB standard.
 * Note: Resource URL is in amb.id per Schema.org standard.
 */
export interface SystemExtensions {
  source: string;
  foreignLandingUrl?: string | null;
  attribution?: string | null;
}

/**
 * Extensions namespace for non-AMB metadata.
 */
export interface OerExtensions {
  fileMetadata?: FileMetadataExtensions | null;
  images?: ImageUrls | null;
  system: SystemExtensions;
}

/**
 * OER item with AMB metadata and extensions.
 */
export interface OerItem {
  amb: AmbMetadata;
  extensions: OerExtensions;
}

/**
 * OER list response with data and metadata.
 */
export interface OerListResponse {
  data: OerItem[];
  meta: OerMetadata;
}
