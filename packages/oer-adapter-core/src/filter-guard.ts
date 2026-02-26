import type { AdapterCapabilities } from './adapter.interface.js';

/**
 * Filter fields relevant for capability checking.
 */
interface FilterCheckQuery {
  readonly type?: string;
  readonly license?: string;
  readonly language?: string;
  readonly educationalLevel?: string;
}

/**
 * Determines whether an adapter should return empty results because
 * the query contains filters that the adapter cannot handle.
 *
 * This prevents adapters from silently returning unfiltered results
 * when the user has explicitly requested filtering.
 *
 * @param capabilities - The adapter's declared capabilities
 * @param query - The search query with filter parameters
 * @returns true if the adapter cannot handle the requested filters
 */
export function isFilterIncompatible(
  capabilities: AdapterCapabilities,
  query: FilterCheckQuery,
): boolean {
  if (
    query.language &&
    capabilities.supportedLanguages !== undefined &&
    !capabilities.supportedLanguages.includes(query.language)
  ) {
    return true;
  }

  if (
    query.type &&
    (capabilities.supportedTypes === undefined ||
      !capabilities.supportedTypes.includes(query.type))
  ) {
    return true;
  }

  if (query.license && !capabilities.supportsLicenseFilter) {
    return true;
  }

  if (query.educationalLevel && !capabilities.supportsEducationalLevelFilter) {
    return true;
  }

  return false;
}
