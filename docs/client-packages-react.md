# Using OER Finder Plugin in React

This guide covers React-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

For installation, see [Client Packages (Web Components Plugin)](./client-packages.md).

## Basic Usage

The recommended pattern is to slot `OerList` and `OerPagination` inside `OerSearch` for automatic pagination handling:

```tsx
import { useState, useCallback } from 'react';
import {
  OerSearch,
  OerList,
  OerPagination,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type OerMetadata,
} from '@edufeed-org/oer-finder-plugin-react';

function OerFinder() {
  const [oers, setOers] = useState<OerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<OerMetadata | null>(null);

  const handleSearchResults = useCallback(
    (event: CustomEvent<OerSearchResultEvent>) => {
      const { data, meta } = event.detail;
      setOers(data);
      setLoading(false);
      setError(null);
      setMetadata(meta);
    },
    [],
  );

  const handleSearchError = useCallback(
    (event: CustomEvent<{ error: string }>) => {
      setOers([]);
      setLoading(false);
      setError(event.detail.error);
      setMetadata(null);
    },
    [],
  );

  const handleSearchCleared = useCallback(() => {
    setOers([]);
    setLoading(false);
    setError(null);
    setMetadata(null);
  }, []);

  const handleCardClick = useCallback(
    (event: CustomEvent<OerCardClickEvent>) => {
      const oer = event.detail.oer;
      const url = oer.amb?.id;
      if (url) {
        window.open(String(url), '_blank', 'noopener,noreferrer');
      }
    },
    [],
  );

  // Note: Page-change events from OerPagination bubble up and are
  // automatically caught by OerSearch to trigger new searches.

  return (
    <div>
      <OerSearch
        apiUrl="https://your-api-url.com"
        language="en"
        pageSize={20}
        onSearchResults={handleSearchResults}
        onSearchError={handleSearchError}
        onSearchCleared={handleSearchCleared}
      >
        <OerList
          oers={oers}
          loading={loading}
          error={error}
          language="en"
          onCardClick={handleCardClick}
        />
        <OerPagination metadata={metadata} loading={loading} language="en" />
      </OerSearch>
    </div>
  );
}
```

## React Props vs Web Component Attributes

The React wrapper uses camelCase props that map to web component attributes:

| React Prop | Web Component Attribute |
|------------|------------------------|
| `apiUrl` | `api-url` |
| `pageSize` | `page-size` |
| `lockedType` | `locked-type` |
| `showTypeFilter` | `show-type-filter` |
| `onSearchResults` | `search-results` event |
| `onSearchError` | `search-error` event |
| `onSearchCleared` | `search-cleared` event |
| `onCardClick` | `card-click` event |
| `onPageChange` | `page-change` event |

## Example

See `packages/oer-finder-plugin-react-example` for a complete working example.
