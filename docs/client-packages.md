# Client Packages

The OER Aggregator provides two packages for integrating OER resources into your applications:

1. **API Client** - Type-safe TypeScript client for direct API access
2. **Web Components Plugin** - Ready-to-use web components built with Lit

## API Client Package

The `@edufeed-org/oer-finder-api-client` package provides a type-safe TypeScript client for interacting with the OER Aggregator API. It's automatically generated from the OpenAPI specification, ensuring type safety and up-to-date API compatibility.

### Installation

```bash
npm install github:edufeed-org/oer-finder-plugin#packages/oer-finder-api-client
# or
yarn add github:edufeed-org/oer-finder-plugin#packages/oer-finder-api-client
# or
pnpm add github:edufeed-org/oer-finder-plugin#packages/oer-finder-api-client
```

OR

```bash
Add a .npmrc file to your project with this content:

@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

Then:

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
  console.log(resource.url);
  console.log(resource.source);       // e.g., "nostr", "arasaac"
  console.log(resource.name);         // Resource name/title
  console.log(resource.attribution);  // Attribution text
  console.log(resource.creators);     // Array of creators
}
```

### Response Fields

Each OER item in the API response includes:

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Origin identifier (e.g., "nostr", "arasaac") |
| `name` | string \| null | Resource name/title |
| `attribution` | string \| null | Attribution/copyright notice |
| `creators` | Creator[] | List of creators (persons or organizations) |
| `images` | ImageUrls \| null | URLs for high/medium/small resolutions |

**Creator object:**
```typescript
interface Creator {
  type: string;       // e.g., "person", "organization"
  name: string;       // Creator's name
  link: string | null; // URL to profile/resource
}
```

## Web Components Plugin

The `@edufeed-org/oer-finder-plugin` package provides web components for integrating OER resources into your application using Lit. The package includes separate components for search, display, and theming.

### Installation

```bash
Add a .npmrc file to your project with this content:

@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN

Then:

pnpm add @edufeed-org/oer-finder-plugin
```

### Available Components

The plugin provides five main components:

- `<oer-theme-provider>` - Theme provider for consistent styling
- `<oer-search>` - Search form with filters
- `<oer-list>` - Grid display of OER resources
- `<oer-card>` - Individual OER resource card
- `<oer-pagination>` - Pagination controls (used internally by `<oer-list>`)

### Basic Usage

#### Import and Register Components

```javascript
import '@edufeed-org/oer-finder-plugin';
```

#### Simple Usage with Default Theme

```html
<oer-theme-provider theme="default">
  <oer-search api-url="http://localhost:3000"></oer-search>
  <oer-list></oer-list>
</oer-theme-provider>

<script type="module">
  const searchElement = document.querySelector('oer-search');
  const listElement = document.querySelector('oer-list');

  // Listen for search results
  searchElement.addEventListener('search-results', (event) => {
    listElement.oers = event.detail.data;
  });

  // Listen for search errors
  searchElement.addEventListener('search-error', (event) => {
    listElement.error = event.detail.error;
  });

  // Listen for search cleared
  searchElement.addEventListener('search-cleared', () => {
    listElement.oers = [];
  });
</script>
```

### Component Properties

#### `<oer-theme-provider>`

Provides theme variables to child components.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | String or Theme | `'default'` | Theme name ('default', 'dark') or custom Theme object |

#### `<oer-search>`

Search form with filters.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `api-url` | String | `'http://localhost:3000'` | Base URL of the OER Aggregator API |
| `page-size` | Number | `20` | Number of results per page |
| `language` | String | `'en'` | UI language ('en', 'de') |
| `locked-type` | String | - | Lock the type filter to a specific value |
| `show-type-filter` | Boolean | `true` | Show/hide type filter |

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
| `showPagination` | Boolean | `false` | Show/hide pagination controls |
| `metadata` | Object | `null` | Pagination metadata from search results |
| `onPageChange` | Function | `null` | Callback function when page changes |

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

Pagination controls (used internally by `<oer-list>` when `showPagination` is enabled).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metadata` | Object | `null` | Pagination metadata (page, totalPages, total) |
| `loading` | Boolean | `false` | Disable buttons during loading |
| `onPageChange` | Function | `null` | Callback function when page changes |
| `language` | String | `'en'` | UI language ('en', 'de') |

### Theme Provider

The theme provider allows you to customize the appearance of all components. It supports both predefined themes and custom themes.

#### Using Predefined Themes

```html
<!-- Default (light) theme -->
<oer-theme-provider theme="default">
  <oer-search api-url="http://localhost:3000"></oer-search>
  <oer-list></oer-list>
</oer-theme-provider>

<!-- Dark theme -->
<oer-theme-provider theme="dark">
  <oer-search api-url="http://localhost:3000"></oer-search>
  <oer-list></oer-list>
</oer-theme-provider>
```

#### Creating a Custom Theme

```html
<oer-theme-provider id="custom-provider">
  <oer-search api-url="http://localhost:3000"></oer-search>
  <oer-list></oer-list>
</oer-theme-provider>

<script type="module">
  import type { Theme } from '@edufeed-org/oer-finder-plugin';

  const customTheme = {
    name: 'custom',
    colors: {
      primary: '#FF6B6B',
      primaryHover: '#EE5A52',
      secondary: '#4ECDC4',
      background: {
        page: '#ffffff',
        card: '#ffffff',
        form: '#fff5f5',
      },
      text: {
        primary: '#2d3748',
        secondary: '#4a5568',
        muted: '#718096',
      },
    },
  };

  const provider = document.getElementById('custom-provider');
  provider.theme = customTheme;
</script>
```

#### Available Theme Colors

The theme system provides the following CSS custom properties:

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

#### Customizing Colors with CSS

You can customize colors without using the theme provider by overriding CSS custom properties:

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

### Complete Working Example

Here's a complete example showing how to integrate the search and list components with event handling, pagination, and card clicks:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OER Finder Example</title>
</head>
<body>
  <oer-theme-provider theme="default">
    <oer-search
      id="search"
      api-url="http://localhost:3000"
      language="en"
      page-size="20">
    </oer-search>
    <oer-list
      id="list"
      language="en">
    </oer-list>
  </oer-theme-provider>

  <script type="module">
    import '@edufeed-org/oer-finder-plugin';

    const searchElement = document.getElementById('search');
    const listElement = document.getElementById('list');

    // Handle search results
    searchElement.addEventListener('search-results', (event) => {
      const { data, meta } = event.detail;
      listElement.oers = data;
      listElement.loading = false;
      listElement.error = null;
      listElement.showPagination = true;
      listElement.metadata = meta;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event) => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = event.detail.error;
      listElement.showPagination = false;
      listElement.metadata = null;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.loading = false;
      listElement.error = null;
      listElement.showPagination = false;
      listElement.metadata = null;
    });

    // Handle card clicks (open resource in new tab)
    listElement.addEventListener('card-click', (event) => {
      const oer = event.detail.oer;
      const url = oer.amb_metadata?.id || oer.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });

    // Handle pagination
    listElement.onPageChange = (page) => {
      searchElement.handlePageChange(page);
    };
  </script>
</body>
</html>
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
<oer-theme-provider theme="default">
  <oer-search
    api-url="http://localhost:3000"
    language="de">
  </oer-search>
  <oer-list language="de"></oer-list>
</oer-theme-provider>
```

## Example Applications

See the `packages/oer-finder-plugin-example` directory for a complete working example of using both packages.
