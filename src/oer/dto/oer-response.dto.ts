import { OpenEducationalResource } from '../entities/open-educational-resource.entity';

export interface OerMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImgProxyUrls {
  high: string;
  medium: string;
  small: string;
}

// Omit TypeORM relations from API response and add images
export type OerItem = Omit<
  OpenEducationalResource,
  'eventAmb' | 'eventFile'
> & {
  images: ImgProxyUrls | null;
};

export interface OerListResponse {
  data: OerItem[];
  meta: OerMetadata;
}
