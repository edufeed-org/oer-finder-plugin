/**
 * Value objects and types for OER extraction
 */

/**
 * AMB metadata extracted from a Nostr event
 */
export interface AmbMetadata {
  /** Resource URL from 'd' tag */
  url: string | null;
  /** Full parsed metadata structure with nested objects */
  parsedMetadata: Record<string, unknown>;
  /** Educational level URI from educationalLevel.id */
  educationalLevelUri: string | null;
  /** Audience URI from audience.id */
  audienceUri: string | null;
  /** Date fields extracted from metadata */
  dates: DateFields;
  /** License information */
  license: LicenseInfo;
  /** Keywords from 't' tags */
  keywords: string[] | null;
  /** File event ID reference from first 'e' tag (kind 1063 event) */
  fileEventId: string | null;
}

/**
 * Date fields extracted from AMB metadata
 */
export interface DateFields {
  /** Date created */
  created: Date | null;
  /** Date published */
  published: Date | null;
  /** Date modified */
  modified: Date | null;
  /** Latest date among created, published, and modified */
  latest: Date | null;
}

/**
 * License information from AMB metadata
 */
export interface LicenseInfo {
  /** License URI from 'license:id' tag */
  uri: string | null;
  /** Whether resource is free to use */
  freeToUse: boolean | null;
}

/**
 * File metadata extracted from a kind 1063 (File) event
 */
export interface FileMetadata {
  /** File event ID */
  eventId: string;
  /** MIME type from 'm' tag */
  mimeType: string | null;
  /** Dimensions from 'dim' tag */
  dim: string | null;
  /** File size in bytes from 'size' tag */
  size: number | null;
  /** Alt text from 'alt' tag */
  alt: string | null;
  /** Description from 'description' tag or content field */
  description: string | null;
}

/**
 * File metadata fields (without eventId)
 */
export interface FileMetadataFields {
  /** MIME type from 'm' tag */
  mimeType: string | null;
  /** Dimensions from 'dim' tag */
  dim: string | null;
  /** File size in bytes from 'size' tag */
  size: number | null;
  /** Alt text from 'alt' tag */
  alt: string | null;
  /** Description from 'description' tag or content field */
  description: string | null;
}

/**
 * Update decision result
 */
export interface UpdateDecision {
  /** Whether to update the existing OER */
  shouldUpdate: boolean;
  /** Reason for the decision */
  reason: string;
}
