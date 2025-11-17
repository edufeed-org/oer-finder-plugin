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
  OerThemeProvider,
} from '@oer-aggregator/oer-finder-plugin';

// Import event and data types
import type { OerSearchResultEvent } from '@oer-aggregator/oer-finder-plugin';
import type { OerItem } from '@oer-aggregator/oer-finder-plugin';

// Import theme types
import type { Theme } from '@oer-aggregator/oer-finder-plugin';

// Initialize the demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Setup custom theme programmatically
  const customThemeProvider = document.getElementById('custom-theme-provider') as OerThemeProvider;
  if (customThemeProvider) {
    const customTheme: Theme = {
      name: 'custom',
      colors: {
        primary: '#FF6B6B',
        primaryHover: '#EE5A52',
        secondary: '#4ECDC4',
        background: {
          page: '#ffffff',
          card: '#ffffff',
          form: '#fff5f5',
        },
        text: {
          primary: '#2d3748',
          secondary: '#4a5568',
          muted: '#718096',
        },
      },
    };
    customThemeProvider.theme = customTheme;
  }

  // Custom theme section
  const searchElementCustom = document.getElementById('oer-search-custom') as OerSearchElement;
  const listElementCustom = document.getElementById('oer-list-custom') as OerListElement;

  if (searchElementCustom && listElementCustom) {
    // Handle search results for custom theme
    searchElementCustom.addEventListener('search-results', (event: Event) => {
      const customEvent = event as CustomEvent<OerSearchResultEvent>;
      const { data, meta } = customEvent.detail;

      listElementCustom.oers = data;
      listElementCustom.loading = false;
      listElementCustom.error = null;
      listElementCustom.showPagination = true;
      listElementCustom.metadata = meta;
    });

    // Handle search errors for custom theme
    searchElementCustom.addEventListener('search-error', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      listElementCustom.oers = [];
      listElementCustom.loading = false;
      listElementCustom.error = customEvent.detail.error;
      listElementCustom.showPagination = false;
      listElementCustom.metadata = null;
    });

    // Handle search cleared for custom theme
    searchElementCustom.addEventListener('search-cleared', () => {
      listElementCustom.oers = [];
      listElementCustom.loading = false;
      listElementCustom.error = null;
      listElementCustom.showPagination = false;
      listElementCustom.metadata = null;
    });

    // Handle card clicks for custom theme
    listElementCustom.onCardClick = (oer: OerItem) => {
      console.log('OER clicked (custom theme):', oer);
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        window.open(urlString, '_blank', 'noopener,noreferrer');
      } else {
        alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
      }
    };

    // Handle pagination for custom theme
    listElementCustom.onPageChange = (page: number) => {
      searchElementCustom.handlePageChange(page);
    };
  }

  // CSS-styled section
  const searchElementCss = document.getElementById('oer-search-css') as OerSearchElement;
  const listElementCss = document.getElementById('oer-list-css') as OerListElement;

  if (searchElementCss && listElementCss) {
    // Handle search results for CSS-styled section
    searchElementCss.addEventListener('search-results', (event: Event) => {
      const customEvent = event as CustomEvent<OerSearchResultEvent>;
      const { data, meta } = customEvent.detail;

      listElementCss.oers = data;
      listElementCss.loading = false;
      listElementCss.error = null;
      listElementCss.showPagination = true;
      listElementCss.metadata = meta;
    });

    // Handle search errors for CSS-styled section
    searchElementCss.addEventListener('search-error', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      listElementCss.oers = [];
      listElementCss.loading = false;
      listElementCss.error = customEvent.detail.error;
      listElementCss.showPagination = false;
      listElementCss.metadata = null;
    });

    // Handle search cleared for CSS-styled section
    searchElementCss.addEventListener('search-cleared', () => {
      listElementCss.oers = [];
      listElementCss.loading = false;
      listElementCss.error = null;
      listElementCss.showPagination = false;
      listElementCss.metadata = null;
    });

    // Handle card clicks for CSS-styled section
    listElementCss.onCardClick = (oer: OerItem) => {
      console.log('OER clicked (CSS-styled):', oer);
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        const urlString = typeof url === 'string' ? url : String(url);
        window.open(urlString, '_blank', 'noopener,noreferrer');
      } else {
        alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
      }
    };

    // Handle pagination for CSS-styled section
    listElementCss.onPageChange = (page: number) => {
      searchElementCss.handlePageChange(page);
    };
  }
});