# Using OER Finder Plugin in React

This guide covers React-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install the React package:

```bash
pnpm add @edufeed-org/oer-finder-plugin-react
```

The base plugin (`@edufeed-org/oer-finder-plugin`) is installed automatically as a dependency — you do not need to install it separately. All necessary imports (components, types, and adapter registration) are available directly from this React package.

> **Important:** Do not install `@edufeed-org/oer-finder-plugin` as a direct dependency alongside the React package. Doing so can result in two separate copies on disk, each with its own adapter registry. Adapters registered via one copy would be invisible to components from the other, causing searches to silently return zero results. Always import from `@edufeed-org/oer-finder-plugin-react` instead.

## Operating Modes

The plugin supports two operating modes, determined by whether the `apiUrl` prop is provided:

### Server-Proxy Mode (with `apiUrl`)

When `apiUrl` is set, all search requests are routed through your backend proxy. The server handles adapter logic, so **no adapter code is bundled into your client application**.

**Use this mode when:**
- You have a deployed OER Proxy backend
- You want to keep client bundle size small
- You need server-side features like image proxying, rate limiting, or signed URLs

```tsx
<OerSearch
  apiUrl="https://your-api-url.com"
  sources={SOURCES}
  // ...event handlers
>
```

No adapter registration is needed — just provide the `apiUrl` and configure your sources.

### Direct Client Mode (without `apiUrl`)

When `apiUrl` is **omitted**, adapters run directly in the browser. No backend server is required.

**Use this mode when:**
- You want a serverless setup with no backend dependency
- You are prototyping or building a static site
- You want full client-side control over adapter behavior

You **must register adapters** before the component renders. Call the registration function once at your app's entry point:

```typescript
// Register all built-in adapters
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerAllBuiltInAdapters();
```

Or register only the adapters you need:

```typescript
import { registerOpenverseAdapter, registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerOpenverseAdapter();
registerArasaacAdapter();
```

Then render `OerSearch` without `apiUrl`:

```tsx
<OerSearch
  sources={SOURCES}
  // ...event handlers (no apiUrl prop)
>
```

Only registered adapters will be available — unregistered source IDs in the `sources` config are silently skipped.

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
import { registerOpenverseAdapter, registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin-react/adapters';
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

## Available Adapters

The following built-in adapters are available for direct client mode:

| Adapter ID | Source | Notes |
|------------|--------|-------|
| `openverse` | Openverse (Flickr, Wikimedia, etc.) | Images, license filter |
| `arasaac` | ARASAAC pictograms API | Images only |
| `nostr-amb-relay` | Nostr AMB relay (WebSocket) | Requires `baseUrl` with WebSocket URL(s) in `SourceConfig` |
| `rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) | German educational resources |
| `wikimedia` | Wikimedia Commons API | Images |

Register all at once or selectively — all functions are available from a single import path:

```typescript
// All adapters
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerAllBuiltInAdapters();

// Or selectively
import { registerOpenverseAdapter, registerWikimediaAdapter } from '@edufeed-org/oer-finder-plugin-react/adapters';
registerOpenverseAdapter();
registerWikimediaAdapter();
```

## Key Types

All types are importable from `@edufeed-org/oer-finder-plugin-react`:

```typescript
import {
  // Components
  OerSearch,
  OerList,
  OerCard,
  OerLoadMore,

  // Event types
  type OerSearchResultEvent,   // CustomEvent<{ data: OerItem[], meta: LoadMoreMeta }>
  type OerSearchResultDetail,  // { data: OerItem[], meta: LoadMoreMeta }
  type OerCardClickEvent,      // CustomEvent<{ oer: OerItem }>
  type OerCardClickDetail,     // { oer: OerItem }

  // Data types
  type OerItem,                // Normalized AMB metadata for a single resource
  type OerMetadata,            // Metadata structure on OerItem
  type OerListResponse,        // Full list response shape from the API
  type LoadMoreMeta,           // { total: number, shown: number, hasMore: boolean }
  type SourceConfig,           // { id: string, label: string, baseUrl?: string, checked?: boolean }
  type SupportedLanguage,      // 'en' | 'de'
  type SearchParams,           // Search parameter structure
  type SourceOption,           // Source option type for UI display

  // Adapter types
  type AdapterFactory,         // Factory function type for custom adapters

  // Underlying web component types (for advanced use)
  type OerSearchElement,       // <oer-search> element class
  type OerListElement,         // <oer-list> element class
  type OerCardElement,         // <oer-card> element class
  type LoadMoreElement,        // <oer-load-more> element class

  // Adapter registry API
  registerAdapter,             // Register a custom adapter factory
  getAdapterFactory,           // Retrieve a registered adapter factory by ID
} from '@edufeed-org/oer-finder-plugin-react';
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
