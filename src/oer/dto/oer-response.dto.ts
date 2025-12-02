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

// Omit TypeORM relations from API response, add images, source, and creators
// created_at and updated_at can be null for external adapter items (not stored in DB)
export type OerItem = Omit<
  OpenEducationalResource,
  'eventAmb' | 'eventFile' | 'created_at' | 'updated_at'
> & {
  images: ImageUrls | null;
  source: string;
  creators: Creator[];
  created_at: Date | null;
  updated_at: Date | null;
};

export interface OerListResponse {
  data: OerItem[];
  meta: OerMetadata;
}
