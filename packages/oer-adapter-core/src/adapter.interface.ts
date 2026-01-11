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
 * AMB (Allgemeines Metadatenprofil für Bildungsressourcen) metadata.
 * Standards-compliant educational resource metadata.
 * Reference: https://dini-ag-kim.github.io/amb/draft/
 */
export interface AmbMetadata {
  '@context'?: string | string[];
  id?: string;
  type?: string | string[];
  name?: string;
  description?: string;
  about?: unknown;
  keywords?: string[];
  inLanguage?: string[];
  image?: string;
  trailer?: unknown;
  creator?: unknown;
  contributor?: unknown;
  affiliation?: unknown;
  dateCreated?: string;
  datePublished?: string;
  dateModified?: string;
  publisher?: unknown;
  funder?: unknown;
  isAccessibleForFree?: boolean;
  license?: unknown;
  conditionsOfAccess?: unknown;
  learningResourceType?: unknown;
  audience?: unknown;
  teaches?: unknown;
  assesses?: unknown;
  competencyRequired?: unknown;
  educationalLevel?: unknown;
  interactivityType?: unknown;
  isBasedOn?: unknown;
  isPartOf?: unknown;
  hasPart?: unknown;
  mainEntityOfPage?: unknown;
  duration?: string;
  encoding?: unknown;
  caption?: unknown;
}

/**
 * Extensions for external OER items.
 * Contains non-AMB metadata like image URLs, foreign landing URL, and attribution.
 * Note: Resource URL should be in amb.id per Schema.org standard.
 */
export interface ExternalOerExtensions {
  /** Pre-generated image URLs at different resolutions (if source provides them) */
  images?: ImageUrls | null;
  /** URL to the resource's landing page on the original source website */
  foreign_landing_url?: string | null;
  /** Attribution/copyright notice for the resource */
  attribution?: string | null;
}

/**
 * OER item returned by external adapters.
 * This is the normalized AMB-based format that all adapters must return.
 */
export interface ExternalOerItem {
  /** Unique identifier for this resource (from the external source) */
  id: string;
  /** AMB (Allgemeines Metadatenprofil für Bildungsressourcen) metadata */
  amb: AmbMetadata;
  /** Extensions containing non-AMB metadata */
  extensions: ExternalOerExtensions;
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
