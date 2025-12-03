# Using OER Finder Plugin in React

This guide covers React-specific integration of the `@edufeed-org/oer-finder-plugin-react` components. For general component documentation, see [Client Packages](./client-packages.md).

## Installation

### 1. Configure npm Registry

Create `.npmrc` in your project root:

```
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### 2. Install the Package

```bash
npm install @edufeed-org/oer-finder-plugin-react
```

## Available Components

The React package provides these components:

- `OerSearch` - Search form with filters
- `OerList` - Grid display of OER resources
- `OerCard` - Individual OER resource card
- `OerPagination` - Pagination controls

## Basic Implementation

```tsx
import { useState, useRef, useCallback } from 'react';
import {
  OerSearch,
  OerList,
  type OerSearchElement,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type OerMetadata,
} from '@edufeed-org/oer-finder-plugin-react';

function OerFinder() {
  const searchRef = useRef<OerSearchElement | null>(null);
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

  const handlePageChange = useCallback((page: number) => {
    searchRef.current?.handlePageChange(page);
  }, []);

  return (
    <div>
      <OerSearch
        ref={searchRef}
        apiUrl="https://your-api-url.com"
        language="en"
        pageSize={20}
        onSearchResults={handleSearchResults}
        onSearchError={handleSearchError}
        onSearchCleared={handleSearchCleared}
      />
      <OerList
        oers={oers}
        loading={loading}
        error={error}
        language="en"
        showPagination={showPagination}
        metadata={metadata}
        onPageChange={handlePageChange}
        onCardClick={handleCardClick}
      />
    </div>
  );
}
```

## Component Props

### OerSearch

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiUrl` | string | `'http://localhost:3000'` | Base URL of the OER Aggregator API |
| `pageSize` | number | `20` | Number of results per page |
| `language` | string | `'en'` | UI language ('en', 'de') |
| `lockedType` | string | - | Lock the type filter to a specific value |
| `showTypeFilter` | boolean | `true` | Show/hide type filter |
| `availableSources` | SourceOption[] | - | Available source options |
| `onSearchResults` | function | - | Callback when search completes |
| `onSearchError` | function | - | Callback when search fails |
| `onSearchCleared` | function | - | Callback when search is cleared |

### OerList

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `oers` | OerItem[] | `[]` | Array of OER items to display |
| `loading` | boolean | `false` | Show loading state |
| `error` | string | `null` | Error message to display |
| `language` | string | `'en'` | UI language ('en', 'de') |
| `showPagination` | boolean | `false` | Show/hide pagination controls |
| `metadata` | OerMetadata | `null` | Pagination metadata |
| `onPageChange` | function | - | Callback when page changes |
| `onCardClick` | function | - | Callback when a card is clicked |

## Styling with CSS Variables

Override colors in your stylesheet:

```css
oer-search,
oer-list,
oer-card {
  --primary-color: #8b5cf6;
  --primary-hover-color: #7c3aed;
  --secondary-color: #ec4899;
}
```

## Example

For a complete working example, see the `packages/oer-finder-plugin-react-example` directory in the repository.
