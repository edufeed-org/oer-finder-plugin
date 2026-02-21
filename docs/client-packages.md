# Client Packages

The OER Aggregator provides the following packages for integrating OER resources into your applications:

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

The `@edufeed-org/oer-finder-api-client` package provides a type-safe TypeScript client for interacting with the OER Aggregator API. It's automatically generated from the OpenAPI specification, ensuring type safety and up-to-date API compatibility.

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
const { data, error } = await client.GET('/api/v1/oer');

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
      license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      educational_level: 'https://w3id.org/kim/educationalLevel/level_A',
      free_for_use: true,
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
  OerQueryParams
} from '@edufeed-org/oer-finder-api-client';

// Use types in your application
function displayResource(resource: OerItem) {
  console.log(resource.amb.id);            // Resource URL
  console.log(resource.extensions.system.source);       // e.g., "nostr", "arasaac"
  console.log(resource.amb.name);          // Resource name/title
  console.log(resource.extensions.system.attribution);  // Attribution text
  console.log(resource.amb.creator);       // Creator(s)
}
```

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
      source: string;                  // Origin identifier (e.g., "nostr", "arasaac")
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

Add an override for the API client dependency in your `package.json`, otherwise the internal workspace reference will fail:

```json
"pnpm": {
  "overrides": {
    "@edufeed-org/oer-finder-api-client": "^0.0.7"
  }
}
```

### Available Components

The plugin provides four main components:

- `<oer-search>` - Search form with filters and optional pagination
- `<oer-list>` - Grid display of OER resources
- `<oer-card>` - Individual OER resource card
- `<oer-pagination>` - Pagination controls (used internally by `<oer-search>`)

### Basic Usage

#### Import and Register Components

```javascript
import '@edufeed-org/oer-finder-plugin';
```

#### Simple Usage

The recommended pattern is to slot `<oer-list>` and `<oer-pagination>` inside `<oer-search>` for automatic pagination handling:

```html
<oer-search api-url="http://localhost:3000">
  <oer-list></oer-list>
  <oer-pagination></oer-pagination>
</oer-search>

<script type="module">
  const searchElement = document.querySelector('oer-search');
  const listElement = document.querySelector('oer-list');
  const paginationElement = document.querySelector('oer-pagination');

  // Listen for search results
  searchElement.addEventListener('search-results', (event) => {
    listElement.oers = event.detail.data;
    listElement.loading = false;
    paginationElement.metadata = event.detail.meta;
    paginationElement.loading = false;
  });

  // Listen for search errors
  searchElement.addEventListener('search-error', (event) => {
    listElement.error = event.detail.error;
    listElement.loading = false;
    paginationElement.metadata = null;
    paginationElement.loading = false;
  });

  // Listen for search cleared
  searchElement.addEventListener('search-cleared', () => {
    listElement.oers = [];
    listElement.loading = false;
    paginationElement.metadata = null;
    paginationElement.loading = false;
  });

  // Note: Page-change events from oer-pagination bubble up and are
  // automatically caught by oer-search to trigger new searches.
