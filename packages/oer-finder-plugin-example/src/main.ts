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
import type { OerSearchElement, OerListElement } from '@edufeed-org/oer-finder-plugin';

// Import event and data types
import type { OerSearchResultEvent, OerCardClickEvent } from '@edufeed-org/oer-finder-plugin';

// Initialize the demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const searchElement = document.getElementById('oer-search') as OerSearchElement;
  const listElement = document.getElementById('oer-list') as OerListElement;

  if (searchElement && listElement) {
    // Handle search results
    searchElement.addEventListener('search-results', (event: Event) => {
      const customEvent = event as CustomEvent<OerSearchResultEvent>;
      const { data, meta } = customEvent.detail;

      listElement.oers = data;
      listElement.loading = false;
      listElement.error = null;
      listElement.showPagination = true;
      listElement.metadata = meta;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = customEvent.detail.error;
      listElement.showPagination = false;
      listElement.metadata = null;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = null;
      listElement.showPagination = false;
      listElement.metadata = null;
    });

    // Handle card clicks
    listElement.addEventListener('card-click', (event: Event) => {
      const customEvent = event as CustomEvent<OerCardClickEvent>;
      const oer = customEvent.detail.oer;
      console.log('OER clicked:', oer);
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        window.open(urlString, '_blank', 'noopener,noreferrer');
      } else {
        alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
      }
    });

    // Handle pagination
    listElement.onPageChange = (page: number) => {
      searchElement.handlePageChange(page);
    };
  }
});
