# OER Finder Plugin - Developer Guide

Framework-agnostic Web Components for searching Open Educational Resources (OER), built with Lit and TypeScript. Supports server-proxy and direct-adapter modes.

## Prerequisites

- Node.js (version compatible with pnpm workspaces)
- pnpm (this is a monorepo workspace package)

## Development Setup

This package is part of a pnpm workspace. From the monorepo root:

```bash
# Install all dependencies
pnpm install

# Navigate to this package
cd packages/oer-finder-plugin
```

## Package Structure

```
packages/oer-finder-plugin/
├── src/
│   ├── oer-card/          # Card component for individual OER items
│   ├── oer-list/          # List component for displaying OER results
│   ├── oer-search/        # Search component with form
│   ├── load-more/         # Load more button component
│   ├── clients/           # Client factory, API client, direct client
│   ├── adapters/          # Adapter manager and registry for direct mode
│   ├── adapter/           # Per-adapter entry files (registerOpenverseAdapter, etc.)
│   ├── types/             # Shared type definitions (SourceConfig, adapter-core types)
│   ├── built-in-registrations.ts  # registerAllBuiltInAdapters() convenience function
│   ├── constants.ts       # Shared constants (licenses, resource types, languages)
│   ├── translations.ts    # Internationalization (i18n) utilities
│   ├── interleave.ts      # Round-robin interleaving utility
│   ├── utils.ts           # Text truncation utilities
│   └── index.ts           # Main entry point
├── dist/                  # Build output (generated)
├── package.json
├── tsconfig.json
├── tsconfig.build.json    # Excludes spec files from declaration generation
├── vite.config.ts
└── README.md
```

## Building the Package

### Build Commands

```bash
# Build the package (runs Vite build + TypeScript declarations)
pnpm build

# Type check without emitting files
pnpm type-check
```

### Build Process

The build process performs two steps:

1. **Vite Build**: Bundles the source code into ES module and UMD formats
   - Output: `dist/oer-plugin.js` (ES module)
   - Output: `dist/oer-plugin.umd.cjs` (UMD/CommonJS)
   - Includes license information from dependencies

2. **TypeScript Declarations**: Generates `.d.ts` type definition files
   - Output: `dist/*.d.ts` files for all public APIs

### Build Outputs

The package exports ES modules with multiple entry points:

- **Main** (`dist/oer-plugin.js`): Web Components (auto-registers custom elements)
- **All adapters** (`dist/built-in-registrations.js`): `registerAllBuiltInAdapters()`
- **Per-adapter** (`dist/adapter/*.js`): Individual adapter registration functions (e.g., `registerOpenverseAdapter`)
- **Type Definitions** (`dist/*.d.ts`): TypeScript types (self-contained, no external type dependencies)

## Development Workflow

### Local Development with Example App

The `oer-finder-plugin-example` package demonstrates how to use the plugin:

```bash
# From monorepo root
cd packages/oer-finder-plugin-example

# Start the dev server (automatically builds plugin first)
pnpm dev
```

The example app will automatically rebuild the plugin when you run `pnpm dev` thanks to the `predev` hook.

### Making Changes

1. Edit source files in `packages/oer-finder-plugin/src/`
2. Rebuild the package: `pnpm build`
3. The changes will be reflected in dependent packages (like the example app)

### Watch Mode

Vite doesn't have a watch mode configured. For rapid development:

```bash
# In one terminal, run the example app
cd packages/oer-finder-plugin-example
pnpm dev

# In another terminal, rebuild the plugin when needed
cd packages/oer-finder-plugin
pnpm build
```

## TypeScript Configuration

The package uses strict TypeScript settings:

- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **Decorators**: Experimental decorators enabled (for Lit)
- **No implicit any**: Enforced

## Dependencies

### Runtime Dependencies

- **Lit** (`^3.3.1`): Web Components framework
- **@edufeed-org/oer-finder-api-client** (workspace): API client for OER data

### Dev Dependencies (bundled by Vite)

- **@edufeed-org/oer-adapter-core** (workspace): Adapter types and filter guard
- **@edufeed-org/oer-adapter-\*** (workspace): Built-in adapter implementations
- **Vite** (`^6.0.11`): Build tool and bundler
- **TypeScript** (`^5.7.3`): Type checking and declarations
- **rollup-plugin-license** (`^3.6.0`): License bundling

## Usage in Other Projects

### As a Workspace Dependency

In another package within the monorepo:

