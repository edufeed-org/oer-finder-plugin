import type { AdapterSearchQuery, AdapterSearchResult } from './adapter.interface';

/**
 * AMB JSON-LD context URL.
 * All adapters should use this constant for consistent @context values.
 */
export const AMB_CONTEXT_URL =
  'https://w3id.org/kim/amb/context.jsonld' as const;

/**
 * Standard empty search result.
 * Use when a search has no results (e.g., empty keywords, 404 response).
 */
export const EMPTY_RESULT: Readonly<AdapterSearchResult> = Object.freeze({
  items: [],
  total: 0,
});

/**
 * Check if a search query has no meaningful keywords.
 * Returns true if keywords are undefined, empty, or whitespace-only.
 */
export function isEmptySearch(
  query: Pick<AdapterSearchQuery, 'keywords'>,
): boolean {
  return !query.keywords?.trim();
}

/**
 * Apply client-side pagination to a full array of items.
 * Pages are 1-indexed.
 */
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Build a source-prefixed external OER item ID.
 * Ensures unique IDs across adapters by prefixing with the source identifier.
 */
export function buildExternalOerId(
  sourceId: string,
  rawId: string | number,
): string {
  return `${sourceId}-${rawId}`;
}
