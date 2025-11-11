import { OpenEducationalResource } from '../entities/open-educational-resource.entity';

export interface OerMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Omit TypeORM relations from API response
export type OerItem = Omit<OpenEducationalResource, 'eventAmb' | 'eventFile'>;

export interface OerListResponse {
  data: OerItem[];
  meta: OerMetadata;
}