</script>
```

### Routing Modes

The plugin supports two routing modes, determined by whether `api-url` is set:

1. **Server-Proxy mode** — When `api-url` is provided, all requests go through the aggregator backend. The server proxies adapter calls. Requires the aggregator server to be running.
2. **Direct Client mode** — When `api-url` is *not* provided, adapters run directly in the browser. No server needed.

In both modes, use the `sources` JS property to configure which sources are available.

### Component Properties

#### `<oer-search>`

Search form with filters.

**HTML Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `api-url` | String | - | Base URL of the OER Aggregator API. If provided, server-proxy mode is used; otherwise direct client mode. |
| `page-size` | Number | `20` | Number of results per page |
| `language` | String | `'en'` | UI language ('en', 'de') |
| `locked-type` | String | - | Lock the type filter to a specific value |
| `show-type-filter` | Boolean | `true` | Show/hide type filter |
| `locked-source` | String | - | Lock the source filter to a specific value |
| `show-source-filter` | Boolean | `true` | Show/hide source filter |

**JS Properties (set via JavaScript, not HTML attributes):**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sources` | `SourceConfig[]` | `[openverse, arasaac]` | Array of source configurations. See [Source Configuration](#source-configuration) below. |

**Events:**
- `search-results` - Fired when search completes successfully (detail: `{data, meta}`)
- `search-error` - Fired when search fails (detail: `{error}`)
- `search-cleared` - Fired when search is cleared

#### `<oer-list>`

Displays OER resources in a grid layout.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `oers` | Array | `[]` | Array of OER items to display |
| `loading` | Boolean | `false` | Show loading state |
| `error` | String | `null` | Error message to display |
| `language` | String | `'en'` | UI language ('en', 'de') |

**Events:**
- `card-click` - Fired when a card is clicked (detail: `{oer}`) - bubbles up from child `<oer-card>` components

#### `<oer-card>`

Individual OER resource card (used internally by `<oer-list>`).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `oer` | Object | Required | OER item data |
| `language` | String | `'en'` | UI language ('en', 'de') |

**Events:**
- `card-click` - Fired when the card image is clicked (detail: `{oer}`, bubbles: true, composed: true)

#### `<oer-pagination>`

Pagination controls (used internally by `<oer-search>` when `show-pagination` is enabled).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metadata` | Object | `null` | Pagination metadata (page, totalPages, total) |
| `loading` | Boolean | `false` | Disable buttons during loading |
| `language` | String | `'en'` | UI language ('en', 'de') |

**Events:**
- `page-change` - Fired when page changes (detail: `{page}`, bubbles: true, composed: true)

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
| `--text-primary` | Primary text color |
| `--text-secondary` | Secondary text color |
| `--text-muted` | Muted/hint text color |

### Complete Working Example

Here's a complete example showing how to integrate the search, list, and pagination components with event handling and card clicks:

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
    <oer-pagination id="pagination" language="en"></oer-pagination>
  </oer-search>

  <script type="module">
    import '@edufeed-org/oer-finder-plugin';

    const searchElement = document.getElementById('search');
    const listElement = document.getElementById('list');
    const paginationElement = document.getElementById('pagination');

    // Configure available sources
    searchElement.sources = [
      { id: 'nostr', label: 'OER Aggregator Nostr Database' },
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ];

    // Handle search results
    searchElement.addEventListener('search-results', (event) => {
      const { data, meta } = event.detail;
      listElement.oers = data;
      listElement.loading = false;
      listElement.error = null;
      // Set metadata and loading on the pagination element
      paginationElement.metadata = meta;
      paginationElement.loading = false;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event) => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = event.detail.error;
      paginationElement.metadata = null;
      paginationElement.loading = false;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = null;
      paginationElement.metadata = null;
      paginationElement.loading = false;
    });

    // Handle card clicks (open resource in new tab)
    listElement.addEventListener('card-click', (event) => {
      const oer = event.detail.oer;
      const url = oer.amb?.id;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });

    // Note: Page-change events from oer-pagination bubble up and are
    // automatically caught by oer-search to trigger new searches.
  </script>
</body>
</html>
```

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
  /** Mark this source as the default selection. First marked source wins. */
  readonly selected?: boolean;
}
```

**Available source IDs:**

| Source ID | Description | `baseUrl` |
|-----------|-------------|-----------|
| `nostr` | OER Aggregator Nostr Database | Not needed (server-proxy only) |
| `nostr-amb-relay` | Nostr AMB Relay | Required (e.g., `'wss://amb-relay.edufeed.org'`) |
| `openverse` | Openverse | Not needed |
| `arasaac` | ARASAAC | Not needed |
| `rpi-virtuell` | RPI-Virtuell | Optional (has a default) |

If no `sources` are provided, the plugin defaults to `openverse` and `arasaac`.

**Default source selection:** By default, the first source in the array is selected. To override this, set `selected: true` on the source you want pre-selected. If multiple sources have `selected: true`, the first one wins.

#### Setting Sources (Server-Proxy Mode)

```javascript
const searchElement = document.querySelector('oer-search');
searchElement.sources = [
  { id: 'nostr', label: 'OER Aggregator Nostr Database' },
  { id: 'openverse', label: 'Openverse', selected: true },
  { id: 'arasaac', label: 'ARASAAC' },
];
```

#### Setting Sources (Direct Client Mode)

```javascript
const searchElement = document.querySelector('oer-search');
searchElement.sources = [
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC', selected: true },
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
  { id: 'rpi-virtuell', label: 'RPI-Virtuell' },
];
```

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
pnpm add @edufeed-org/oer-finder-plugin-react
```

This package depends on `@edufeed-org/oer-finder-plugin` internally — you do not need to install the base plugin separately.

For usage details, see the [React guide](./client-packages-react.md).

## Framework-Specific Guides

- [React](./client-packages-react.md)
- [Svelte](./client-packages-svelte.md)
- [Angular](./client-packages-angular.md)

## Example Applications

See the `packages/oer-finder-plugin-example` directory for a complete working example using web components, and `packages/oer-finder-plugin-react-example` for a React example.
