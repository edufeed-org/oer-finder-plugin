/**
 * Nostr tag parsing utilities.
 *
 * Splits each tag's key by colon to build nested objects.
 * Repeated paths under the same prefix start a new entity.
 *
 *   [["creator:name", "Alice"], ["creator:name", "Bob"], ["type", "LearningResource"]]
 *   → { creator: [{ name: "Alice" }, { name: "Bob" }], type: "LearningResource" }
 */

/** Checks whether a value already exists at a nested path. */
function hasNestedValue(
  obj: Record<string, unknown>,
  path: string[],
): boolean {
  let current: unknown = obj;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return false;
    current = (current as Record<string, unknown>)[segment];
  }
  return current !== undefined;
}

/** Sets a value at a nested path, creating intermediate objects as needed. */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: string,
): void {
  if (path.length === 0) return;
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof current[path[i]] !== 'object' || current[path[i]] === null) {
      current[path[i]] = {};
    }
    current = current[path[i]] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

/**
 * Parses Nostr event tags into a nested metadata object.
 *
 * Flat tags (no colon) are grouped by key; duplicates become arrays.
 * Colon-separated tags are split into prefix + nested path, grouped by prefix.
 * When a path already exists in the current entity, a new entity starts.
 * Single values/entities are unwrapped; multiples stay as arrays.
 *
 * Assumes tags for the same prefix arrive sequentially (all fields of
 * entity 1 before entity 2). Interleaved ordering is not supported.
 */
export function parseColonSeparatedTags(
  tags: string[][],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const nested = new Map<string, Record<string, unknown>[]>();

  for (const tag of tags) {
    if (tag.length < 2) continue;
    const [key, value] = tag;
    if (typeof key !== 'string' || typeof value !== 'string') continue;
    const colonIdx = key.indexOf(':');

    if (colonIdx === -1) {
      const existing = result[key];
      if (existing === undefined) result[key] = value;
      else if (Array.isArray(existing)) result[key] = [...existing, value];
      else result[key] = [existing, value];
      continue;
    }

    const prefix = key.substring(0, colonIdx);
    const path = key.substring(colonIdx + 1).split(':');

    let entities = nested.get(prefix);
    if (!entities) {
      entities = [{}];
      nested.set(prefix, entities);
    }

    if (hasNestedValue(entities[entities.length - 1], path)) {
      entities.push({});
    }
    setNestedValue(entities[entities.length - 1], path, value);
  }

  for (const [prefix, entities] of nested) {
    result[prefix] = entities.length === 1 ? entities[0] : entities;
  }

  return result;
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
