/**
 * @edufeed-org/frontend-plugin
 * Web Components plugin for the OER Proxy
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
 *   --background-input: #ffffff;
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
import './load-more/LoadMore.js';

// Export component classes for programmatic usage
export {
  OerCardElement,
  type OerCardClickDetail,
  type OerCardClickEvent,
} from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export {
  OerSearchElement,
  type OerSearchResultDetail,
  type OerSearchResultEvent,
  type SearchParams,
  type SourceOption,
} from './oer-search/OerSearch.js';
export { LoadMoreElement, type LoadMoreMeta } from './load-more/LoadMore.js';

// Export translation types and utilities
export type {
  SupportedLanguage,
  OerCardTranslations,
  OerListTranslations,
  OerSearchTranslations,
  LoadMoreTranslations,
  Translations,
} from './translations.js';
export {
  getTranslations,
  getCardTranslations,
  getListTranslations,
  getSearchTranslations,
  getLoadMoreTranslations,
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

// Export client types for programmatic usage
export { ClientFactory, ApiClient, DirectClient } from './clients/index.js';
export type { SearchClient, SearchResult, ClientConfig } from './clients/index.js';

// Export adapter manager and registry for advanced usage
export { AdapterManager, registerAdapter, getAdapterFactory } from './adapters/index.js';
export type { AdapterFactory } from './adapters/index.js';

// Export unified source configuration type
export type { SourceConfig } from './types/source-config.js';
