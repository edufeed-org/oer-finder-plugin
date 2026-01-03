/**
 * Nostr event validation schema using valibot.
 *
 * Provides runtime validation for Nostr event data retrieved from the database,
 * ensuring type safety when casting source_data fields.
 */
import * as v from 'valibot';

/**
 * Schema for validating Nostr event data structure.
 * Matches the NostrEventData interface used across services.
 */
export const NostrEventDataSchema = v.object({
  id: v.string(),
  pubkey: v.string(),
  created_at: v.number(),
  kind: v.number(),
  tags: v.array(v.array(v.string())),
  content: v.string(),
  sig: v.string(),
});

/**
 * Inferred type from the NostrEventData schema.
 */
export type NostrEventData = v.InferOutput<typeof NostrEventDataSchema>;

/**
 * Result type for NostrEventData parsing.
 */
export type ParseNostrEventResult =
  | { success: true; data: NostrEventData }
  | { success: false; error: string };

/**
 * Parses and validates unknown data as a NostrEventData object.
 * Returns a discriminated union for type-safe error handling.
 *
 * @param data - Unknown data to validate
 * @returns Parsed NostrEventData or error result
 */
export function parseNostrEventData(data: unknown): ParseNostrEventResult {
  const result = v.safeParse(NostrEventDataSchema, data);

  if (result.success) {
    return { success: true, data: result.output };
  }

  // Format validation error message
  const issues = result.issues
    .map((issue) => {
      const path = issue.path?.map((p) => p.key).join('.') ?? 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  return { success: false, error: `Invalid NostrEventData: ${issues}` };
}
