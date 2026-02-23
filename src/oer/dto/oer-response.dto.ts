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
