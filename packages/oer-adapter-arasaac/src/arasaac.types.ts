/**
 * ARASAAC API types
 * Based on https://api.arasaac.org API
 */
import * as v from 'valibot';

/**
 * Valibot schema for keyword entry
 */
export const ArasaacKeywordSchema = v.object({
  keyword: v.string(),
  type: v.number(),
  meaning: v.optional(v.string()),
  plural: v.optional(v.string()),
});

/**
 * Keyword entry with language-specific text
 */
export type ArasaacKeyword = v.InferOutput<typeof ArasaacKeywordSchema>;

/**
 * Valibot schema for individual pictogram data from the ARASAAC API search response
 */
export const ArasaacPictogramSchema = v.object({
  /** Unique pictogram identifier */
  _id: v.number(),
  /** Whether the pictogram is schematic */
  schematic: v.boolean(),
  /** Whether sex is represented */
  sex: v.boolean(),
  /** Whether violence is depicted */
  violence: v.boolean(),
  /** Whether AAC is applicable */
  aac: v.boolean(),
  /** AAC color indicator */
  aacColor: v.boolean(),
  /** Whether skin variations are available */
  skin: v.boolean(),
  /** Whether hair variations are available */
  hair: v.boolean(),
  /** Categories the pictogram belongs to */
  categories: v.array(v.string()),
  /** Related synsets for semantic relationships */
  synsets: v.array(v.string()),
  /** Tags associated with the pictogram */
  tags: v.array(v.string()),
  /** Keywords for this pictogram in various languages */
  keywords: v.array(ArasaacKeywordSchema),
  /** Creation timestamp */
  created: v.optional(v.string()),
  /** Last update timestamp */
  lastUpdated: v.optional(v.string()),
  /** Downloads count */
  downloads: v.optional(v.number()),
});

/**
 * Individual pictogram data from the ARASAAC API search response
 */
export type ArasaacPictogram = v.InferOutput<typeof ArasaacPictogramSchema>;

/**
 * Schema for the ARASAAC API search response (array of pictograms)
 */
export const ArasaacSearchResponseSchema = v.array(ArasaacPictogramSchema);

/**
 * Parses and validates the ARASAAC API search response.
 * Throws a ValiError if the response doesn't match the expected schema.
 */
export function parseArasaacSearchResponse(data: unknown): ArasaacPictogram[] {
  return v.parse(ArasaacSearchResponseSchema, data);
}
