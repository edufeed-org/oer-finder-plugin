/**
 * OER Finder Plugin Example
 *
 * This is an example showcase demonstrating how to use the
 * @edufeed-org/oer-finder-plugin Web Components in your application.
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
} from '@edufeed-org/oer-finder-plugin';

// Import event and data types
import type { OerSearchResultEvent, OerCardClickEvent } from '@edufeed-org/oer-finder-plugin';

// Initialize the demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const searchElement = document.getElementById('oer-search') as OerSearchElement;
  const listElement = document.getElementById('oer-list') as OerListElement;
  const paginationElement = document.getElementById('oer-pagination') as PaginationElement;

  if (searchElement && listElement && paginationElement) {
    // Configure available sources for the source filter
    searchElement.availableSources = [
      { value: 'nostr-amb-relay', label: 'Nostr AMB Relay' },
      { value: 'arasaac', label: 'ARASAAC' },
      { value: 'openverse', label: 'Openverse' },
    ];
    // Handle search results
    searchElement.addEventListener('search-results', (event: Event) => {
      const customEvent = event as CustomEvent<OerSearchResultEvent>;
      const { data, meta } = customEvent.detail;

      listElement.oers = data;
      listElement.loading = false;
      listElement.error = null;
      // Set metadata and loading on the pagination element
      paginationElement.metadata = meta;
      paginationElement.loading = false;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = customEvent.detail.error;
      paginationElement.metadata = null;
      paginationElement.loading = false;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = null;
      paginationElement.metadata = null;
      paginationElement.loading = false;
    });

    // Handle card clicks
    listElement.addEventListener('card-click', (event: Event) => {
      const customEvent = event as CustomEvent<OerCardClickEvent>;
      const oer = customEvent.detail.oer;
      console.log('OER clicked:', oer);
      const url = oer.metadata?.id || oer.url;
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        window.open(urlString, '_blank', 'noopener,noreferrer');
      } else {
        alert(`OER: ${oer.metadata?.name || 'Unknown'}\nNo URL available`);
      }
    });
  }
});
