/**
 * Local copies of types from @edufeed-org/oer-adapter-core.
 *
 * Defined here so that the emitted .d.ts files are self-contained
 * and consumers don't need oer-adapter-core installed.
 *
 * IMPORTANT: These must stay in sync with the canonical definitions in
 * packages/oer-adapter-core/src/adapter.interface.ts.
 * When updating adapter-core types, update this file accordingly.
 */

export interface ImageUrls {
  high: string;
  medium: string;
  small: string;
}

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

export interface ExternalOerExtensions {
  images?: ImageUrls | null;
  foreignLandingUrl?: string | null;
  attribution?: string | null;
}

export interface ExternalOerItem {
  id: string;
  amb: AmbMetadata;
  extensions: ExternalOerExtensions;
}

export interface AdapterSearchOptions {
  signal?: AbortSignal;
}

export interface AdapterSearchQuery {
  keywords?: string;
  type?: string;
  license?: string;
  language?: string;
  educationalLevel?: string;
  page: number;
  pageSize: number;
}

export interface AdapterSearchResult {
  items: ExternalOerItem[];
  total: number;
}

export interface AdapterCapabilities {
  readonly supportedLanguages?: readonly string[];
  readonly supportedTypes?: readonly string[];
  readonly supportsLicenseFilter: boolean;
  readonly supportsEducationalLevelFilter: boolean;
}

export interface SourceAdapter {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly capabilities: AdapterCapabilities;
  search(query: AdapterSearchQuery, options?: AdapterSearchOptions): Promise<AdapterSearchResult>;
}
