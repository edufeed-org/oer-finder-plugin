/**
 * @oer-aggregator/frontend-plugin
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
 * Or via npm:
 * ```typescript
 * import '@oer-aggregator/frontend-plugin';
 * ```
 */

// Import and register Web Components
import './oer-card/OerCard.js';
import './oer-list/OerList.js';
import './oer-search/OerSearch.js';

// Export component classes for programmatic usage
export { OerCardElement } from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export { OerSearchElement, type OerSearchResultEvent } from './oer-search/OerSearch.js';

// Export translation types and utilities
export type {
  SupportedLanguage,
  OerCardTranslations,
  OerListTranslations,
  OerSearchTranslations,
  Translations,
} from './translations.js';
export {
  getTranslations,
  getCardTranslations,
  getListTranslations,
  getSearchTranslations,
} from './translations.js';

// Re-export types from api-client for convenience
export type {
  OerItem,
  OerMetadata,
  OerListResponse,
  OerQueryParams,
  OerClient,
} from '@oer-aggregator/api-client';

export { createOerClient } from '@oer-aggregator/api-client';

// Package version
export const VERSION = '0.0.1';
