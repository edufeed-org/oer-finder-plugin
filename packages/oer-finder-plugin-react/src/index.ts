/**
 * @edufeed-org/oer-finder-plugin-react
 *
 * React components for the OER Finder Plugin.
 * This package wraps the web components from @edufeed-org/oer-finder-plugin
 * using @lit/react to provide a first-class React experience.
 */

import { createComponent, type EventName } from '@lit/react';
import * as React from 'react';

// Import web components to register them
import '@edufeed-org/oer-finder-plugin';

// Import element classes and types
import {
  OerSearchElement,
  OerListElement,
  OerCardElement,
  PaginationElement,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerPageChangeEvent,
  type SourceOption,
  type SearchParams,
} from '@edufeed-org/oer-finder-plugin';

// Re-export types for consumers
export type {
  OerSearchResultEvent,
  OerCardClickEvent,
  OerPageChangeEvent,
  SourceOption,
  SearchParams,
  OerSearchElement,
  OerListElement,
  OerCardElement,
  PaginationElement,
};

// Re-export other useful types from the plugin
export type {
  OerItem,
  OerMetadata,
  OerListResponse,
  SupportedLanguage,
} from '@edufeed-org/oer-finder-plugin';

/**
 * OerSearch React component
 *
 * A search form component for querying Open Educational Resources.
 * Supports slotted children - place OerList and OerPagination inside OerSearch
 * for automatic pagination handling. Page-change events from OerPagination bubble up
 * and are automatically caught by OerSearch to trigger new searches.
 *
 * @example
 * ```tsx
 * // With slotted OerList and OerPagination (recommended - pagination handled automatically)
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
 *   <OerPagination metadata={metadata} loading={loading} />
 * </OerSearch>
 * ```
 */
export const OerSearch = createComponent({
  tagName: 'oer-search',
  elementClass: OerSearchElement,
  react: React,
  events: {
    onSearchResults: 'search-results' as EventName<
      CustomEvent<OerSearchResultEvent>
    >,
    onSearchError: 'search-error' as EventName<CustomEvent<{ error: string }>>,
    onSearchCleared: 'search-cleared' as EventName<CustomEvent<void>>,
  },
});

/**
 * OerList React component
 *
 * A list component for displaying Open Educational Resources.
 * When used inside OerSearch, pagination is handled automatically by the parent.
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
    onCardClick: 'card-click' as EventName<CustomEvent<OerCardClickEvent>>,
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
    onCardClick: 'card-click' as EventName<CustomEvent<OerCardClickEvent>>,
  },
});

/**
 * OerPagination React component
 *
 * A pagination component for navigating through pages of results.
 *
 * @example
 * ```tsx
 * <OerPagination
 *   metadata={metadata}
 *   loading={isLoading}
 *   language="en"
 *   onPageChange={(e) => handlePageChange(e.detail.page)}
 * />
 * ```
 */
export const OerPagination = createComponent({
  tagName: 'oer-pagination',
  elementClass: PaginationElement,
  react: React,
  events: {
    onPageChange: 'page-change' as EventName<CustomEvent<OerPageChangeEvent>>,
  },
});
