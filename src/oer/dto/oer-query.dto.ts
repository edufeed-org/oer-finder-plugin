import * as v from 'valibot';

// Language code schema: 2-3 lowercase letters
const LanguageCodeSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z]{2,3}$/, 'Language code must be 2-3 lowercase letters'),
);

// URI schema: must be a valid URL without spaces (prevents filter token injection)
const UriSchema = v.pipe(
  v.string(),
  v.url('Must be a valid URL'),
  v.regex(/^\S+$/, 'Must not contain spaces'),
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

// Query parameters schema (accepts strings from HTTP and transforms them)
export const OerQuerySchema = v.object({
  // Pagination - accept strings and coerce to numbers
  page: v.optional(v.pipe(NumberStringSchema, v.minValue(1)), '1'),
  pageSize: v.optional(
    v.pipe(NumberStringSchema, v.minValue(1), v.maxValue(20)),
    '20',
  ),

  // Source filter - determines which adapter to query (required)
  source: v.string(),

  // Filter parameters
  type: v.optional(v.string()),
  searchTerm: v.optional(v.pipe(v.string(), v.maxLength(200))),
  license: v.optional(UriSchema),
  educational_level: v.optional(UriSchema),
  language: v.optional(LanguageCodeSchema),
});

export type OerQueryDto = v.InferOutput<typeof OerQuerySchema>;

// Helper function to parse and validate query parameters
export function parseOerQuery(query: unknown): OerQueryDto {
  return v.parse(OerQuerySchema, query);
}
