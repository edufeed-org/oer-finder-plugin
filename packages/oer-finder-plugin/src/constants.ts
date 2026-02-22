/** Virtual source ID that triggers parallel search across all configured sources */
export const SOURCE_ID_ALL = 'all';

/** Default untranslated label for the "All Sources" option (overwritten by translations in OerSearch) */
export const ALL_SOURCES_LABEL = 'All Sources';

/**
 * Prepend the "All Sources" virtual option when explicitly requested and 2+ real sources exist.
 * The option is only added when the user has configured `{ id: 'all' }` in their sources.
 * Shared between ApiClient and AdapterManager to avoid duplicated logic.
 */
export function prependAllSourcesOption<T extends { id: string }>(
  realSources: T[],
  includeAll: boolean,
): (T | { id: string; label: string })[] {
  if (includeAll && realSources.length >= 2) {
    return [{ id: SOURCE_ID_ALL, label: ALL_SOURCES_LABEL }, ...realSources];
  }
  return realSources;
}

/** Default timeout per source in milliseconds for all-sources search */
export const ALL_SOURCES_TIMEOUT_MS = 8000;

/** Default number of items per page when no page size is specified */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Common Creative Commons and other OER licenses
 * Full URIs and human-readable short names
 */

export interface License {
  uri: string;
  shortName: string;
}

export const COMMON_LICENSES: License[] = [
  {
    uri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    shortName: 'CC0 1.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by/4.0/',
    shortName: 'CC BY 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-sa/4.0/',
    shortName: 'CC BY-SA 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nd/4.0/',
    shortName: 'CC BY-ND 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc/4.0/',
    shortName: 'CC BY-NC 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    shortName: 'CC BY-NC-SA 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    shortName: 'CC BY-NC-ND 4.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by/3.0/',
    shortName: 'CC BY 3.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-sa/3.0/',
    shortName: 'CC BY-SA 3.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nd/3.0/',
    shortName: 'CC BY-ND 3.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc/3.0/',
    shortName: 'CC BY-NC 3.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    shortName: 'CC BY-NC-SA 3.0',
  },
  {
    uri: 'https://creativecommons.org/licenses/by-nc-nd/3.0/',
    shortName: 'CC BY-NC-ND 3.0',
  },
];

/**
 * Get short name for a license URI
 */
export function getLicenseShortName(uri: string): string | null {
  const license = COMMON_LICENSES.find((l) => l.uri === uri);
  return license ? license.shortName : null;
}

/**
 * Language options for the filter dropdown
 */
export interface LanguageOption {
  code: string;
  label: string;
}

export const FILTER_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

/**
 * Resource type options for the type filter dropdown
 */
export interface ResourceTypeOption {
  value: string;
  label: string;
}

export const RESOURCE_TYPES: ResourceTypeOption[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Text' },
  { value: 'application/pdf', label: 'PDF' },
];
