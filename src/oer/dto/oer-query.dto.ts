import * as v from 'valibot';

// Language code schema: 2-3 lowercase letters
const LanguageCodeSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z]{2,3}$/, 'Language code must be 2-3 lowercase letters'),
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

  // Source filter - determines which data source to query
  // Default (undefined or 'nostr'): query only Nostr database
  // Other values (e.g., 'arasaac'): query specific external adapter
  source: v.optional(v.string()),

  // Filter parameters
  type: v.optional(v.string()),
  keywords: v.optional(v.string()),
  license: v.optional(v.string()),
  free_for_use: v.optional(BooleanStringSchema),
  educational_level: v.optional(v.string()),
  language: v.optional(LanguageCodeSchema),
});

export type OerQueryDto = v.InferOutput<typeof OerQuerySchema>;

// Helper function to parse and validate query parameters
export function parseOerQuery(query: unknown): OerQueryDto {
  return v.parse(OerQuerySchema, query);
}
