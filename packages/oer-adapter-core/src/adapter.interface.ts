/**
 * Image URLs at different resolutions.
 * Matches the existing ImgProxyUrls structure used by the OER API.
 */
export interface ImageUrls {
  /** Full resolution or largest available */
  high: string;
  /** Approximately 400px width */
  medium: string;
  /** Approximately 200px width or thumbnail */
  small: string;
}

/**
 * Creator information - person or organization.
 */
export interface Creator {
  /** Type of creator, e.g., "person", "organization" */
  type: string;
  /** Name of the creator, e.g., "Max Mustermann" */
  name: string;
  /** URL to external provider profile/resource, or null if unavailable */
  link: string | null;
}

/**
 * OER item returned by external adapters.
 * This is the normalized format that all adapters must return.
 */
export interface ExternalOerItem {
  /** Unique identifier for this resource (from the external source) */
  id: string;
  /** URL to the resource */
  url: string;
  /** URL to the resource's landing page on the original source website */
  foreign_landing_url: string | null;
  /** Name/title of the resource */
  name: string | null;
  /** Description of the resource */
  description: string | null;
  /** Attribution/copyright notice for the resource (displayed below the card) */
  attribution: string | null;
  /** List of keywords/tags */
  keywords: string[];
  /** License URI */
  license_uri: string | null;
  /** Whether the resource is free to use */
  free_to_use: boolean | null;
  /** MIME type of the file */
  file_mime_type: string | null;
  /** File size in bytes */
  file_size: number | null;
  /** File dimensions, e.g., "1920x1080" */
  file_dim: string | null;
  /** Alt text for accessibility */
  file_alt: string | null;
  /** Image URLs at different resolutions */
  images: ImageUrls | null;
  /** List of creators (persons or organizations) */
  creators: Creator[];
}

/**
 * OER item with source identification.
 * Used after the merge layer adds the source field.
 */
export interface ExternalOerItemWithSource extends ExternalOerItem {
  /** Identifier of the source adapter (e.g., "arasaac", "wikimedia") */
  source: string;
}

/**
 * Options passed to adapter search method.
 */
export interface AdapterSearchOptions {
  /** AbortSignal for cancelling the request on timeout */
  signal?: AbortSignal;
}

/**
 * Search query parameters passed to adapters.
 * This is a subset of OerQueryDto fields relevant to external searches.
 */
export interface AdapterSearchQuery {
  /** Keyword search term */
  keywords?: string;
  /** Resource type filter */
  type?: string;
  /** License URI filter */
  license?: string;
  /** Language code filter (2-3 chars) */
  language?: string;
  /** Page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}

/**
 * Search result returned by adapters.
 */
export interface AdapterSearchResult {
  /** List of OER items matching the query */
  items: ExternalOerItem[];
  /** Total number of items available (for pagination) */
  total: number;
}

/**
 * Interface that all source adapters must implement.
 */
export interface SourceAdapter {
  /** Unique identifier for this source (e.g., "arasaac", "wikimedia") */
  readonly sourceId: string;

  /** Human-readable source name (e.g., "ARASAAC", "Wikimedia Commons") */
  readonly sourceName: string;

  /**
   * Search for OER matching the query.
   * @param query - Search parameters
   * @param options - Optional settings including AbortSignal for cancellation
   * @returns Promise resolving to search results mapped to the OER API model
   */
  search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult>;
}
