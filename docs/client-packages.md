# Client Packages

The OER Proxy provides the following packages for integrating OER resources into your applications:

1. **API Client** (`@edufeed-org/oer-finder-api-client`) - Type-safe TypeScript client for direct API access
2. **Web Components Plugin** (`@edufeed-org/oer-finder-plugin`) - Ready-to-use web components built with Lit
3. **React Components** (`@edufeed-org/oer-finder-plugin-react`) - React wrapper components for the web components plugin

## Registry Setup

All packages are published to GitHub's package registry. Before installing, configure your `.npmrc` file in your project root:

```
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then set the `GITHUB_TOKEN` environment variable with a GitHub personal access token that has `read:packages` scope.

## API Client Package

The `@edufeed-org/oer-finder-api-client` package provides a type-safe TypeScript client for interacting with the OER Proxy API. It's automatically generated from the OpenAPI specification, ensuring type safety and up-to-date API compatibility.

### Installation

```bash
pnpm add @edufeed-org/oer-finder-api-client
```

### Basic Usage

```typescript
import { createOerClient } from '@edufeed-org/oer-finder-api-client';

// Create a new API client
const client = createOerClient('http://localhost:3000');

// List OER resources with filters
const { data, error } = await client.GET('/api/v1/oer', {
  params: { query: { source: 'nostr-amb-relay' } }
});

if (error) {
  console.error('Error fetching resources:', error);
} else {
  console.log('Found resources:', data);
}
```

### Advanced Usage

#### Health Check

```typescript
// Check API health status
const { data: health } = await client.GET('/health');
console.log('API Health:', health);
```

#### Pagination

```typescript
// Fetch resources with pagination
const { data } = await client.GET('/api/v1/oer', {
  params: {
    query: {
      source: 'nostr-amb-relay',
      page: 2,
      pageSize: 20
    }
  }
});

console.log(`Total: ${data.meta.total}`);
console.log(`Page: ${data.meta.page} of ${data.meta.totalPages}`);
```

#### Filtering

```typescript
// Search with multiple filters
const { data } = await client.GET('/api/v1/oer', {
  params: {
    query: {
      source: 'openverse',
      searchTerm: 'plants',
      type: 'image',
      language: 'en'
    }
  }
});
```

### Type Exports

The package exports useful TypeScript types for working with the API:

```typescript
import type {
  OerItem,
  OerMetadata,
  OerListResponse,
  OerQueryParams,
  ImageUrls,
  OerClient,
} from '@edufeed-org/oer-finder-api-client';

// Use types in your application
function displayResource(resource: OerItem) {
  console.log(resource.amb.id);            // Resource URL
  console.log(resource.extensions.system.source);       // e.g., "nostr-amb-relay", "arasaac"
  console.log(resource.amb.name);          // Resource name/title
  console.log(resource.extensions.system.attribution);  // Attribution text
  console.log(resource.amb.creator);       // Creator(s)
}
```

> **Tip:** If you are using the web components plugin (`@edufeed-org/oer-finder-plugin`) or the React wrapper, you can import these same types directly from the plugin package — no need to install the API client separately:
>
> ```typescript
> import type { OerItem, OerMetadata, OerListResponse } from '@edufeed-org/oer-finder-plugin';
> ```

### Response Structure

Each OER item in the API response follows this structure:

```typescript
{
  amb: {
    id: string;               // Resource URL
    name?: string;            // Resource name/title
    description?: string;     // Description
    keywords?: string[];      // Keywords/tags
    creator?: object;         // Creator(s) (person or organization)
    license?: object;         // License information
    // ... other AMB metadata fields
  },
  extensions: {
    fileMetadata?: {
      fileDim?: string | null;  // Dimensions (e.g., "1920x1080")
      fileAlt?: string | null;  // Alternative text
    } | null,
    images?: {
      high: string;    // High resolution URL
      medium: string;  // Medium resolution URL
      small: string;   // Small resolution URL
    } | null,
    system: {
      source: string;                  // Origin identifier (e.g., "nostr-amb-relay", "arasaac")
      foreignLandingUrl?: string | null;  // Landing page URL
      attribution?: string | null;     // Attribution/copyright notice
    }
  }
}
```

## Web Components Plugin

The `@edufeed-org/oer-finder-plugin` package provides web components for integrating OER resources into your application using Lit. The package includes separate components for search, display, and theming.

### Installation

Ensure [Registry Setup](#registry-setup) is configured, then:

```bash
pnpm add @edufeed-org/oer-finder-plugin
```

The plugin depends on `@edufeed-org/oer-finder-api-client`, which will be installed automatically as a transitive dependency.

### Available Components

The plugin provides five main components:

- `<oer-search>` - Search form with filters
- `<oer-list>` - Grid display of OER resources
- `<oer-card>` - Individual OER resource card
- `<oer-load-more>` - "Load more" button with progress indicator

### Basic Usage

#### Import and Register Components

```javascript
import '@edufeed-org/oer-finder-plugin';
```

#### Simple Usage

The recommended pattern is to slot `<oer-list>` and `<oer-load-more>` inside `<oer-search>`:

```html
<oer-search api-url="http://localhost:3000">
  <oer-list></oer-list>
  <oer-load-more></oer-load-more>
