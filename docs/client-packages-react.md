# Using OER Finder Plugin in React

This guide covers React-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install both packages:

```bash
pnpm add @edufeed-org/oer-finder-plugin @edufeed-org/oer-finder-plugin-react
```

The base plugin is a peer dependency of the React package. Both packages must be installed — the React package provides the React component wrappers, while the base plugin provides the Web Components, adapter registry, and adapter entry points.

## Operating Modes

The plugin supports **server-proxy mode** (with `apiUrl` prop) and **direct client mode** (without `apiUrl`). For full details on each mode, adapter registration, and available adapters, see [Client Packages — Routing Modes](./client-packages.md#routing-modes) and [Available Adapters](./client-packages.md#available-adapters).

- **Server-proxy mode**: Set `apiUrl` — no adapter registration needed, no adapter code in your bundle.
- **Direct client mode**: Omit `apiUrl` — register adapters at your app's entry point before the component renders. Import adapter registration functions from `@edufeed-org/oer-finder-plugin`.

## Basic Usage

The recommended pattern is to slot `OerList` and `OerLoadMore` inside `OerSearch`. Below are complete examples for each mode.

### Server-Proxy Mode Example

```tsx
import { useState, useCallback } from 'react';
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

// Configure available sources (checked: true sets the pre-selected sources)
const SOURCES: SourceConfig[] = [
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', checked: true },
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
  { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
  { id: 'wikimedia', label: 'Wikimedia Commons' },
];

function OerFinder() {
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
        onSearchLoading={handleSearchLoading}
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

### Direct Client Mode Example

The component code is identical to the [server-proxy example above](#server-proxy-mode-example) with two differences: adapters must be registered at startup, and the `apiUrl` prop is omitted.

**1. Register adapters once at your app entry point (e.g., `main.tsx`):**

```tsx
import { registerOpenverseAdapter } from '@edufeed-org/oer-finder-plugin/adapter/openverse';
import { registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin/adapter/arasaac';
registerOpenverseAdapter();
registerArasaacAdapter();
```

**2. Render `OerSearch` without `apiUrl`:**

```tsx
<OerSearch
  language="en"
  pageSize={20}
  sources={SOURCES}
  onSearchLoading={handleSearchLoading}
  onSearchResults={handleSearchResults}
  onSearchError={handleSearchError}
  onSearchCleared={handleSearchCleared}
>
  <OerList oers={oers} loading={loading} error={error} language="en" onCardClick={handleCardClick} />
  <OerLoadMore metadata={metadata} loading={loading} language="en" />
</OerSearch>
```

All state management, event handlers, and child components remain the same.

## Slot Architecture and Event Bubbling

`OerSearch` acts as the orchestrator. When you render `OerList` and `OerLoadMore` as children of `OerSearch`, they are slotted into the underlying `<oer-search>` web component. This enables **automatic event bubbling**: the `load-more` event fired by `OerLoadMore` bubbles up through the DOM and is caught by the parent `OerSearch`, which then fetches the next page of results and emits a new `search-results` event. You do not need to wire up any load-more handler yourself — just place the components in the correct parent-child relationship:

```tsx
<OerSearch /* handles pagination automatically */>
  <OerList /* displays results */ />
  <OerLoadMore /* fires load-more, caught by OerSearch */ />
</OerSearch>
```

If you render `OerLoadMore` outside of `OerSearch`, the event will not bubble to the search component and pagination will not work automatically. In that case you would need to handle the `onLoadMore` event yourself.

## Component Props Reference

### `OerSearch`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiUrl` | `string` | No | — | Base URL of the OER Proxy API. When provided, activates server-proxy mode. When omitted, activates direct client mode (adapters must be registered). |
| `sources` | `SourceConfig[]` | No | `[openverse, arasaac]` | Available sources shown in the UI. See [Source Configuration](./client-packages.md#source-configuration). |
| `language` | `SupportedLanguage` | No | `'en'` | UI language (`'en'` or `'de'`). |
| `pageSize` | `number` | No | `20` | Number of results per page. |
| `lockedType` | `string` | No | — | Lock the type filter to a specific value (e.g., `'image'`). |
| `showTypeFilter` | `boolean` | No | `true` | Show or hide the type filter dropdown. |
| `lockedSource` | `string` | No | — | Lock the source filter to a specific value. |
| `showSourceFilter` | `boolean` | No | `true` | Show or hide the source filter checkboxes. |

### `OerList`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `oers` | `OerItem[]` | No | `[]` | Array of OER items to display. |
| `loading` | `boolean` | No | `false` | When `true`, shows a loading skeleton. |
| `error` | `string \| null` | No | `null` | Error message to display. Pass `null` to clear. |
| `language` | `SupportedLanguage` | No | `'en'` | UI language (`'en'` or `'de'`). |

### `OerCard`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `oer` | `OerItem \| null` | No | `null` | OER item data to render. |
| `language` | `SupportedLanguage` | No | `'en'` | UI language (`'en'` or `'de'`). |

### `OerLoadMore`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `metadata` | `LoadMoreMeta \| null` | No | `null` | Pagination metadata (`{ total, shown, hasMore }`). Controls the "Showing X of Y" indicator and whether the button is visible. |
| `loading` | `boolean` | No | `false` | When `true`, disables the button and shows a loading state. |
| `language` | `SupportedLanguage` | No | `'en'` | UI language (`'en'` or `'de'`). |

## Event Handlers

### `OerSearch` Events

| Prop | Callback Signature | Description |
|------|-------------------|-------------|
| `onSearchLoading` | `(event: CustomEvent<void>) => void` | Fired when a search request starts. Use this to set loading state. |
| `onSearchResults` | `(event: OerSearchResultEvent) => void` | Fired when search completes. `event.detail` contains `{ data: OerItem[], meta: LoadMoreMeta }`. |
| `onSearchError` | `(event: CustomEvent<{ error: string }>) => void` | Fired when a search fails. `event.detail.error` contains the error message. |
| `onSearchCleared` | `(event: CustomEvent<void>) => void` | Fired when the user clears the search input. |

### `OerList` Events

| Prop | Callback Signature | Description |
|------|-------------------|-------------|
| `onCardClick` | `(event: OerCardClickEvent) => void` | Fired when a card is clicked. `event.detail.oer` contains the clicked `OerItem`. Bubbles up from child `OerCard` components. |

### `OerCard` Events

| Prop | Callback Signature | Description |
|------|-------------------|-------------|
| `onCardClick` | `(event: OerCardClickEvent) => void` | Fired when the card image is clicked. `event.detail.oer` contains the `OerItem`. |

### `OerLoadMore` Events

| Prop | Callback Signature | Description |
|------|-------------------|-------------|
| `onLoadMore` | `(event: CustomEvent<void>) => void` | Fired when the "Load more" button is clicked. When slotted inside `OerSearch`, this event bubbles up automatically to trigger the next page fetch — no manual handler needed. |

## Key Types

The React package (`@edufeed-org/oer-finder-plugin-react`) re-exports all shared types from the base plugin, so you can import everything from a single package. For the full list of shared types, see [Key Types](./client-packages.md#key-types).

```typescript
import {
  // React wrapper components
  OerSearch,
  OerList,
  OerCard,
  OerLoadMore,

  // All shared types are re-exported (OerItem, SourceConfig, event types, etc.)
  type OerSearchResultEvent,
  type OerCardClickEvent,
  type OerItem,
  type LoadMoreMeta,
  type SourceConfig,
  // ... see Client Packages — Key Types for the complete list
} from '@edufeed-org/oer-finder-plugin-react';
```

Adapter registry API and adapter registration functions are imported from `@edufeed-org/oer-finder-plugin`:

```typescript
import {
  registerAdapter,
  getAdapterFactory,
  type AdapterFactory,
} from '@edufeed-org/oer-finder-plugin';
```

### State Typing

When managing component state, use explicit generic parameters:

```typescript
const [oers, setOers] = useState<OerItem[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [metadata, setMetadata] = useState<LoadMoreMeta | null>(null);
```

## React Props to Web Component Attribute Mapping

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
| `onSearchLoading` | `search-loading` event |
| `onSearchResults` | `search-results` event |
| `onSearchError` | `search-error` event |
| `onSearchCleared` | `search-cleared` event |
| `onCardClick` | `card-click` event |
| `onLoadMore` | `load-more` event |

## Example

See `packages/oer-finder-plugin-react-example` for a complete working example.
