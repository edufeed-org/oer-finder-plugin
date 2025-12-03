# Using OER Finder Plugin in React

This guide covers React-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Create `.npmrc` in your project root:

```
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install:

```bash
npm install @edufeed-org/oer-finder-plugin-react
```

## Basic Usage

The recommended pattern is to slot `OerList` inside `OerSearch` for automatic pagination handling:

```tsx
import { useState, useCallback } from 'react';
import {
  OerSearch,
  OerList,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type OerMetadata,
} from '@edufeed-org/oer-finder-plugin-react';

function OerFinder() {
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

  const handleSearchError = useCallback(
    (event: CustomEvent<{ error: string }>) => {
      setOers([]);
      setLoading(false);
      setError(event.detail.error);
      setShowPagination(false);
      setMetadata(null);
    },
    [],
  );

  const handleSearchCleared = useCallback(() => {
    setOers([]);
    setLoading(false);
    setError(null);
    setShowPagination(false);
    setMetadata(null);
  }, []);

  const handleCardClick = useCallback(
    (event: CustomEvent<OerCardClickEvent>) => {
      const oer = event.detail.oer;
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        window.open(String(url), '_blank', 'noopener,noreferrer');
      }
    },
    [],
  );

  // Note: Pagination is handled automatically by OerSearch.
  // The page-change events from OerList bubble up and are caught by OerSearch,
  // which automatically triggers a new search with the updated page.

  return (
    <div>
      <OerSearch
        apiUrl="https://your-api-url.com"
        language="en"
        pageSize={20}
        showPagination={showPagination}
        metadata={metadata}
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
| `showPagination` | `show-pagination` |
| `metadata` | `metadata` |
| `onSearchResults` | `search-results` event |
| `onSearchError` | `search-error` event |
| `onSearchCleared` | `search-cleared` event |
| `onCardClick` | `card-click` event |
| `onPageChange` | `page-change` event |

## Example

See `packages/oer-finder-plugin-react-example` for a complete working example.
