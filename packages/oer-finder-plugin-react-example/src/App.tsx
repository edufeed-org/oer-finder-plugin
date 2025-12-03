/**
 * OER Finder Plugin React Example
 *
 * This is an example showcase demonstrating how to use the
 * @edufeed-org/oer-finder-plugin-react components in a React application.
 */

import { useState, useRef, useCallback } from 'react';
import './styles.css';

// Import React components from the plugin-react package
import {
  OerSearch,
  OerList,
  type OerSearchElement,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type OerMetadata,
} from '@edufeed-org/oer-finder-plugin-react';

function App() {
  const searchRef = useRef<OerSearchElement | null>(null);

  // State for the list component
  const [oers, setOers] = useState<OerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPagination, setShowPagination] = useState(false);
  const [metadata, setMetadata] = useState<OerMetadata | null>(null);

  const handleSearchResults = useCallback(
    (event: CustomEvent<OerSearchResultEvent>) => {
      const { data, meta } = event.detail;
      setOers(data);
      setLoading(false);
      setError(null);
      setShowPagination(true);
      setMetadata(meta);
    },
    [],
  );

  const handleSearchError = useCallback((event: CustomEvent<{ error: string }>) => {
    setOers([]);
    setLoading(false);
    setError(event.detail.error);
    setShowPagination(false);
    setMetadata(null);
  }, []);

  const handleSearchCleared = useCallback(() => {
    setOers([]);
    setLoading(false);
    setError(null);
    setShowPagination(false);
    setMetadata(null);
  }, []);

  const handleCardClick = useCallback((event: CustomEvent<OerCardClickEvent>) => {
    const oer = event.detail.oer;
    console.log('OER clicked:', oer);
    const url = oer.amb_metadata?.id || oer.url;
    if (url) {
      const urlString = typeof url === 'string' ? url : String(url);
      window.open(urlString, '_blank', 'noopener,noreferrer');
    } else {
      alert(`OER: ${oer.amb_metadata?.name || 'Unknown'}\nNo URL available`);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    searchRef.current?.handlePageChange(page);
  }, []);

  return (
    <div className="demo-container">
      <h1>OER Finder Plugin - React Example</h1>
      <p className="subtitle">
        Explore and discover Open Educational Resources from the Nostr network
      </p>

      <div className="demo-section">
        <h2>CSS Custom Properties Theme</h2>
        <p className="info-text">
          This example uses CSS custom properties to customize the theme colors. Check{' '}
          <code>styles.css</code> to see how colors are customized.
        </p>
        <OerSearch
          ref={searchRef}
          apiUrl="http://localhost:3001"
          language="de"
          pageSize={5}
          availableSources={[
            { value: 'nostr', label: 'Nostr' },
            { value: 'arasaac', label: 'ARASAAC' },
          ]}
          onSearchResults={handleSearchResults}
          onSearchError={handleSearchError}
          onSearchCleared={handleSearchCleared}
        />
        <OerList
          oers={oers}
          loading={loading}
          error={error}
          language="de"
          showPagination={showPagination}
          metadata={metadata}
          onPageChange={handlePageChange}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  );
}

export default App;
