/**
 * Parses colon-separated tag notation from Nostr events and transforms them
 * into nested JSON objects.
 *
 * Example:
 * Input tags:
 *   [["learningResourceType:id", "http://w3id.org/kim/hcrt/image"]]
 *   [["learningResourceType:prefLabel:en", "Image"]]
 *   [["type", "LearningResource"]]
 *
 * Output:
 *   {
 *     "learningResourceType": {
 *       "id": "http://w3id.org/kim/hcrt/image",
 *       "prefLabel": {
 *         "en": "Image"
 *       }
 *     },
 *     "type": "LearningResource"
 *   }
 *
 * @param tags - Array of Nostr event tags in format [key, value]
 * @returns Nested JSON object with structured metadata
 */
export function parseColonSeparatedTags(
  tags: string[][],
): Record<string, unknown> {
  return tags.reduce(
    (result, tag) => {
      // Filter out invalid tags using guard clauses in reduce
      if (!Array.isArray(tag) || tag.length < 2) {
        return result;
      }

      const [key, value] = tag;
      if (typeof key !== 'string' || typeof value !== 'string') {
        return result;
      }

      const parts = key.split(':');
      setNestedValue(result, parts, value);
      return result;
    },
    {} as Record<string, unknown>,
  );
}

/**
 * Helper function to set a value at a nested path in an object.
 * Creates intermediate objects as needed.
 *
 * Example: setNestedValue(obj, ['a', 'b', 'c'], 'value')
 *   -> obj.a.b.c = 'value'
 *
 * @param obj - The object to modify
 * @param parts - Array of key parts representing the path (e.g., ['learningResourceType', 'prefLabel', 'en'])
 * @param value - The value to set at the path
 */
function setNestedValue(
  obj: Record<string, unknown>,
  parts: string[],
  value: string,
): void {
  // Early exit for empty path
  if (parts.length === 0) {
    return;
  }

  // Walk through the path, creating nested objects as we go
  let currentLevel = obj;

  // Traverse to the parent of the final key, creating intermediate objects
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];

    // Ensure this level exists and is an object
    // If it doesn't exist or isn't an object, replace it with a new empty object
    if (
      !currentLevel[key] ||
      typeof currentLevel[key] !== 'object' ||
      currentLevel[key] === null
    ) {
      currentLevel[key] = {};
    }

    // Move down one level in the nested structure
    currentLevel = currentLevel[key] as Record<string, unknown>;
  }

  // Set the value at the final key
  const finalKey = parts[parts.length - 1];
  currentLevel[finalKey] = value;
}

/**
 * Extracts all values from tags with a specific key.
 *
 * Use this when a tag key can appear multiple times (e.g., multiple keywords).
 * For single-valued tags, use `findTagValue()` instead.
 *
 * Note: Tags must have at least 2 elements [key, value] per Nostr protocol.
 * Any malformed tags are skipped.
 *
 * Example:
 *   tags = [['t', 'biology'], ['t', 'science'], ['type', 'Article']]
 *   extractTagValues(tags, 't') -> ['biology', 'science']
 *
 * @param tags - Array of Nostr event tags
 * @param tagKey - The tag key to extract (e.g., "t" for keywords)
 * @returns Array of values found for the given tag key
 */
export function extractTagValues(tags: string[][], tagKey: string): string[] {
  return tags
    .filter(
      (tag): tag is [string, string, ...string[]] =>
        // Nostr tags must be [key, value, ...optional], so length >= 2
        Array.isArray(tag) && tag.length >= 2 && tag[0] === tagKey,
    )
    .map((tag) => tag[1]);
}

/**
 * Finds the first tag with a specific key and returns its value.
 *
 * Use this for single-valued tags (e.g., URL, license).
 * For multi-valued tags, use `extractTagValues()` instead.
 *
 * Note: Tags must have at least 2 elements [key, value] per Nostr protocol.
 *
 * Example:
 *   tags = [['d', 'https://example.com'], ['type', 'Article']]
 *   findTagValue(tags, 'd') -> 'https://example.com'
 *
 * @param tags - Array of Nostr event tags
 * @param tagKey - The tag key to find
 * @returns The value of the first matching tag, or null if not found
 */
export function findTagValue(tags: string[][], tagKey: string): string | null {
  const tag = tags.find(
    (tag): tag is [string, string, ...string[]] =>
      // Nostr tags must be [key, value, ...optional], so length >= 2
      Array.isArray(tag) && tag.length >= 2 && tag[0] === tagKey,
  );

  return tag ? tag[1] : null;
}

/**
 * Finds the first "e" tag with a specific marker and returns the event ID.
 * Supports both formats:
 * 1. Standard: ["e", "event_id", "relay_url", "marker"]
 * 2. Compact: ["e", "event_id:relay_url:marker"]
 *
 * @param tags - Array of Nostr event tags
 * @param marker - The marker to look for (e.g., "file")
 * @returns The event ID if found, or null
 */
export function findEventIdByMarker(
  tags: string[][],
  marker: string,
): string | null {
  const matchingTag = tags.find((tag) => {
    if (!Array.isArray(tag) || tag[0] !== 'e') {
      return false;
    }

    // Standard format: ["e", "event_id", "relay_url", "marker"]
    if (tag.length >= 4 && tag[3] === marker) {
      return true;
    }

    // Compact format: ["e", "event_id:relay_url:marker"]
    // Note: relay_url may contain colons (ws://host:port), so marker is at the end
    if (tag.length >= 2 && typeof tag[1] === 'string') {
      const parts = tag[1].split(':');
      // Expect at least event_id:marker (2 parts), marker is always last
      return parts.length >= 2 && parts[parts.length - 1] === marker;
    }

    return false;
  });

  if (!matchingTag) {
    return null;
  }

  // Extract event ID based on format
  if (matchingTag.length >= 4 && matchingTag[3] === marker) {
    // Standard format: return event_id from position 1
    return matchingTag[1];
  }

  // Compact format: extract event_id from the first part before colons
  if (typeof matchingTag[1] === 'string') {
    const parts = matchingTag[1].split(':');
    return parts[0];
  }

  return null;
}

/**
 * Safely parses a boolean string value.
 *
 * @param value - String value to parse
 * @returns Boolean value or null if invalid
 */
export function parseBoolean(value: string | null): boolean | null {
  if (value === null) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

/**
 * Safely parses a bigint string value.
 *
 * @param value - String value to parse
 * @returns Number value or null if invalid
 */
export function parseBigInt(value: string | null): number | null {
  if (value === null) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}