</oer-search>

<script type="module">
  const searchElement = document.querySelector('oer-search');
  const listElement = document.querySelector('oer-list');
  const loadMoreElement = document.querySelector('oer-load-more');

  // Listen for search loading
  searchElement.addEventListener('search-loading', () => {
    listElement.loading = true;
    loadMoreElement.loading = true;
  });

  // Listen for search results
  searchElement.addEventListener('search-results', (event) => {
    listElement.oers = event.detail.data;
    listElement.loading = false;
    loadMoreElement.metadata = event.detail.meta;
    loadMoreElement.loading = false;
  });

  // Listen for search errors
  searchElement.addEventListener('search-error', (event) => {
    listElement.error = event.detail.error;
    listElement.loading = false;
    loadMoreElement.metadata = null;
    loadMoreElement.loading = false;
  });

  // Listen for search cleared
  searchElement.addEventListener('search-cleared', () => {
    listElement.oers = [];
    listElement.loading = false;
    loadMoreElement.metadata = null;
    loadMoreElement.loading = false;
  });

  // Note: load-more events bubble up and are automatically
  // caught by oer-search to fetch the next page of results.
</script>
```

### Routing Modes

The plugin supports two routing modes, determined by whether `api-url` is set. The key difference is **where adapter code runs** and whether you need to register adapters on the client side.

1. **Server-Proxy mode** — When `api-url` is provided, all requests go through the proxy backend. The server handles all adapter logic. **No adapter registration or imports are needed on the client side** — no adapter code is bundled into your application, keeping the client bundle small. Source IDs are passed as query parameters to the server.
2. **Direct Client mode** — When `api-url` is *not* provided, adapters run directly in the browser. No server needed. **You must register adapters before the first search** by calling the appropriate `register*Adapter()` functions (see [Setting Sources — Direct Client Mode](#setting-sources-direct-client-mode)).

In both modes, use the `sources` JS property to configure which sources are available in the UI (labels, checkboxes, pre-selection).

### Component Properties

#### `<oer-search>`

Search form with filters.

| Attribute / Property | Type | Default | Description |
|---------------------|------|---------|-------------|
| `api-url` | `string` | — | Base URL of the OER Proxy API. When provided, activates server-proxy mode. When omitted, activates direct client mode (adapters must be registered). |
| `sources` | `SourceConfig[]` | `[openverse, arasaac]` | Available sources shown in the UI. **JS property only** — must be set programmatically. See [Source Configuration](#source-configuration). |
| `language` | `SupportedLanguage` | `'en'` | UI language (`'en'` or `'de'`). |
| `page-size` | `number` | `20` | Number of results per page. |
| `locked-type` | `string` | — | Lock the type filter to a specific value (e.g., `'image'`). |
| `show-type-filter` | `boolean` | `true` | Show or hide the type filter dropdown. |
| `locked-source` | `string` | — | Lock the source filter to a specific value. |
| `show-source-filter` | `boolean` | `true` | Show or hide the source filter checkboxes. |

**Events:**

| Event Name | Detail Type | Description |
|------------|------------|-------------|
| `search-loading` | `void` | Fired when a search request starts. Use this to set loading state. |
| `search-results` | `OerSearchResultDetail` | Fired when search completes. Contains `{ data: OerItem[], meta: LoadMoreMeta }`. |
| `search-error` | `{ error: string }` | Fired when a search fails. |
| `search-cleared` | `void` | Fired when the user clears the search input. |

#### `<oer-list>`

Displays OER resources in a grid layout.

| Attribute / Property | Type | Default | Description |
|---------------------|------|---------|-------------|
| `oers` | `OerItem[]` | `[]` | Array of OER items to display. **JS property only.** |
| `loading` | `boolean` | `false` | When `true`, shows a loading skeleton. |
| `error` | `string \| null` | `null` | Error message to display. Pass `null` to clear. |
| `language` | `SupportedLanguage` | `'en'` | UI language (`'en'` or `'de'`). |

**Events:**

| Event Name | Detail Type | Description |
|------------|------------|-------------|
| `card-click` | `OerCardClickDetail` | Fired when a card is clicked. Contains `{ oer: OerItem }`. Bubbles up from child `<oer-card>` components. |

#### `<oer-card>`

Individual OER resource card (used internally by `<oer-list>`).

| Attribute / Property | Type | Default | Description |
|---------------------|------|---------|-------------|
| `oer` | `OerItem \| null` | `null` | OER item data to render. **JS property only.** |
| `language` | `SupportedLanguage` | `'en'` | UI language (`'en'` or `'de'`). |

**Events:**

| Event Name | Detail Type | Description |
|------------|------------|-------------|
| `card-click` | `OerCardClickDetail` | Fired when the card image is clicked. Contains `{ oer: OerItem }`. Bubbles and composes through shadow DOM. |

#### `<oer-load-more>`

"Load more" button with a "Showing X of Y" progress indicator. Slot inside `<oer-search>`.

| Attribute / Property | Type | Default | Description |
|---------------------|------|---------|-------------|
| `metadata` | `LoadMoreMeta \| null` | `null` | Pagination metadata (`{ total, shown, hasMore }`). **JS property only.** |
| `loading` | `boolean` | `false` | When `true`, disables the button and shows a loading state. |
| `language` | `SupportedLanguage` | `'en'` | UI language (`'en'` or `'de'`). |

**Events:**

| Event Name | Detail Type | Description |
|------------|------------|-------------|
| `load-more` | `void` | Fired when the "Load more" button is clicked. When slotted inside `<oer-search>`, this event bubbles up automatically to trigger the next page fetch — no manual handler needed. |

### Styling with CSS Variables

You can customize colors by overriding CSS custom properties:

```html
<style>
  oer-search, oer-list, oer-card {
    --primary-color: #8b5cf6;
    --primary-hover-color: #7c3aed;
    --secondary-color: #ec4899;
  }
