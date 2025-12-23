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
import './oer-card/OerCard.js';
import './oer-list/OerList.js';
import './oer-search/OerSearch.js';
import './pagination/Pagination.js';
export { OerCardElement, type OerCardClickEvent } from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export { OerSearchElement, type OerSearchResultEvent, type SearchParams, type SourceOption, } from './oer-search/OerSearch.js';
export { PaginationElement, type OerPageChangeEvent } from './pagination/Pagination.js';
export type { SupportedLanguage, OerCardTranslations, OerListTranslations, OerSearchTranslations, PaginationTranslations, Translations, } from './translations.js';
export { getTranslations, getCardTranslations, getListTranslations, getSearchTranslations, getPaginationTranslations, } from './translations.js';
export { truncateText, truncateTitle, truncateContent, truncateLabel, shortenLabels, } from './utils.js';
export type { OerItem, OerMetadata, OerListResponse, OerQueryParams, OerClient, ImageUrls, } from '@edufeed-org/oer-finder-api-client';
export { createOerClient } from '@edufeed-org/oer-finder-api-client';
export declare const VERSION = "0.0.1";