```json
{
  "dependencies": {
    "@edufeed-org/oer-finder-plugin": "workspace:*"
  }
}
```

### In HTML/JavaScript

```html
<script type="module" src="node_modules/@edufeed-org/oer-finder-plugin/dist/oer-plugin.js"></script>

<oer-search api-url="http://localhost:3000"></oer-search>
<oer-list></oer-list>
```

### In TypeScript/JavaScript Modules

```typescript
import '@edufeed-org/oer-finder-plugin';
import type { OerSearchElement, OerItem } from '@edufeed-org/oer-finder-plugin';

// Components are automatically registered as custom elements
const searchEl = document.querySelector('oer-search') as OerSearchElement;
```

## Operation Modes

The plugin operates in one of two modes, determined by the presence of the `api-url` attribute:

### Server-Proxy Mode

Set `api-url` to route searches through the NestJS proxy backend:

```html
<oer-search api-url="https://api.example.com"></oer-search>
```

### Direct-Adapter Mode

Omit `api-url` to run adapters directly in the browser — no server required.

First, register the adapters you want to use:

```typescript
// Register all built-in adapters
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
registerAllBuiltInAdapters();

// Or register only the adapters you need (reduces bundle size)
import { registerOpenverseAdapter } from '@edufeed-org/oer-finder-plugin/adapter/openverse';
import { registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin/adapter/arasaac';
registerOpenverseAdapter();
registerArasaacAdapter();
```

Then use the component without `api-url`:

```html
<oer-search></oer-search>
```

Defaults to `openverse` and `arasaac` when no `sources` are configured.

## Component Reference

### `<oer-search>`

The main entry point. Renders a search form with filters and orchestrates multi-source search with round-robin result interleaving.

#### Properties / Attributes

