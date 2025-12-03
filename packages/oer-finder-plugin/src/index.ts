/**
 * @edufeed-org/frontend-plugin
 * Web Components plugin for the OER Aggregator
 *
 * This package provides framework-agnostic Web Components for displaying
 * and interacting with Open Educational Resources.
 *
 * Usage:
 * ```html
 * <script type="module" src="oer-plugin.js"></script>
 * <oer-search api-url="https://api.example.com"></oer-search>
 * <oer-list></oer-list>
 * ```
 *
 * Customize colors via CSS variables:
 * ```css
 * oer-search, oer-list {
 *   --primary-color: #667eea;
 *   --primary-hover-color: #5568d3;
 *   --secondary-color: #764ba2;
 *   --background-card: #ffffff;
 *   --background-form: #f8f9fa;
 *   --text-primary: #2d3748;
 *   --text-secondary: #4a5568;
 *   --text-muted: #718096;
 * }
 * ```
 *
 * Or via npm:
 * ```typescript
 * import '@edufeed-org/frontend-plugin';
 * ```
 */

// Import and register Web Components
import './oer-card/OerCard.js';
import './oer-list/OerList.js';
import './oer-search/OerSearch.js';
import './pagination/Pagination.js';

// Export component classes for programmatic usage
export { OerCardElement, type OerCardClickEvent } from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export {
  OerSearchElement,
  type OerSearchResultEvent,
  type SearchParams,
  type SourceOption,
} from './oer-search/OerSearch.js';
export { PaginationElement, type OerPageChangeEvent } from './pagination/Pagination.js';

// Export translation types and utilities
export type {
  SupportedLanguage,
  OerCardTranslations,
  OerListTranslations,
  OerSearchTranslations,
  PaginationTranslations,
  Translations,
} from './translations.js';
export {
  getTranslations,
  getCardTranslations,
  getListTranslations,
  getSearchTranslations,
  getPaginationTranslations,
} from './translations.js';

// Export utility functions
export {
  truncateText,
  truncateTitle,
  truncateContent,
  truncateLabel,
  shortenLabels,
} from './utils.js';

// Re-export types from api-client for convenience
export type {
  OerItem,
  OerMetadata,
  OerListResponse,
  OerQueryParams,
  OerClient,
  ImageUrls,
} from '@edufeed-org/oer-finder-api-client';

export { createOerClient } from '@edufeed-org/oer-finder-api-client';

// Package version
export const VERSION = '0.0.1';
