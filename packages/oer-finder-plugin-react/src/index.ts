/**
 * @edufeed-org/oer-finder-plugin-react
 *
 * React components for the OER Finder Plugin.
 * This package wraps the web components from @edufeed-org/oer-finder-plugin
 * using @lit/react to provide a first-class React experience.
 */

import { createComponent, type EventName } from '@lit/react';
import * as React from 'react';

// Import element classes and types
import {
  OerSearchElement,
  OerListElement,
  OerCardElement,
  LoadMoreElement,
  type OerSearchResultDetail,
  type OerSearchResultEvent,
  type OerCardClickDetail,
  type OerCardClickEvent,
  type SourceOption,
  type SearchParams,
} from '@edufeed-org/oer-finder-plugin';

// Re-export types for consumers
export type {
  OerSearchResultDetail,
  OerSearchResultEvent,
  OerCardClickDetail,
  OerCardClickEvent,
  SourceOption,
  SearchParams,
  OerSearchElement,
  OerListElement,
  OerCardElement,
  LoadMoreElement,
};

// Re-export other useful types from the plugin
export type {
  OerItem,
  OerMetadata,
  OerListResponse,
  SupportedLanguage,
  SourceConfig,
  LoadMoreMeta,
  AdapterFactory,
} from '@edufeed-org/oer-finder-plugin';

// Re-export adapter registry API for React consumers
export {
  registerAdapter,
  getAdapterFactory,
} from '@edufeed-org/oer-finder-plugin';

/**
 * OerSearch React component
 *
 * A search form component for querying Open Educational Resources.
 * Supports slotted children - place OerList and OerLoadMore inside OerSearch
 * for automatic load-more handling. Load-more events from OerLoadMore bubble up
 * and are automatically caught by OerSearch to fetch the next page and append results.
 *
 * @example
 * ```tsx
 * <OerSearch
 *   apiUrl="https://api.example.com"
 *   language="en"
 *   pageSize={20}
 *   onSearchResults={(e) => {
 *     setOers(e.detail.data);
 *     setMetadata(e.detail.meta);
 *   }}
 * >
 *   <OerList oers={oers} loading={loading} onCardClick={(e) => handleCardClick(e.detail.oer)} />
 *   <OerLoadMore metadata={metadata} loading={loading} shownCount={oers.length} />
 * </OerSearch>
 * ```
 */
export const OerSearch = createComponent({
  tagName: 'oer-search',
  elementClass: OerSearchElement,
  react: React,
  events: {
    onSearchLoading: 'search-loading' as EventName<CustomEvent<void>>,
    onSearchResults: 'search-results' as EventName<OerSearchResultEvent>,
    onSearchError: 'search-error' as EventName<CustomEvent<{ error: string }>>,
    onSearchCleared: 'search-cleared' as EventName<CustomEvent<void>>,
  },
});

/**
 * OerList React component
 *
 * A list component for displaying Open Educational Resources.
 * When used inside OerSearch, load-more is handled automatically by the parent.
 *
 * @example
 * ```tsx
 * <OerList
 *   oers={resources}
 *   loading={isLoading}
 *   error={errorMessage}
 *   language="en"
 *   onCardClick={(e) => handleCardClick(e.detail.oer)}
 * />
 * ```
 */
export const OerList = createComponent({
  tagName: 'oer-list',
  elementClass: OerListElement,
  react: React,
  events: {
    onCardClick: 'card-click' as EventName<OerCardClickEvent>,
  },
});

/**
 * OerCard React component
 *
 * A card component for displaying a single Open Educational Resource.
 *
 * @example
 * ```tsx
 * <OerCard
 *   oer={resource}
 *   language="en"
 *   onCardClick={(e) => handleClick(e.detail.oer)}
 * />
 * ```
 */
export const OerCard = createComponent({
  tagName: 'oer-card',
  elementClass: OerCardElement,
  react: React,
  events: {
    onCardClick: 'card-click' as EventName<OerCardClickEvent>,
  },
});

/**
 * OerLoadMore React component
 *
 * A load-more button component for incrementally loading more results.
 * Shows "Showing X of Y resources" info and a "Load More" button.
 * When all results are loaded, shows a completion message.
 *
 * @example
 * ```tsx
 * <OerLoadMore
 *   metadata={metadata}
 *   shownCount={oers.length}
 *   loading={isLoading}
 *   language="en"
 * />
 * ```
 */
export const OerLoadMore = createComponent({
  tagName: 'oer-load-more',
  elementClass: LoadMoreElement,
  react: React,
  events: {
    onLoadMore: 'load-more' as EventName<CustomEvent<void>>,
  },
});
