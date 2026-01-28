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
 * Schema for the basis (post) data - aliased from 'basis' field
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
export const RpiAltImageNodeSchema = v.object({
  url: v.nullable(v.string()),
  localurl: v.nullable(v.string()),
  caption: v.nullable(v.string()),
});

export type RpiAltImageNode = v.InferOutput<typeof RpiAltImageNodeSchema>;

/**
 * Schema for image data - aliased from 'titelbild' field
 */
export const RpiImageSchema = v.object({
  url: v.nullable(v.string()),
  source: v.nullable(v.string()),
  altimages: v.nullable(
    v.object({
      altimage: v.nullable(RpiAltImageNodeSchema),
    }),
  ),
});

export type RpiImage = v.InferOutput<typeof RpiImageSchema>;

/**
 * Schema for a single material post from the GraphQL response.
 * Field names are aliases from the actual API fields.
 */
export const RpiMaterialPostSchema = v.object({
  // Aliased from 'basis'
  post: v.nullable(RpiPostBasisSchema),
  // Aliased from 'medientypen' -> 'nodes'
  learningresourcetypes: v.nullable(
    v.object({
      learningresourcetype: v.nullable(v.array(RpiTaxonomyNodeSchema)),
    }),
  ),
  // Aliased from 'bildungsstufen' -> 'nodes'
  educationallevels: v.nullable(
    v.object({
      educationallevel: v.nullable(v.array(RpiTaxonomyNodeSchema)),
    }),
  ),
  // Aliased from 'altersstufen' -> 'nodes'
  grades: v.nullable(
    v.object({
      grade: v.nullable(v.array(RpiTaxonomyNodeSchema)),
    }),
  ),
  // Aliased from 'schlagworte' -> 'nodes'
  tags: v.nullable(
    v.object({
      tag: v.nullable(v.array(RpiTaxonomyNodeSchema)),
    }),
  ),
  // Aliased from 'link'
  url: v.nullable(v.string()),
  // Aliased from 'materialId'
  import_id: v.nullable(v.union([v.string(), v.number()])),
  date: v.nullable(v.string()),
  // Aliased from 'titelbild'
  image: v.nullable(RpiImageSchema),
});

export type RpiMaterialPost = v.InferOutput<typeof RpiMaterialPostSchema>;

/**
 * Schema for the materialien query response
 */
export const RpiMaterialienResponseSchema = v.object({
  // Aliased from 'nodes'
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
