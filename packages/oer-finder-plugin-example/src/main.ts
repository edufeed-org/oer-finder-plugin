/**
 * OER Finder Plugin Example
 *
 * Demonstrates both routing modes:
 * 1) Server-Proxy mode: requests go through the aggregator backend
 * 2) Direct Client mode: adapters run in the browser, no server needed
 */

// Import styles (external CSS for CSP compliance)
import './styles.css';

// Import the OER Finder Plugin to register all web components
import '@edufeed-org/oer-finder-plugin';

// Import component class types
import type {
  OerSearchElement,
  OerListElement,
  PaginationElement,
  SourceConfig,
} from '@edufeed-org/oer-finder-plugin';

// Import event and data types
import type { OerSearchResultEvent, OerCardClickEvent } from '@edufeed-org/oer-finder-plugin';

/**
 * Wire up event handlers for an oer-search + oer-list + oer-pagination trio.
 */
function initSearchInstance(
  searchId: string,
  listId: string,
  paginationId: string,
): void {
  const searchElement = document.getElementById(searchId) as OerSearchElement | null;
  const listElement = document.getElementById(listId) as OerListElement | null;
  const paginationElement = document.getElementById(paginationId) as PaginationElement | null;

  if (!searchElement || !listElement || !paginationElement) {
    return;
  }

  searchElement.addEventListener('search-results', (event: Event) => {
    const customEvent = event as CustomEvent<OerSearchResultEvent>;
    const { data, meta } = customEvent.detail;

    listElement.oers = data;
    listElement.loading = false;
    listElement.error = null;
    paginationElement.metadata = meta;
    paginationElement.loading = false;
  });

  searchElement.addEventListener('search-error', (event: Event) => {
    const customEvent = event as CustomEvent<{ error: string }>;
    listElement.oers = [];
    listElement.loading = false;
    listElement.error = customEvent.detail.error;
    paginationElement.metadata = null;
    paginationElement.loading = false;
  });

  searchElement.addEventListener('search-cleared', () => {
    listElement.oers = [];
    listElement.loading = false;
    listElement.error = null;
    paginationElement.metadata = null;
    paginationElement.loading = false;
  });

  listElement.addEventListener('card-click', (event: Event) => {
    const customEvent = event as CustomEvent<OerCardClickEvent>;
    const oer = customEvent.detail.oer;
    const url = oer.extensions.system?.foreignLandingUrl || oer.amb.id;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
}

// Initialize both demo instances when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Mode 1: Server-Proxy (via aggregator) — sources set via JS property
  const apiSearch = document.getElementById('oer-search-api') as OerSearchElement | null;
  if (apiSearch) {
    const serverSources: SourceConfig[] = [
      { id: 'nostr', label: 'OER Aggregator Nostr Database' },
      { id: 'nostr-amb-relay', label: 'Nostr AMB Relay' },
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
    ];
    apiSearch.sources = serverSources;
  }
  initSearchInstance('oer-search-api', 'oer-list-api', 'oer-pagination-api');

  // Mode 2: Direct Client (no server) — sources set via JS property
  const directSearch = document.getElementById('oer-search-direct') as OerSearchElement | null;
  if (directSearch) {
    const directSources: SourceConfig[] = [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://relay.edufeed.org' },
      { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
    ];
    directSearch.sources = directSources;
  }
  initSearchInstance('oer-search-direct', 'oer-list-direct', 'oer-pagination-direct');
});
