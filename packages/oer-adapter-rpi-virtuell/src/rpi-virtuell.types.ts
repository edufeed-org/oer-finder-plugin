/**
 * RPI-Virtuell Materialpool GraphQL API types
 * Based on https://material.rpi-virtuell.de/graphql
 */
import * as v from 'valibot';

/**
 * Schema for a single taxonomy node (e.g., learning resource type, educational level, tag)
 */
export const RpiTaxonomyNodeSchema = v.object({
  name: v.string(),
});

export type RpiTaxonomyNode = v.InferOutput<typeof RpiTaxonomyNodeSchema>;

/**
 * Schema for taxonomy nodes wrapper
 */
export const RpiTaxonomyNodesSchema = v.object({
  nodes: v.array(RpiTaxonomyNodeSchema),
});

export type RpiTaxonomyNodes = v.InferOutput<typeof RpiTaxonomyNodesSchema>;

/**
 * Schema for the basis (post) data
 */
export const RpiPostBasisSchema = v.object({
  title: v.nullable(v.string()),
  excerpt: v.nullable(v.string()),
  content: v.nullable(v.string()),
});

export type RpiPostBasis = v.InferOutput<typeof RpiPostBasisSchema>;

/**
 * Schema for alt image data
 */
export const RpiAltImageSchema = v.object({
  node: v.object({
    url: v.nullable(v.string()),
    localurl: v.nullable(v.string()),
    caption: v.nullable(v.string()),
  }),
});

export type RpiAltImage = v.InferOutput<typeof RpiAltImageSchema>;

/**
 * Schema for image data
 */
export const RpiImageSchema = v.object({
  url: v.nullable(v.string()),
  source: v.nullable(v.string()),
  altimages: v.nullable(
    v.object({
      altimage: v.nullable(RpiAltImageSchema),
    }),
  ),
});

export type RpiImage = v.InferOutput<typeof RpiImageSchema>;

/**
 * Schema for a single material post from the GraphQL response
 */
export const RpiMaterialPostSchema = v.object({
  post: v.nullable(RpiPostBasisSchema),
  learningresourcetypes: v.nullable(
    v.object({
      learningresourcetype: v.nullable(RpiTaxonomyNodesSchema),
    }),
  ),
  educationallevels: v.nullable(
    v.object({
      educationallevel: v.nullable(RpiTaxonomyNodesSchema),
    }),
  ),
  tags: v.nullable(
    v.object({
      tag: v.nullable(RpiTaxonomyNodesSchema),
    }),
  ),
  url: v.nullable(v.string()),
  import_id: v.nullable(v.union([v.string(), v.number()])),
  date: v.nullable(v.string()),
  image: v.nullable(RpiImageSchema),
});

export type RpiMaterialPost = v.InferOutput<typeof RpiMaterialPostSchema>;

/**
 * Schema for the materialien query response
 */
export const RpiMaterialienResponseSchema = v.object({
  posts: v.nullable(v.array(RpiMaterialPostSchema)),
});

export type RpiMaterialienResponse = v.InferOutput<
  typeof RpiMaterialienResponseSchema
>;

/**
 * Schema for the full GraphQL response
 */
export const RpiGraphQLResponseSchema = v.object({
  data: v.nullable(
    v.object({
      materialien: v.nullable(RpiMaterialienResponseSchema),
    }),
  ),
  errors: v.optional(
    v.array(
      v.object({
        message: v.string(),
        locations: v.optional(
          v.array(
            v.object({
              line: v.number(),
              column: v.number(),
            }),
          ),
        ),
        path: v.optional(v.array(v.union([v.string(), v.number()]))),
      }),
    ),
  ),
});

export type RpiGraphQLResponse = v.InferOutput<typeof RpiGraphQLResponseSchema>;

/**
 * Parses and validates the RPI-Virtuell GraphQL response.
 * Throws a ValiError if the response doesn't match the expected schema.
 */
export function parseRpiGraphQLResponse(data: unknown): RpiGraphQLResponse {
  return v.parse(RpiGraphQLResponseSchema, data);
}
