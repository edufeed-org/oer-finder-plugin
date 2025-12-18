/**
 * Openverse API types
 * Based on https://api.openverse.org/v1/ API
 */
import * as v from 'valibot';

/**
 * Valibot schema for tag entry
 */
export const OpenverseTagSchema = v.object({
  name: v.string(),
  accuracy: v.optional(v.nullable(v.number())),
});

/**
 * Tag entry with name and accuracy
 */
export type OpenverseTag = v.InferOutput<typeof OpenverseTagSchema>;

/**
 * Valibot schema for individual image data from the Openverse API search response
 */
export const OpenverseImageSchema = v.object({
  /** Unique identifier */
  id: v.string(),
  /** Title of the image */
  title: v.nullable(v.string()),
  /** URL to the image on the source site */
  foreign_landing_url: v.string(),
  /** Direct URL to the image file */
  url: v.string(),
  /** Creator name */
  creator: v.optional(v.nullable(v.string())),
  /** URL to creator's page */
  creator_url: v.optional(v.nullable(v.string())),
  /** License code (e.g., "cc0", "by", "by-sa", "by-nc", "by-nd", "by-nc-sa", "by-nc-nd", "pdm") */
  license: v.string(),
  /** License version (e.g., "1.0", "2.0", "3.0", "4.0") */
  license_version: v.nullable(v.string()),
  /** Full license URL */
  license_url: v.optional(v.nullable(v.string())),
  /** Source provider name */
  provider: v.optional(v.nullable(v.string())),
  /** Source name */
  source: v.optional(v.nullable(v.string())),
  /** Category of the image */
  category: v.optional(v.nullable(v.string())),
  /** File type/extension */
  filetype: v.optional(v.nullable(v.string())),
  /** File size in bytes */
  filesize: v.optional(v.nullable(v.number())),
  /** Tags associated with the image */
  tags: v.optional(v.nullable(v.array(OpenverseTagSchema))),
  /** Attribution text */
  attribution: v.optional(v.nullable(v.string())),
  /** Image height in pixels */
  height: v.optional(v.nullable(v.number())),
  /** Image width in pixels */
  width: v.optional(v.nullable(v.number())),
  /** Thumbnail URL */
  thumbnail: v.optional(v.nullable(v.string())),
  /** Detail page URL in Openverse */
  detail_url: v.optional(v.nullable(v.string())),
  /** Related URL */
  related_url: v.optional(v.nullable(v.string())),
});

/**
 * Individual image data from the Openverse API search response
 */
export type OpenverseImage = v.InferOutput<typeof OpenverseImageSchema>;

/**
 * Valibot schema for the Openverse API search response
 */
export const OpenverseSearchResponseSchema = v.object({
  /** Total number of results */
  result_count: v.number(),
  /** Total number of pages available */
  page_count: v.number(),
  /** Current page number */
  page: v.optional(v.number()),
  /** Number of results per page */
  page_size: v.optional(v.number()),
  /** Array of image results */
  results: v.array(OpenverseImageSchema),
});

/**
 * Openverse API search response
 */
export type OpenverseSearchResponse = v.InferOutput<
  typeof OpenverseSearchResponseSchema
>;

/**
 * Parses and validates the Openverse API search response.
 * Throws a ValiError if the response doesn't match the expected schema.
 */
export function parseOpenverseSearchResponse(
  data: unknown,
): OpenverseSearchResponse {
  return v.parse(OpenverseSearchResponseSchema, data);
}
