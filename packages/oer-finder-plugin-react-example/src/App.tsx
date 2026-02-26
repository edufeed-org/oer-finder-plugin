/**
 * OER Finder Plugin React Example
 *
 * Demonstrates both routing modes:
 * 1) Server-Proxy mode: requests go through the proxy backend
 * 2) Direct Client mode: adapters run in the browser, no server needed
 */

import { useState, useCallback } from 'react';
import './styles.css';

// Register all built-in adapters (required for direct-client mode)
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerAllBuiltInAdapters();

// Import React components from the plugin-react package
import {
  OerSearch,
  OerList,
  OerLoadMore,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type LoadMoreMeta,
  type SourceConfig,
} from '@edufeed-org/oer-finder-plugin-react';

const SERVER_SOURCES: SourceConfig[] = [
  { id: 'nostr-amb-relay', label: 'AMB Relay', checked: true },
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
  { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
];

const DIRECT_SOURCES: SourceConfig[] = [
  { id: 'openverse', label: 'Openverse', checked: true },
  { id: 'arasaac', label: 'ARASAAC', checked: true },
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'ws://localhost:3334' },
  { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
];

interface SearchDemoProps {
  readonly apiUrl?: string;
  readonly sources: SourceConfig[];
}

function SearchDemo({ apiUrl, sources }: SearchDemoProps) {
  const [oers, setOers] = useState<OerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<LoadMoreMeta | null>(null);

  const handleSearchLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const handleSearchResults = useCallback(
    (event: OerSearchResultEvent) => {
      const { data, meta } = event.detail;
      setOers(data);
      setLoading(false);
      setError(null);
      setMetadata(meta);
    },
    [],
  );

  const handleSearchError = useCallback((event: CustomEvent<{ error: string }>) => {
    setOers([]);
    setLoading(false);
    setError(event.detail.error);
    setMetadata(null);
  }, []);

  const handleSearchCleared = useCallback(() => {
    setOers([]);
    setLoading(false);
    setError(null);
    setMetadata(null);
  }, []);

  const handleCardClick = useCallback((event: OerCardClickEvent) => {
    const oer = event.detail.oer;
    const url = oer.extensions.system?.foreignLandingUrl || oer.amb.id;
    if (url) {
      window.open(String(url), '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <OerSearch
      apiUrl={apiUrl}
      language="de"
      pageSize={12}
      sources={sources}
      onSearchLoading={handleSearchLoading}
      onSearchResults={handleSearchResults}
      onSearchError={handleSearchError}
      onSearchCleared={handleSearchCleared}
    >
      <OerList
        oers={oers}
        loading={loading}
        error={error}
        language="de"
        onCardClick={handleCardClick}
      />
      <OerLoadMore metadata={metadata} loading={loading} language="de" />
    </OerSearch>
  );
}

function App() {
  return (
    <div className="demo-container">
      <h1>OER Finder Plugin - React Example</h1>
      <p className="subtitle">
        Explore and discover Open Educational Resources. Compare both routing modes below.
      </p>

      {/* Mode 1: Server-Proxy */}
      <div className="demo-section">
        <div className="mode-badge mode-badge--server">Server-Proxy Mode</div>
        <h2>1) Via Proxy Server</h2>
        <p className="info-text">
          Requests are routed through the proxy backend at <code>http://localhost:3000</code>.
          The server proxies all adapter calls. Requires the proxy to be running.
        </p>
        <SearchDemo apiUrl="http://localhost:3000" sources={SERVER_SOURCES} />
      </div>

      <hr className="section-divider" />

      {/* Mode 2: Direct Client */}
      <div className="demo-section">
        <div className="mode-badge mode-badge--direct">Direct Client Mode</div>
        <h2>2) Direct Client-Side (No Server)</h2>
        <p className="info-text">
          Adapters run directly in the browser. No proxy server needed.
          Each adapter fetches data from its source API directly.
        </p>
        <SearchDemo sources={DIRECT_SOURCES} />
      </div>
    </div>
  );
}

export default App;