</style>

<oer-search api-url="http://localhost:3000"></oer-search>
<oer-list></oer-list>
```

Available CSS custom properties:

| CSS Variable | Description |
|--------------|-------------|
| `--primary-color` | Primary interaction color |
| `--primary-hover-color` | Primary hover state color |
| `--secondary-color` | Secondary accent color |
| `--background-card` | Card background color |
| `--background-form` | Form background color |
| `--background-input` | Input field background color |
| `--text-primary` | Primary text color |
| `--text-secondary` | Secondary text color |
| `--text-muted` | Muted/hint text color |
| `--border-color` | General border color |
| `--input-border-color` | Input field border color |

### Complete Working Example

Here's a complete example showing how to integrate the search, list, and load-more components with event handling and card clicks:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OER Finder Example</title>
</head>
<body>
  <oer-search
    id="search"
    api-url="http://localhost:3000"
    language="en"
    page-size="20">
    <oer-list id="list" language="en"></oer-list>
    <oer-load-more id="load-more" language="en"></oer-load-more>
  </oer-search>

  <script type="module">
    import '@edufeed-org/oer-finder-plugin';

    const searchElement = document.getElementById('search');
    const listElement = document.getElementById('list');
    const loadMoreElement = document.getElementById('load-more');

    // Configure available sources
    searchElement.sources = [
      { id: 'nostr-amb-relay', label: 'AMB Relay' },
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
      { id: 'wikimedia', label: 'Wikimedia Commons' },
    ];

    // Handle search loading
    searchElement.addEventListener('search-loading', () => {
      listElement.loading = true;
      loadMoreElement.loading = true;
    });

    // Handle search results
    searchElement.addEventListener('search-results', (event) => {
      const { data, meta } = event.detail;
      listElement.oers = data;
      listElement.loading = false;
      listElement.error = null;
      loadMoreElement.metadata = meta;
      loadMoreElement.loading = false;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event) => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = event.detail.error;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = null;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    // Handle card clicks (open resource in new tab)
    listElement.addEventListener('card-click', (event) => {
      const oer = event.detail.oer;
      const url = oer.amb?.id;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });

    // Note: load-more events bubble up and are automatically
    // caught by oer-search to fetch the next page of results.
  </script>
</body>
</html>
```

