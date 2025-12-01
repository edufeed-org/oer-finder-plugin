import * as v from 'valibot';

// Language code schema: 2-3 lowercase letters
const LanguageCodeSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z]{2,3}$/, 'Language code must be 2-3 lowercase letters'),
);

// ISO 8601 date string schema
const DateStringSchema = v.pipe(
  v.string(),
  v.isoDate('Must be a valid ISO 8601 date'),
);

// String to number coercion with validation
const NumberStringSchema = v.pipe(
  v.string(),
  v.check((val) => {
    const num = Number(val);
    return !isNaN(num);
  }, 'Must be a valid number'),
  v.transform((val) => Number(val)),
);

// String to boolean coercion
const BooleanStringSchema = v.pipe(
  v.string(),
  v.check(
    (val) => val === 'true' || val === 'false',
    'Must be "true" or "false"',
  ),
  v.transform((val) => val === 'true'),
);

// Query parameters schema (accepts strings from HTTP and transforms them)
export const OerQuerySchema = v.object({
  // Pagination - accept strings and coerce to numbers
  page: v.optional(v.pipe(NumberStringSchema, v.minValue(1)), '1'),
  pageSize: v.optional(
    v.pipe(NumberStringSchema, v.minValue(1), v.maxValue(20)),
    '20',
  ),

  // Filter parameters
  type: v.optional(v.string()),
  keywords: v.optional(v.string()),
  license: v.optional(v.string()),
  free_for_use: v.optional(BooleanStringSchema),
  educational_level: v.optional(v.string()),
  language: v.optional(LanguageCodeSchema),

  // Date range filters
  date_created_from: v.optional(DateStringSchema),
  date_created_to: v.optional(DateStringSchema),
  date_published_from: v.optional(DateStringSchema),
  date_published_to: v.optional(DateStringSchema),
  date_modified_from: v.optional(DateStringSchema),
  date_modified_to: v.optional(DateStringSchema),
});

export type OerQueryDto = v.InferOutput<typeof OerQuerySchema>;

// Helper function to parse and validate query parameters
export function parseOerQuery(query: unknown): OerQueryDto {
  return v.parse(OerQuerySchema, query);
}
