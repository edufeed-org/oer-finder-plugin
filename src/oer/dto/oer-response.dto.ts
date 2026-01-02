import type { ImageUrls, Creator } from '@edufeed-org/oer-adapter-core';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';

// Re-export shared types from adapter-core for convenience
export type { ImageUrls, Creator } from '@edufeed-org/oer-adapter-core';

export interface OerMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

// Omit TypeORM relations from API response, add images, sources, and creators
// created_at and updated_at can be null for external adapter items (not stored in DB)
// url_external_landing_page is mapped to foreign_landing_url in the API
export type OerItem = Omit<
  OpenEducationalResource,
  'sources' | 'created_at' | 'updated_at' | 'url_external_landing_page'
> & {
  images: ImageUrls | null;
  /**
   * All sources that have provided data for this OER.
   * Ordered by created_at (oldest first) for deterministic ordering.
   */
  sources: OerSourceInfo[];
  creators: Creator[];
  created_at: Date | null;
  updated_at: Date | null;
  foreign_landing_url: string | null;
};

export interface OerListResponse {
  data: OerItem[];
  meta: OerMetadata;
}