### Key Types

The plugin exports all types needed for working with components, events, and data. You can import them directly from `@edufeed-org/oer-finder-plugin` — no need to install the API client package separately.

```typescript
import type {
  // Web component element types (for element references)
  OerSearchElement,       // <oer-search> element class
  OerListElement,         // <oer-list> element class
  OerCardElement,         // <oer-card> element class
  LoadMoreElement,        // <oer-load-more> element class

  // Event types
  OerSearchResultEvent,   // CustomEvent<{ data: OerItem[], meta: LoadMoreMeta }>
  OerSearchResultDetail,  // { data: OerItem[], meta: LoadMoreMeta }
  OerCardClickEvent,      // CustomEvent<{ oer: OerItem }>
  OerCardClickDetail,     // { oer: OerItem }

  // Data types
  OerItem,                // Normalized AMB metadata for a single resource
  OerMetadata,            // Metadata structure on OerItem
  OerListResponse,        // Full list response shape from the API
  LoadMoreMeta,           // { total: number, shown: number, hasMore: boolean }
  SourceConfig,           // { id: string, label: string, baseUrl?: string, checked?: boolean }
  SupportedLanguage,      // 'en' | 'de'
  SearchParams,           // Search parameter structure
  SourceOption,           // Source option type for UI display
} from '@edufeed-org/oer-finder-plugin';
```

Adapter registry API (for custom adapters):

```typescript
import {
  registerAdapter,             // Register a custom adapter factory
  getAdapterFactory,           // Retrieve a registered adapter factory by ID
  type AdapterFactory,         // Factory function type for custom adapters
} from '@edufeed-org/oer-finder-plugin';
```

API client types and functions are also re-exported from the plugin:

```typescript
import type { OerQueryParams, OerClient, ImageUrls } from '@edufeed-org/oer-finder-plugin';
import { createOerClient } from '@edufeed-org/oer-finder-plugin';
```

### Available Adapters

The following built-in adapters are available for direct client mode. In server-proxy mode, adapters run on the server and no client-side registration is needed.

| Adapter ID | Source | Capabilities | Notes |
|------------|--------|-------------|-------|
| `openverse` | Openverse (Flickr, Wikimedia, etc.) | Images | License filter supported |
| `arasaac` | ARASAAC pictograms API | Images | Pictograms only |
| `nostr-amb-relay` | Nostr AMB relay (WebSocket, kind 30142) | All types | Requires `baseUrl` with WebSocket URL(s) in `SourceConfig`. Supports multiple relays via comma-separated URLs. |
| `rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) | All types | German educational resources. License and educational level filtering. |
| `wikimedia` | Wikimedia Commons API | Images, video, audio | — |

Register all at once or selectively — import adapter registration functions from `@edufeed-org/oer-finder-plugin`:

```typescript
// All adapters
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
registerAllBuiltInAdapters();

