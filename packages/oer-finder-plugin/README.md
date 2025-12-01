# OER Finder Plugin - Developer Guide

This package provides Web Components for the OER Aggregator, built with Lit and TypeScript.

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
│   ├── pagination/        # Pagination component
│   ├── constants.ts       # Shared constants
│   ├── translations.ts    # Internationalization (i18n) utilities
│   └── index.ts           # Main entry point
├── dist/                  # Build output (generated)
├── package.json
├── tsconfig.json
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

The package exports both ES modules and UMD bundles:

- **ES Module** (`dist/oer-plugin.js`): For modern bundlers and browsers
- **UMD** (`dist/oer-plugin.umd.cjs`): For CommonJS/require environments
- **Type Definitions** (`dist/index.d.ts`): TypeScript types

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
- **@edufeed-org/api-client** (workspace): API client for OER data

### Dev Dependencies

- **Vite** (`^6.0.11`): Build tool and bundler
- **TypeScript** (`^5.7.3`): Type checking and declarations
- **rollup-plugin-license** (`^3.6.0`): License bundling

## Package Exports

The package provides multiple exports:

```typescript
// Web Components
export { OerCardElement } from './oer-card/OerCard.js';
export { OerListElement } from './oer-list/OerList.js';
export { OerSearchElement } from './oer-search/OerSearch.js';
export { PaginationElement } from './pagination/Pagination.js';

// Translations
export { getTranslations, SupportedLanguage } from './translations.js';

// API Client types (re-exported)
export type { OerItem, OerMetadata, OerListResponse } from '@oer-aggregator/api-client';
```

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
| `--background-form` | Form/input background color | `#f8f9fa` |
| `--text-primary` | Main text color | `#2d3748` |
| `--text-secondary` | Secondary text color | `#4a5568` |
| `--text-muted` | Muted/disabled text color | `#718096` |

### Dark Theme Example

```css
oer-search,
oer-list,
oer-list oer-card {
  --primary-color: #7c3aed;
  --primary-hover-color: #6d28d9;
  --secondary-color: #8b5cf6;
  --background-card: #2d3748;
  --background-form: #374151;
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
  --text-muted: #a0aec0;
}
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
- `Pagination.test.ts` - Tests the pagination component rendering

Snapshots are stored in `__snapshots__` directories next to each test file.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build the package (Vite + TypeScript declarations) |
| `pnpm type-check` | Run TypeScript type checking without emitting files |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with UI |
| `pnpm prepare` | Automatically runs build (called by pnpm install) |
| `pnpm lint` | *Not configured yet* |
| `pnpm format` | *Not configured yet* |

## Publishing

The package is configured to publish only the `dist/` folder:

```json
{
  "files": ["dist"],
  "main": "./dist/oer-plugin.umd.cjs",
  "module": "./dist/oer-plugin.js",
  "types": "./dist/index.d.ts"
}
```

## Key Features

- **Framework-agnostic**: Pure Web Components work in any framework
- **TypeScript**: Full type safety with comprehensive type definitions
- **Tree-shakeable**: ES module format supports tree-shaking
- **Themeable**: Custom theme support via CSS custom properties
- **i18n**: Built-in support for multiple languages (DE, EN)
- **Bundled**: All dependencies bundled for easy distribution

## Architecture Notes

### Web Components

All components are built with Lit and use:
- Shadow DOM for style encapsulation
- Custom events for component communication

### Event System

Components communicate via custom events:
- `search-results`: Emitted when search completes successfully (from `<oer-search>`)
- `search-error`: Emitted when search fails (from `<oer-search>`)
- `search-cleared`: Emitted when search is cleared (from `<oer-search>`)
- `card-click`: Emitted when a card is clicked (from `<oer-card>`, bubbles to `<oer-list>`)

## Related Packages

- **@edufeed-org/api-client**: API client (dependency)
- **@edufeed-org/oer-finder-plugin-example**: Example usage (dev reference)
