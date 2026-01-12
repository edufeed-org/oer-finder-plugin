/**
 * Nostr tag parsing utilities.
 *
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
 *       "prefLabel": { "en": "Image" }
 *     },
 *     "type": "LearningResource"
 *   }
 */

/**
 * Sets a value at a nested path in an object, creating intermediate objects as needed.
 *
 * @param obj - The object to modify
 * @param parts - Array of key parts representing the path
 * @param value - The value to set at the path
 */
function setNestedValue(
  obj: Record<string, unknown>,
  parts: string[],
  value: string,
): void {
  if (parts.length === 0) return;

  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (
      !current[key] ||
      typeof current[key] !== 'object' ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Parses colon-separated tags into a nested object structure.
 *
 * @param tags - Event tags array
 * @returns Parsed metadata object
 */
export function parseColonSeparatedTags(
  tags: string[][],
): Record<string, unknown> {
  return tags.reduce(
    (result, tag) => {
      if (!Array.isArray(tag) || tag.length < 2) return result;

      const [key, value] = tag;
      if (typeof key !== 'string' || typeof value !== 'string') return result;

      const parts = key.split(':');
      setNestedValue(result, parts, value);
      return result;
    },
    {} as Record<string, unknown>,
  );
}

/**
 * Finds the first value for a given tag name.
 *
 * @param tags - Event tags array
 * @param tagName - Tag name to search for
 * @returns First value for the tag or null
 */
export function findTagValue(tags: string[][], tagName: string): string | null {
  const tag = tags.find(
    (t): t is [string, string, ...string[]] =>
      Array.isArray(t) && t.length >= 2 && t[0] === tagName,
  );
  return tag ? tag[1] : null;
}

/**
 * Extracts all values for a given tag name.
 *
 * @param tags - Event tags array
 * @param tagName - Tag name to search for
 * @returns Array of values for the tag
 */
export function extractTagValues(tags: string[][], tagName: string): string[] {
  return tags
    .filter(
      (t): t is [string, string, ...string[]] =>
        Array.isArray(t) && t.length >= 2 && t[0] === tagName,
    )
    .map((t) => t[1]);
}

/**
 * Parses a boolean string value.
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