// Or selectively (better for tree-shaking)
import { registerOpenverseAdapter } from '@edufeed-org/oer-finder-plugin/adapter/openverse';
import { registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin/adapter/arasaac';
import { registerNostrAmbRelayAdapter } from '@edufeed-org/oer-finder-plugin/adapter/nostr-amb-relay';
import { registerRpiVirtuellAdapter } from '@edufeed-org/oer-finder-plugin/adapter/rpi-virtuell';
import { registerWikimediaAdapter } from '@edufeed-org/oer-finder-plugin/adapter/wikimedia';
```

Only registered adapters will be available — unregistered source IDs in the `sources` config are silently skipped.

### Source Configuration

Sources are configured using the `SourceConfig` interface and set as a JS property on `<oer-search>`:

```typescript
interface SourceConfig {
  /** Unique source identifier (e.g., 'openverse', 'nostr-amb-relay') */
  readonly id: string;
  /** Human-readable label for the UI dropdown */
  readonly label: string;
  /** Base URL for the source adapter (e.g., relay URL, API endpoint) */
  readonly baseUrl?: string;
  /** Mark this source as pre-checked in the UI. Only checked sources are selected by default. */
  readonly checked?: boolean;
}
```

**Available source IDs:**

| Source ID | Description | `baseUrl` |
|-----------|-------------|-----------|
| `nostr-amb-relay` | Nostr AMB Relay | Required. WebSocket URL(s) — supports comma-separated values for multiple relays (e.g., `'wss://relay1.example.com, wss://relay2.example.com'`) |
| `openverse` | Openverse | Not needed |
| `arasaac` | ARASAAC | Not needed |
| `wikimedia` | Wikimedia Commons | Not needed |
| `rpi-virtuell` | RPI-Virtuell | Optional (has a default) |

If no `sources` are provided, the plugin defaults to `openverse` and `arasaac`.

**Default source selection:** By default, all sources are pre-selected. To override this, set `checked: true` on the sources you want pre-selected. Only sources with `checked: true` will be initially checked. If no sources have `checked: true`, all are selected as a fallback.

#### Setting Sources (Server-Proxy Mode)

In server-proxy mode, you only need to configure source metadata for the UI. No adapter registration or adapter imports are needed — the server handles all adapter logic, and no adapter code is included in your client bundle.

```javascript
const searchElement = document.querySelector('oer-search');
searchElement.sources = [
  { id: 'nostr-amb-relay', label: 'AMB Relay' },
  { id: 'openverse', label: 'Openverse', checked: true },
  { id: 'arasaac', label: 'ARASAAC' },
];
```

#### Setting Sources (Direct Client Mode)

In direct client mode, adapters run in the browser. You must register them before the first search. Only registered adapters will be available — unregistered source IDs in the `sources` config are silently skipped.

**Register all built-in adapters:**

```javascript
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
registerAllBuiltInAdapters();
```

**Or register only the adapters you need** (reduces bundle size):

```javascript
import { registerOpenverseAdapter } from '@edufeed-org/oer-finder-plugin/adapter/openverse';
import { registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin/adapter/arasaac';
registerOpenverseAdapter();
registerArasaacAdapter();
```

Then configure sources as usual:

```javascript
const searchElement = document.querySelector('oer-search');
searchElement.sources = [
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC', checked: true },
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
  { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
];
```

#### Nostr AMB Relay Adapter

The `nostr-amb-relay` adapter connects to one or more [AMB relay](https://github.com/edufeed-org/amb-relay) instances via WebSocket to search educational metadata using the Nostr protocol (kind 30142 events).

**Key features:**
- Fan-out queries to multiple relays concurrently with result merging and deduplication
- Supports all resource types, license filtering, and educational level filtering
- Uses `learningResourceType` (HCRT vocabulary) for type filtering

**Configuration:** Set `baseUrl` in the `SourceConfig` to one or more WebSocket URLs. For multiple relays, separate URLs with commas:

```javascript
// Single relay
{ id: 'nostr-amb-relay', label: 'AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' }

// Multiple relays (fan-out: queries all relays, merges and deduplicates results)
{ id: 'nostr-amb-relay', label: 'AMB Relay', baseUrl: 'wss://relay1.example.com, wss://relay2.example.com' }
```

In direct client mode, you must register the adapter before the first search:

```javascript
import { registerNostrAmbRelayAdapter } from '@edufeed-org/oer-finder-plugin/adapter/nostr-amb-relay';
registerNostrAmbRelayAdapter();
```

In server-proxy mode, relay URLs are configured server-side via the `NOSTR_AMB_RELAY_URL` environment variable (also comma-separated for multiple relays) — no adapter registration is needed on the client.

### Advanced Features

#### Customizing Page Size

You can control the number of results per page using the `page-size` attribute:

```html
<oer-search
  api-url="http://localhost:3000"
  page-size="10">
</oer-search>
```

#### Locking Type Filter for Images Only

```html
<oer-search
  api-url="http://localhost:3000"
  locked-type="image"
  show-type-filter="false">
</oer-search>
```

#### Using German Language

```html
<oer-search
  api-url="http://localhost:3000"
  language="de">
</oer-search>
<oer-list language="de"></oer-list>
```

## React Components Package

The `@edufeed-org/oer-finder-plugin-react` package provides React wrapper components for the web components plugin using `@lit/react`.

### Installation

Ensure [Registry Setup](#registry-setup) is configured, then:

```bash
pnpm add @edufeed-org/oer-finder-plugin @edufeed-org/oer-finder-plugin-react
```

Both packages must be installed — the base plugin is a peer dependency of the React package. Import React components from the React package, and adapter registration functions directly from the base plugin.

For usage details, see the [React guide](./client-packages-react.md).

## Framework-Specific Guides

- [React](./client-packages-react.md)
- [Svelte](./client-packages-svelte.md)
- [Angular](./client-packages-angular.md)

## Example Applications

See the `packages/oer-finder-plugin-example` directory for a complete working example using web components, and `packages/oer-finder-plugin-react-example` for a React example.
