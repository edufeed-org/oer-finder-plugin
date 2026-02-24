import * as v from 'valibot';

/**
 * Schema for an individual extmetadata field value.
 * Wikimedia extmetadata fields have extra properties (source, hidden) beyond value.
 * Using looseObject to allow unknown keys from the API.
 */
const ExtmetadataValueSchema = v.pipe(
  v.looseObject({
    value: v.string(),
  }),
  v.transform((input) => ({ value: input.value })),
);

/**
 * Schema for extmetadata object.
 * All fields are optional since Wikimedia may not return all metadata.
 * Uses looseObject because the API returns many additional fields we don't need.
 */
export const WikimediaExtmetadataSchema = v.looseObject({
  LicenseUrl: v.optional(ExtmetadataValueSchema),
  LicenseShortName: v.optional(ExtmetadataValueSchema),
  Artist: v.optional(ExtmetadataValueSchema),
  ImageDescription: v.optional(ExtmetadataValueSchema),
  DateTimeOriginal: v.optional(ExtmetadataValueSchema),
  Categories: v.optional(ExtmetadataValueSchema),
});

export type WikimediaExtmetadata = v.InferOutput<
  typeof WikimediaExtmetadataSchema
>;

/**
 * Schema for a single imageinfo entry from the Wikimedia API.
 * Uses looseObject because the API returns extra fields (responsiveUrls, etc.).
 */
export const WikimediaImageInfoSchema = v.looseObject({
  url: v.string(),
  descriptionurl: v.optional(v.string()),
  descriptionshorturl: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  size: v.optional(v.number()),
  mime: v.optional(v.string()),
  thumburl: v.optional(v.string()),
  thumbwidth: v.optional(v.number()),
  thumbheight: v.optional(v.number()),
  extmetadata: v.optional(WikimediaExtmetadataSchema),
});

export type WikimediaImageInfo = v.InferOutput<
  typeof WikimediaImageInfoSchema
>;

/**
 * Schema for a single page in the query results.
 * Uses looseObject because pages have extra fields (imagerepository, known, etc.).
 */
export const WikimediaPageSchema = v.looseObject({
  pageid: v.number(),
  ns: v.number(),
  title: v.string(),
  index: v.optional(v.number()),
  imageinfo: v.optional(v.array(WikimediaImageInfoSchema)),
});

export type WikimediaPage = v.InferOutput<typeof WikimediaPageSchema>;

/**
 * Schema for the continue object in the API response.
 */
const WikimediaContinueSchema = v.looseObject({
  gsroffset: v.optional(v.number()),
  continue: v.optional(v.string()),
});

/**
 * Schema for the query object in the API response.
 * Uses looseObject because the API may include searchinfo, normalized, etc.
 */
const WikimediaQuerySchema = v.looseObject({
  pages: v.optional(v.record(v.string(), WikimediaPageSchema)),
});

/**
 * Schema for the full Wikimedia API response.
 * Uses looseObject because the MediaWiki API returns many extra top-level fields.
 */
export const WikimediaSearchResponseSchema = v.looseObject({
  batchcomplete: v.optional(v.string()),
  continue: v.optional(WikimediaContinueSchema),
  query: v.optional(WikimediaQuerySchema),
});

export type WikimediaSearchResponse = v.InferOutput<
  typeof WikimediaSearchResponseSchema
>;

/**
 * Parses and validates the Wikimedia Commons API response.
 * Throws a ValiError if the response doesn't match the expected schema.
 */
export function parseWikimediaSearchResponse(
  data: unknown,
): WikimediaSearchResponse {
  return v.parse(WikimediaSearchResponseSchema, data);
}
