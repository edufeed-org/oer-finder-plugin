# Using OER Finder Plugin in React

This guide covers React-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install the React package:

```bash
pnpm add @edufeed-org/oer-finder-plugin-react
```

This package depends on `@edufeed-org/oer-finder-plugin` internally — you do not need to install the base plugin separately.

### Direct Client Mode

For direct client mode (no `apiUrl`), register adapters before rendering:

```typescript
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerAllBuiltInAdapters();
```

## Basic Usage

The recommended pattern is to slot `OerList` and `OerLoadMore` inside `OerSearch`:

```tsx
import { useState, useCallback } from 'react';
import {
  OerSearch,
  OerList,
  OerLoadMore,
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type OerMetadata,
  type SourceConfig,
} from '@edufeed-org/oer-finder-plugin-react';

// Configure available sources (checked: true sets the pre-selected sources)
const SOURCES: SourceConfig[] = [
  { id: 'nostr', label: 'Nostr', checked: true },
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
];

function OerFinder() {
  const [oers, setOers] = useState<OerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<OerMetadata | null>(null);

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
    (event: OerCardClickEvent) => {
      const oer = event.detail.oer;
      const url = oer.amb?.id;
      if (url) {
        window.open(String(url), '_blank', 'noopener,noreferrer');
      }
    },
    [],
  );

  // Note: load-more events bubble up and are automatically
  // caught by OerSearch to fetch the next page of results.

  return (
    <div>
      <OerSearch
        apiUrl="https://your-api-url.com"
        language="en"
        pageSize={20}
        sources={SOURCES}
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
        <OerLoadMore metadata={metadata} loading={loading} language="en" />
      </OerSearch>
    </div>
  );
}
```

## React Props vs Web Component Attributes

The React wrapper uses camelCase props that map to web component attributes:

| React Prop | Web Component Attribute / Property |
|------------|-----------------------------------|
| `apiUrl` | `api-url` |
| `pageSize` | `page-size` |
| `sources` | `sources` (JS property) |
| `lockedType` | `locked-type` |
| `showTypeFilter` | `show-type-filter` |
| `lockedSource` | `locked-source` |
| `showSourceFilter` | `show-source-filter` |
| `onSearchResults` | `search-results` event |
| `onSearchError` | `search-error` event |
| `onSearchCleared` | `search-cleared` event |
| `onCardClick` | `card-click` event |
| `onLoadMore` | `load-more` event |

## Example

See `packages/oer-finder-plugin-react-example` for a complete working example.