| Property | HTML Attribute | Type | Default | Description |
|----------|---------------|------|---------|-------------|
| `apiUrl` | `api-url` | `string \| undefined` | `undefined` | Proxy backend URL. Omit to use direct-adapter mode. |
| `sources` | *(JS property only)* | `SourceConfig[]` | openverse + arasaac | Source configuration array. Must be set via JavaScript. See [SourceConfig](#sourceconfig). |
| `language` | `language` | `'en' \| 'de'` | `'en'` | UI language for labels, placeholders, and messages. |
| `pageSize` | `page-size` | `number` | `20` | Items per page per source. |
| `lockedType` | `locked-type` | `string \| undefined` | `undefined` | Restrict searches to a single resource type (e.g., `'image'`). Hides the type filter. |
| `showTypeFilter` | `show-type-filter` | `boolean` | `true` | Show or hide the resource type filter dropdown. |
| `lockedSource` | `locked-source` | `string \| undefined` | `undefined` | Restrict searches to a single source by ID (e.g., `'openverse'`). Hides the source checkboxes. |
| `showSourceFilter` | `show-source-filter` | `boolean` | `true` | Show or hide the source checkbox filter. |

#### Usage Examples

Minimal (direct mode with defaults):

```html
<oer-search></oer-search>
```

Server-proxy mode with custom page size:

```html
<oer-search api-url="https://api.example.com" page-size="10"></oer-search>
```

Locked to images only, German UI:

```html
<oer-search api-url="https://api.example.com" locked-type="image" language="de"></oer-search>
```

Single source, no filters:

```html
<oer-search
  locked-source="openverse"
  show-type-filter="false"
  show-source-filter="false"
></oer-search>
```

Setting sources via JavaScript:

```typescript
const search = document.querySelector('oer-search') as OerSearchElement;
search.sources = [
  { id: 'openverse', label: 'Openverse', checked: true },
  { id: 'arasaac', label: 'ARASAAC' },
  { id: 'nostr-amb-relay', label: 'Nostr Relay', baseUrl: 'wss://relay.example.com' },
];
```

### `<oer-list>`

Renders a responsive grid of `<oer-card>` elements with loading, error, and empty states.

#### Properties / Attributes

| Property | HTML Attribute | Type | Default | Description |
|----------|---------------|------|---------|-------------|
| `oers` | `oers` | `OerItem[]` | `[]` | OER items to display. |
| `loading` | `loading` | `boolean` | `false` | Shows a loading spinner when `true` and `oers` is empty. |
| `error` | `error` | `string \| null` | `null` | Error message. Replaces the list with an error state when set. |
| `language` | `language` | `'en' \| 'de'` | `'en'` | UI language. |

### `<oer-card>`

Displays a single OER item: thumbnail, title, description, license, keywords, and attribution.

#### Properties / Attributes

| Property | HTML Attribute | Type | Default | Description |
|----------|---------------|------|---------|-------------|
| `oer` | `oer` | `OerItem \| null` | `null` | OER item to render. |
| `language` | `language` | `'en' \| 'de'` | `'en'` | UI language. |

### `<oer-load-more>`

Displays a result count ("Showing X of Y") and a "Load more" button when more pages are available.

#### Properties / Attributes

| Property | HTML Attribute | Type | Default | Description |
|----------|---------------|------|---------|-------------|
| `metadata` | `metadata` | `LoadMoreMeta \| null` | `null` | Pagination metadata. See [LoadMoreMeta](#loadmoremeta). |
| `loading` | `loading` | `boolean` | `false` | Disables the button and shows loading text when `true`. |
| `language` | `language` | `'en' \| 'de'` | `'en'` | UI language. |

## Types

### SourceConfig

Configuration for a single OER source. Used with the `sources` property on `<oer-search>`.

```typescript
interface SourceConfig {
  /** Unique source identifier (e.g., 'openverse', 'nostr-amb-relay') */
  readonly id: string;
  /** Human-readable label for the UI checkbox */
  readonly label: string;
  /** Adapter base URL (e.g., WebSocket URL for nostr-amb-relay). Required by some adapters in direct mode. */
  readonly baseUrl?: string;
  /** Pre-select this source in the UI. If any source has checked=true, only checked sources are selected by default; otherwise all are selected. */
  readonly checked?: boolean;
}
```

#### Supported Source IDs

| Source ID | Description | `baseUrl` Required? |
|-----------|-------------|---------------------|
| `openverse` | Openverse (Flickr, Wikimedia, etc.) — images with license filter | No |
| `arasaac` | ARASAAC pictograms API — images only | No |
| `nostr-amb-relay` | Nostr AMB relay (WebSocket, kind 30142) — all types, license, educational level | Yes (WebSocket URL, e.g., `wss://relay.example.com`) |
| `rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) — all types, German content | No |
| `wikimedia` | Wikimedia Commons | No |

### LoadMoreMeta

Pagination state passed to `<oer-load-more>` and included in `search-results` events.

```typescript
interface LoadMoreMeta {
  /** Total number of results across all sources */
  readonly total: number;
  /** Number of results currently shown */
  readonly shown: number;
  /** Whether more results can be loaded */
  readonly hasMore: boolean;
}
```

### SearchParams

Search parameters used internally and exposed for programmatic use.

```typescript
interface SearchParams {
  /** Keywords to search for */
  searchTerm?: string;
  /** Resource type filter (e.g., 'image', 'video', 'audio', 'text', 'application/pdf') */
  type?: string;
  /** License URI filter (e.g., 'https://creativecommons.org/licenses/by/4.0/') */
  license?: string;
  /** Language code filter (e.g., 'en', 'de', 'fr') */
  language?: string;
  /** Educational level filter */
  educational_level?: string;
  /** Items per page */
  pageSize?: number;
  /** Page number (managed internally for load-more) */
  page?: number;
  /** Source ID (set internally per-source during multi-source search) */
  source?: string;
}
```

### ClientConfig

Options for `ClientFactory.create()` to instantiate a search client programmatically.

```typescript
interface ClientConfig {
  /** API URL for server-proxy mode. If not provided, direct-adapter mode is used. */
  apiUrl?: string;
  /** Source configuration. Defaults to openverse + arasaac when not provided. */
  sources?: readonly SourceConfig[];
}
```

## Event System

Components communicate via custom events. All events bubble and are composed, crossing Shadow DOM boundaries.

| Event | Source | Detail Type | Description |
|-------|--------|-------------|-------------|
| `search-results` | `<oer-search>` | `OerSearchResultDetail` | Search or load-more completed. Contains `data` (`OerItem[]`) and `meta` (`LoadMoreMeta`). |
| `search-error` | `<oer-search>` | `{ error: string }` | Search failed. |
| `search-cleared` | `<oer-search>` | *(none)* | Search cleared or source selection changed. |
| `search-loading` | `<oer-search>` | *(none)* | Search or load-more started. |
| `card-click` | `<oer-card>` | `OerCardClickDetail` | Card thumbnail clicked. Contains the `oer` item. Bubbles through `<oer-list>`. |
| `load-more` | `<oer-load-more>` | *(none)* | "Load more" button clicked. Handled internally by `<oer-search>`. |

### Event Detail Types

```typescript
interface OerSearchResultDetail {
  data: OerItem[];
  meta: LoadMoreMeta;
}

interface OerCardClickDetail {
  oer: OerItem;
}

// Convenience type aliases (CustomEvent wrapping the detail)
type OerSearchResultEvent = CustomEvent<OerSearchResultDetail>;
type OerCardClickEvent = CustomEvent<OerCardClickDetail>;
```

### Listening to Events

```typescript
const search = document.querySelector('oer-search');

search.addEventListener('search-results', (e: OerSearchResultEvent) => {
  console.log('Results:', e.detail.data);
  console.log('Meta:', e.detail.meta);
});

search.addEventListener('card-click', (e: OerCardClickEvent) => {
  window.open(e.detail.oer.extensions?.system?.foreignLandingUrl, '_blank');
});
```

## Theming with CSS Custom Properties

Customize the appearance of components using CSS custom properties (CSS variables):

```css
oer-search,
oer-list,
oer-list oer-card {
  /* Primary colors */
  --primary-color: #667eea;
  --primary-hover-color: #5568d3;
  --secondary-color: #764ba2;

  /* Background colors */
  --background-card: #ffffff;
  --background-form: #f8f9fa;
  --background-input: #ffffff;

  /* Text colors */
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --text-muted: #718096;
}
```

### Available CSS Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `--primary-color` | Primary action color (buttons, links) | `#667eea` |
| `--primary-hover-color` | Hover state for primary elements | `#5568d3` |
| `--secondary-color` | Secondary accent color (gradients) | `#764ba2` |
| `--background-card` | Card background color | `#ffffff` |
| `--background-form` | Form container background color | `#f8f9fa` |
| `--background-input` | Input and select element background color | `#ffffff` |
| `--background-muted` | Muted background (e.g., thumbnail placeholder) | `#f5f5f5` |
| `--text-primary` | Main text color | `#2d3748` |
| `--text-secondary` | Secondary text color | `#4a5568` |
| `--text-muted` | Muted/disabled text color | `#718096` |
| `--text-disabled` | Disabled element text color | `rgba(0, 0, 0, 0.3)` |
| `--border-color` | Border color for containers and cards | `rgba(0, 0, 0, 0.1)` |
| `--border-color-subtle` | Subtle border color for separators | `rgba(0, 0, 0, 0.05)` |
| `--input-border-color` | Border color for input/select elements | `rgba(0, 0, 0, 0.15)` |
| `--button-secondary-bg` | Background for secondary buttons | `rgba(0, 0, 0, 0.05)` |
| `--button-secondary-hover-bg` | Hover background for secondary buttons | `rgba(0, 0, 0, 0.1)` |
| `--shadow-color` | Box shadow color for cards | `rgba(0, 0, 0, 0.05)` |
| `--shadow-color-hover` | Hover box shadow color for cards | `rgba(0, 0, 0, 0.15)` |
| `--spinner-track-color` | Loading spinner track color | `#f3f3f3` |
| `--error-color` | Error message text color | `#d32f2f` |

### Dark Theme Example

```css
oer-search,
oer-list,
oer-list oer-card {
  /* Primary colors */
  --primary-color: #7c3aed;
  --primary-hover-color: #6d28d9;
  --secondary-color: #8b5cf6;

  /* Background colors */
  --background-card: #2d3748;
  --background-form: #374151;
  --background-input: #1f2937;
  --background-muted: #4a5568;

  /* Text colors */
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
  --text-muted: #a0aec0;
  --text-disabled: rgba(255, 255, 255, 0.3);

  /* Border colors (use light tints for dark backgrounds) */
  --border-color: rgba(255, 255, 255, 0.1);
  --border-color-subtle: rgba(255, 255, 255, 0.05);
  --input-border-color: rgba(255, 255, 255, 0.15);

  /* Button colors */
  --button-secondary-bg: rgba(255, 255, 255, 0.1);
  --button-secondary-hover-bg: rgba(255, 255, 255, 0.15);

  /* Shadow colors (use darker shadows or light glows) */
  --shadow-color: rgba(0, 0, 0, 0.3);
  --shadow-color-hover: rgba(0, 0, 0, 0.5);

  /* Utility colors */
  --spinner-track-color: #4a5568;
  --error-color: #fc8181;
}
```

## Filter Options

### Resource Types

Values accepted by the type filter and `lockedType`:

| Value | Label |
|-------|-------|
| `image` | Image |
| `video` | Video |
| `audio` | Audio |
| `text` | Text |
| `application/pdf` | PDF |

### Language Filter

Language codes for the content language filter:

| Code | Label |
|------|-------|
| `en` | English |
| `de` | Deutsch |
| `fr` | Fran&ccedil;ais |
| `it` | Italiano |
| `es` | Espa&ntilde;ol |
| `pt` | Portugu&ecirc;s |

### License Filter

Includes 13 Creative Commons licenses (CC0 1.0 through CC BY-NC-ND 3.0/4.0). Values are full URIs, e.g. `https://creativecommons.org/licenses/by/4.0/`.

## Package Exports

The package provides multiple entry points:

### Main entry (`@edufeed-org/oer-finder-plugin`)

```typescript
// Web Components (auto-registered as custom elements on import)
export { OerCardElement, OerListElement, OerSearchElement, LoadMoreElement } from '...';

// Adapter registry (for custom/third-party adapters)
export { AdapterManager, registerAdapter, getAdapterFactory } from './adapters/index.js';
export type { AdapterFactory } from './adapters/index.js';

// Client factory and clients (for programmatic usage)
export { ClientFactory, ApiClient, DirectClient } from './clients/index.js';
export type { SearchClient, SearchResult, ClientConfig } from './clients/index.js';

// Translations, utilities, types, and re-exports from api-client
export { getTranslations, truncateText, createOerClient } from '...';
export type { SourceConfig, OerItem, OerMetadata, OerListResponse } from '...';
```

### Adapter registration (`@edufeed-org/oer-finder-plugin/adapters`)

```typescript
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
registerAllBuiltInAdapters(); // registers all 5 built-in adapters
```

### Per-adapter entry points (`@edufeed-org/oer-finder-plugin/adapter/*`)

```typescript
// Selective registration (reduces bundle size — only pulls in the adapters you import)
import { registerOpenverseAdapter } from '@edufeed-org/oer-finder-plugin/adapter/openverse';
import { registerArasaacAdapter } from '@edufeed-org/oer-finder-plugin/adapter/arasaac';
import { registerNostrAmbRelayAdapter } from '@edufeed-org/oer-finder-plugin/adapter/nostr-amb-relay';
import { registerRpiVirtuellAdapter } from '@edufeed-org/oer-finder-plugin/adapter/rpi-virtuell';
import { registerWikimediaAdapter } from '@edufeed-org/oer-finder-plugin/adapter/wikimedia';
```

## Testing

The package includes snapshot tests for all components using Vitest:

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Test Coverage

Each component has a simple snapshot test:
- `OerCard.test.ts` - Tests the OER card component rendering
- `OerList.test.ts` - Tests the OER list component rendering
- `OerSearch.test.ts` - Tests the search form component rendering
- `LoadMore.test.ts` - Tests the load more button component rendering

Snapshots are stored in `__snapshots__` directories next to each test file.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build the package (Vite + TypeScript declarations) |
| `pnpm type-check` | Run TypeScript type checking without emitting files |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with UI |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier formatting |

## Publishing

The package is configured to publish only the `dist/` folder:

```json
{
  "files": ["dist"],
  "module": "./dist/oer-plugin.js",
  "types": "./dist/index.d.ts"
}
```

Sub-path exports (e.g., `./adapters`, `./adapter/openverse`) are defined in the `exports` field of `package.json`.

## Key Features

- **Framework-agnostic**: Pure Web Components work in any framework
- **TypeScript**: Full type safety with comprehensive type definitions
- **Tree-shakeable**: ES module format supports tree-shaking
- **Themeable**: Custom theme support via CSS custom properties
- **i18n**: Built-in support for multiple languages (DE, EN)
- **Bundled**: All dependencies bundled for easy distribution
- **Dual mode**: Server-proxy or direct-adapter mode with the same API

## Architecture Notes

### Web Components

All components are built with Lit and use:
- Shadow DOM for style encapsulation
- Custom events for component communication

### Multi-Source Search

`<oer-search>` queries all selected sources in parallel via `Promise.allSettled` and interleaves results in round-robin order. Each source tracks its own page state, enabling independent load-more per source.

## Related Packages

- **@edufeed-org/oer-finder-api-client**: API client (dependency)
- **@edufeed-org/oer-finder-plugin-example**: Example usage (dev reference)
