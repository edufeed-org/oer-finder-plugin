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
 * <oer-theme-provider theme="default">
 *   <oer-search api-url="https://api.example.com"></oer-search>
 *   <oer-list></oer-list>
 * </oer-theme-provider>
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
import './theme/ThemeProvider.js';

// Export component classes for programmatic usage
export { OerCardElement } from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export { OerSearchElement, type OerSearchResultEvent } from './oer-search/OerSearch.js';
export { OerThemeProvider } from './theme/ThemeProvider.js';

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

// Export theme types and utilities
export type { Theme, ThemeColors, ThemeName } from './theme/theme-types.js';
export { defaultTheme, darkTheme, themes, getTheme, isThemeName } from './theme/themes.js';
export { themeContext, defaultThemeValue } from './theme/theme-context.js';

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
