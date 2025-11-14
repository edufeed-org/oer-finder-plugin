/**
 * OER Finder Plugin Example
 *
 * This is an example showcase demonstrating how to use the
 * @oer-aggregator/oer-finder-plugin Web Components in your application.
 */

// Import styles (external CSS for CSP compliance)
import './styles.css';

// Import the OER Finder Plugin to register all web components
import '@oer-aggregator/oer-finder-plugin';

// Import component class types
import type {
  OerSearchElement,
  OerListElement,
  OerCardElement,
} from '@oer-aggregator/oer-finder-plugin';

// Import event and data types
import type { OerSearchResultEvent } from '@oer-aggregator/oer-finder-plugin';
import type { OerItem } from '@oer-aggregator/oer-finder-plugin';

// Initialize the demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const searchElement = document.getElementById('oer-search') as OerSearchElement;
  const listElement = document.getElementById('oer-list') as OerListElement;
  const exampleCard = document.getElementById('example-card') as OerCardElement;

  // Handle search results
  searchElement?.addEventListener('search-results', (event: Event) => {
    const customEvent = event as CustomEvent<OerSearchResultEvent>;
    const { data } = customEvent.detail;

    // Update the list with search results
    listElement.oers = data;
    listElement.loading = false;
    listElement.error = null;

    // Set example card with first result if available
    if (data.length > 0) {
      exampleCard.oer = data[0];
    }
  });

  // Handle search errors
  searchElement?.addEventListener('search-error', (event: Event) => {
    const customEvent = event as CustomEvent<{ error: string }>;
    listElement.oers = [];
    listElement.loading = false;
    listElement.error = customEvent.detail.error;
  });

  // Handle search cleared
  searchElement?.addEventListener('search-cleared', () => {
    listElement.oers = [];
    listElement.loading = false;
    listElement.error = null;
    exampleCard.oer = null;
  });

  // Handle card clicks
  listElement.onCardClick = (oer: OerItem) => {
    console.log('OER clicked:', oer);

    // Example: Open the resource URL in a new tab
    const url = oer.amb_metadata?.id || oer.url;
    if (url) {
      const urlString = typeof url === 'string' ? url : String(url);
      window.open(urlString, '_blank', 'noopener,noreferrer');
    } else {
      alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
    }
  };

  // Set example card click handler
  exampleCard.onImageClick = (oer: OerItem) => {
    console.log('Example card clicked:', oer);
    alert(`Clicked: ${oer.amb_metadata?.name || 'Unknown Resource'}`);
  };

  // Setup custom colors version
  const searchElementCustom = document.getElementById('oer-search-custom') as OerSearchElement;
  const listElementCustom = document.getElementById('oer-list-custom') as OerListElement;

  if (searchElementCustom && listElementCustom) {
    // Handle search results for custom colors version
    searchElementCustom.addEventListener('search-results', (event: Event) => {
      const customEvent = event as CustomEvent<OerSearchResultEvent>;
      const { data } = customEvent.detail;

      listElementCustom.oers = data;
      listElementCustom.loading = false;
      listElementCustom.error = null;
    });

    // Handle search errors for custom colors version
    searchElementCustom.addEventListener('search-error', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      listElementCustom.oers = [];
      listElementCustom.loading = false;
      listElementCustom.error = customEvent.detail.error;
    });

    // Handle search cleared for custom colors version
    searchElementCustom.addEventListener('search-cleared', () => {
      listElementCustom.oers = [];
      listElementCustom.loading = false;
      listElementCustom.error = null;
    });

    // Handle card clicks for custom colors version
    listElementCustom.onCardClick = (oer: OerItem) => {
      console.log('OER clicked (custom colors):', oer);
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        window.open(urlString, '_blank', 'noopener,noreferrer');
      } else {
        alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
      }
    };
  }
});