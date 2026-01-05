import type { DateFields } from '../types/extraction.types';

/**
 * Safely parses a date string from AMB metadata.
 * Returns null if the value is missing, invalid, or cannot be parsed.
 *
 * @param value - The date value from metadata (can be string, number, or other types)
 * @returns Parsed Date object or null
 */
export function parseDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  // Handle string values (ISO 8601 format like "2024-01-15" or "2024-01-15T10:30:00Z")
  if (typeof value === 'string') {
    const parsed = new Date(value);
    // Check if the date is valid
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Handle numeric timestamps (Unix timestamps in seconds or milliseconds)
  if (typeof value === 'number') {
    const parsed = new Date(value > 9999999999 ? value : value * 1000);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Returns the latest (most recent) date from multiple date values.
 * Returns null if all dates are null.
 *
 * @param dates - Variable number of dates to compare
 * @returns The latest date or null if all are null
 */
export function getLatestDate(...dates: (Date | null)[]): Date | null {
  const validDates = dates.filter((date): date is Date => date !== null);
  if (validDates.length === 0) {
    return null;
  }
  return validDates.reduce((latest, current) =>
    current > latest ? current : latest,
  );
}

/**
 * Creates a DateFields object with parsed dates and the latest date.
 *
 * @param created - Raw date created value
 * @param published - Raw date published value
 * @param modified - Raw date modified value
 * @returns DateFields object
 */
export function createDateFields(
  created: unknown,
  published: unknown,
  modified: unknown,
): DateFields {
  const parsedCreated = parseDate(created);
  const parsedPublished = parseDate(published);
  const parsedModified = parseDate(modified);
  const latest = getLatestDate(parsedCreated, parsedPublished, parsedModified);

  return {
    created: parsedCreated,
    published: parsedPublished,
    modified: parsedModified,
    latest,
  };
}

/**
 * Extracts date fields from metadata stored in an OER record.
 *
 * @param metadata - The metadata JSON object
 * @returns DateFields extracted from the metadata
 */
export function extractDatesFromMetadata(
  metadata: Record<string, unknown> | null,
): DateFields {
  if (!metadata) {
    return { created: null, published: null, modified: null, latest: null };
  }

  return createDateFields(
    metadata['dateCreated'],
    metadata['datePublished'],
    metadata['dateModified'],
  );
}
