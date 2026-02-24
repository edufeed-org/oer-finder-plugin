# Creating a New Adapter

Want to bring a new OER source into the system? Great — adapters are self-contained packages that translate an external API into the shared AMB metadata format. This guide walks you through every step.

## How Adapters Work

Each adapter is a standalone package in `packages/` that implements one interface: `SourceAdapter`. The proxy server calls your adapter's `search()` method, and you return normalized results. That's it.

```
User request  -->  Proxy  -->  Your Adapter  -->  External API
                      <--  AMB-normalized results  <--
```

Your adapter handles:
- Calling the external API
- Validating the response
- Mapping results to the AMB metadata format
- Declaring what filters it supports (type, license, language, educational level)

The proxy handles everything else — HTTP routing, rate limiting, timeouts, image proxying, and pagination metadata.

## Quick Start

The fastest way to get going: copy the ARASAAC adapter (`packages/oer-adapter-arasaac/`), rename it, and replace the internals. It's the simplest adapter in the project and a solid template.

## Step by Step

### 1. Scaffold Your Package

Create `packages/oer-adapter-<name>/` with these files:

```
packages/oer-adapter-<name>/
  src/
    <name>.adapter.ts       # Your SourceAdapter implementation
    <name>.types.ts          # Valibot schemas for external API responses
    mappers/
      <name>-to-amb.mapper.ts  # Maps external data to ExternalOerItem
    index.ts                 # Public exports
  package.json
  tsconfig.json
  vite.config.ts
```

**package.json** — Use `@edufeed-org/oer-adapter-<name>` as the package name:

```json
{
  "name": "@edufeed-org/oer-adapter-<name>",
  "version": "0.0.1",
  "description": "<Name> adapter for OER source integration",
  "author": "...",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "vite build && tsc --emitDeclarationOnly",
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@edufeed-org/oer-adapter-core": "workspace:*",
    "valibot": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vite": "^6.4.1",
    "vitest": "^2.1.9"
  }
}
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "emitDeclarationOnly": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "lib": ["ES2020"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**vite.config.ts:**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OerAdapter<Name>',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'cjs') {
          return 'index.cjs';
        }
        return 'index.js';
      },
    },
  },
});
```

If your adapter has runtime dependencies beyond `valibot` and `oer-adapter-core` (e.g., a WebSocket library, a GraphQL client), add them to `rollupOptions.external` so Vite doesn't bundle them:

```typescript
build: {
  lib: { /* ... */ },
  rollupOptions: {
    external: ['my-http-client', 'valibot', '@edufeed-org/oer-adapter-core'],
  },
},
```

Then install dependencies:

```bash
pnpm install
```

### 2. Implement the Adapter

This is the core of your work. Your adapter class implements `SourceAdapter` from `oer-adapter-core`.

**src/\<name\>.adapter.ts:**

```typescript
import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import { isEmptySearch, EMPTY_RESULT } from '@edufeed-org/oer-adapter-core';
import { parseMyApiResponse } from './<name>.types.js';
import { mapToAmb } from './mappers/<name>-to-amb.mapper.js';

export class MySourceAdapter implements SourceAdapter {
  // Unique ID — used in API requests as ?source=<this-value>
  readonly sourceId = '<name>';

  // Human-readable name for logging
  readonly sourceName = '<Display Name>';

  // Declare what your source can filter on
  readonly capabilities: AdapterCapabilities = {
    supportedTypes: ['image'],              // Which resource types this source has
    supportsLicenseFilter: false,           // Can you filter by license?
    supportsEducationalLevelFilter: false,  // Can you filter by educational level?
    // supportedLanguages: ['en', 'de'],    // Omit to accept any language
  };

  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) {
      return EMPTY_RESULT;
    }

    const url = `https://api.example.com/search?q=${encodeURIComponent(query.keywords!.trim())}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: options?.signal, // Always pass this through for timeout support
    });

    if (!response.ok) {
      if (response.status === 404) return EMPTY_RESULT;
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const rawData: unknown = await response.json();
    const parsed = parseMyApiResponse(rawData); // Validate with Valibot

    const items = parsed.map((item) => mapToAmb(item));

    return { items, total: parsed.length };
  }
}

export function createMySourceAdapter(): MySourceAdapter {
  return new MySourceAdapter();
}
```

**Key things to remember:**

- Always pass `options?.signal` to `fetch` — the proxy uses this to enforce timeouts via `AbortController`
- Use `isEmptySearch()` to return early when there are no keywords
- Return `EMPTY_RESULT` instead of constructing `{ items: [], total: 0 }` yourself
- Throw errors for unexpected API failures — the proxy catches and logs them gracefully

#### Adapters That Need Configuration

If your source requires a URL, API key, or other config, accept it via the constructor:

```typescript
export interface MyAdapterConfig {
  apiUrl: string;
  apiKey?: string;
}

export class MySourceAdapter implements SourceAdapter {
  private readonly apiUrl: string;

  constructor(config: MyAdapterConfig) {
    this.apiUrl = config.apiUrl;
  }

  // ...
}

export function createMySourceAdapter(config: MyAdapterConfig): MySourceAdapter {
  return new MySourceAdapter(config);
}
```

The config values will be injected when registering the adapter (step 5).

### 3. Validate External Responses

Use Valibot to validate what you receive from the external API. This catches breaking API changes early and prevents malformed data from propagating.

**src/\<name\>.types.ts:**

```typescript
import * as v from 'valibot';

export const MyItemSchema = v.looseObject({
  id: v.union([v.string(), v.number()]),
  title: v.string(),
  imageUrl: v.optional(v.string()),
  license: v.optional(v.string()),
  tags: v.optional(v.array(v.string()), []),
});

export type MyItem = v.InferOutput<typeof MyItemSchema>;

const MyApiResponseSchema = v.array(MyItemSchema);

export function parseMyApiResponse(data: unknown): MyItem[] {
  return v.parse(MyApiResponseSchema, data);
}
```

> **Important:** Use `v.looseObject()` instead of `v.object()` for external API response schemas. Valibot's `v.object()` rejects unknown properties, which means your adapter will break at runtime if the external API adds or returns any fields you didn't declare in the schema. Since you don't control external APIs, `v.looseObject()` is the safe default — it validates the fields you care about and ignores the rest.

### 4. Map to AMB Metadata

Every result must be returned as an `ExternalOerItem` with three parts:

| Field | Purpose |
|-------|---------|
| `id` | Unique across all sources — use `buildExternalOerId(sourceId, rawId)` |
| `amb` | Standard AMB metadata (`AmbMetadata`) |
| `extensions` | Non-AMB extras: image URLs, landing page, attribution (all fields optional) |

**src/mappers/\<name\>-to-amb.mapper.ts:**

```typescript
import type { ExternalOerItem, AmbMetadata } from '@edufeed-org/oer-adapter-core';
import { AMB_CONTEXT_URL, buildExternalOerId } from '@edufeed-org/oer-adapter-core';
import type { MyItem } from '../<name>.types.js';

export function mapToAmb(item: MyItem): ExternalOerItem {
  const amb: AmbMetadata = {
    '@context': AMB_CONTEXT_URL,
    id: `https://example.com/resource/${item.id}`,
    type: ['LearningResource', 'ImageObject'],
    name: item.title,
    keywords: item.tags,
    isAccessibleForFree: true,
  };

  return {
    id: buildExternalOerId('<name>', item.id),
    amb,
    extensions: {
      images: item.imageUrl
        ? { high: item.imageUrl, medium: item.imageUrl, small: item.imageUrl }
        : null,
      foreignLandingUrl: `https://example.com/resource/${item.id}`,
      attribution: null,
    },
  };
}
```

**Tips for the mapper:**

- Set `type` to include `'LearningResource'` plus the specific Schema.org type (`ImageObject`, `VideoObject`, `AudioObject`, `TextDigitalDocument`)
- Provide all three image sizes in `extensions.images` when available — even if you have to reuse the same URL
- Set `foreignLandingUrl` to the page where users can view the resource on the original site
- Include `license` as `{ id: '<uri>' }` when the source provides license information (see `CC_LICENSE_URIS` from core for standard URIs)

### 5. Register the Adapter

Several files across the monorepo need changes to fully integrate your adapter. The proxy, plugin, Docker build, and CI pipeline all need to know about it.

**a) Add the workspace dependency** in the root `package.json`:

```json
{
  "dependencies": {
    "@edufeed-org/oer-adapter-<name>": "workspace:*"
  }
}
```

**b) Add a factory case** in `src/adapter/services/adapter-loader.service.ts`:

```typescript
import { createMySourceAdapter } from '@edufeed-org/oer-adapter-<name>';

// Inside the loadAdapter switch statement:
case '<name>': {
  const adapter = createMySourceAdapter();
  this.adapterRegistry.registerAdapter(adapter);
  break;
}
```

If your adapter needs configuration, read it from `ConfigService`. The config path must use camelCase (e.g., `app.adapters.mySource.url`), matching the key you add in `configuration.ts`:

```typescript
case '<name>': {
  const apiUrl = this.configService.get<string>('app.adapters.mySource.url');
  if (!apiUrl) {
    this.logger.warn('<Name> adapter enabled but API URL is not set');
    break;
  }
  const adapter = createMySourceAdapter({ apiUrl });
  this.adapterRegistry.registerAdapter(adapter);
  break;
}
```

For adapters with config, also add the env variable to `src/config/configuration.ts`:

```typescript
// Inside the adapters object in src/config/configuration.ts:
mySource: {
  url: process.env.MY_SOURCE_API_URL || '',
},
```

You can optionally add Valibot validation for the env variable in `src/config/env.schema.ts` as well.

**c) Update `.env.example`** — add your adapter ID to the available adapters comment so other developers know it exists:

```env
# Available adapters: arasaac, openverse, nostr-amb-relay, rpi-virtuell, <name>
```

**d) Enable via environment variable** — add your adapter ID to `ENABLED_ADAPTERS`:

```env
ENABLED_ADAPTERS=arasaac,openverse,<name>
```

#### Register in the Plugin (for direct-client mode)

If your adapter should also work in the browser without a proxy server, register it in the `oer-finder-plugin` package:

**e) Add as a dev dependency** in `packages/oer-finder-plugin/package.json`:

```json
{
  "devDependencies": {
    "@edufeed-org/oer-adapter-<name>": "workspace:*"
  }
}
```

**f) Add a factory case** in `packages/oer-finder-plugin/src/adapters/adapter-manager.ts`:

```typescript
import { createMySourceAdapter } from '@edufeed-org/oer-adapter-<name>';

// Inside the fromSourceConfigs switch statement:
case '<name>': {
  const adapter = createMySourceAdapter();
  adapters.set(adapter.sourceId, adapter);
  break;
}
```

If your adapter needs configuration (e.g., a WebSocket URL), use `config.baseUrl`:

```typescript
case '<name>': {
  if (config.baseUrl) {
    const adapter = createMySourceAdapter({ apiUrl: config.baseUrl });
    adapters.set(adapter.sourceId, adapter);
  }
  break;
}
```

**g) Add to the example app** in `packages/oer-finder-plugin-example/src/main.ts` — add your source to both the `serverSources` and `directSources` arrays:

```typescript
{ id: '<name>', label: '<Display Name>' },
```

#### Update Docker and CI

**h) Add a COPY line** in the `Dockerfile` (in the `production` stage, alongside the other adapters):

```dockerfile
COPY --chown=node:node packages/oer-adapter-<name> $APP_PATH/packages/oer-adapter-<name>/
```

**i) Update `.github/workflows/ci.yml`** — two changes:

In the `oer-adapters` job, add a test step:

```yaml
- name: Test adapter <name>
  run: pnpm --filter @edufeed-org/oer-adapter-<name> run test
```

In the `oer-finder-plugin` job, add a build step inside "Build dependencies":

```yaml
pnpm --filter @edufeed-org/oer-adapter-<name> run build
```

### 6. Export Your Public API

**src/index.ts:**

```typescript
export { MySourceAdapter, createMySourceAdapter } from './<name>.adapter.js';
```

Export your types and schemas too if they could be useful to consumers.

### 7. Build and Test

```bash
# Build your adapter
pnpm --filter @edufeed-org/oer-adapter-<name> build

# Build everything and run the full test suite
pnpm run test

# Verify types
pnpm run type-check

# Lint and format
pnpm run lint
pnpm run format
```

## Capabilities Reference

The `capabilities` object tells the proxy what your adapter can handle. The proxy automatically calls `isFilterIncompatible()` (from `oer-adapter-core`) to check your declared capabilities against each incoming query. If the query requests a filter your adapter doesn't support, the proxy skips it entirely — rather than returning misleading unfiltered results. You don't need to check capabilities yourself.

```typescript
readonly capabilities: AdapterCapabilities = {
  // Which resource types does this source contain?
  // Use a subset of ALL_RESOURCE_TYPES: 'image' | 'video' | 'audio' | 'text' | 'application/pdf'
  // Set to undefined if the source doesn't support type filtering at all
  supportedTypes: ['image', 'video'],

  // Can the external API filter by Creative Commons license?
  supportsLicenseFilter: true,

  // Can the external API filter by educational level?
  supportsEducationalLevelFilter: false,

  // Which language codes does this source serve?
  // Omit entirely to accept any language (pass-through)
  // Set to a specific list to reject unsupported languages early
  supportedLanguages: ['en', 'de', 'es'],
};
```

## Utilities From Core

`@edufeed-org/oer-adapter-core` provides helpers so you don't have to reinvent them:

| Export | Use |
|--------|-----|
| `isEmptySearch(query)` | Check if keywords are blank — return early |
| `EMPTY_RESULT` | Frozen `{ items: [], total: 0 }` — use instead of creating your own |
| `paginateItems(items, page, pageSize)` | Client-side pagination when the API returns everything at once |
| `buildExternalOerId(sourceId, rawId)` | Build a globally unique item ID |
| `AMB_CONTEXT_URL` | The standard `@context` value for AMB metadata |
| `CC_LICENSE_URIS` | Map of license codes to URIs (`'by'` -> `'https://creativecommons.org/licenses/by/4.0/'`) |
| `ccCodeToLicenseUri(code)` | Convert a short license code to its full URI |
| `ccLicenseUriToCode(uri)` | Convert a full license URI back to its short code |
| `isFilterIncompatible(capabilities, query)` | Check if a query's filters are incompatible with adapter capabilities (used by the proxy) |
| `filterAmbMetadata(raw)` | Strip non-AMB fields from a raw metadata object (useful when external source provides AMB-like JSON) |
| `ALL_RESOURCE_TYPES` | The complete list of supported resource type strings |

## Pagination

Some APIs return all results at once and leave pagination to you. Use `paginateItems` for this:

```typescript
const allResults = parseResponse(rawData);
const total = allResults.length;
const pageItems = paginateItems(allResults, query.page, query.pageSize);
const items = pageItems.map(mapToAmb);

return { items, total };
```

If the external API supports server-side pagination, use it directly and pass `query.page` / `query.pageSize` to the API. Just make sure `total` reflects the full count, not just the current page.

## Checklist

Before submitting your adapter:

**Implementation:**
- [ ] Implements `SourceAdapter` with `sourceId`, `sourceName`, `capabilities`, and `search()`
- [ ] Passes `options?.signal` to `fetch` for timeout support
- [ ] Validates external API responses with Valibot (using `v.looseObject()`)
- [ ] Maps results to `ExternalOerItem` with proper AMB metadata
- [ ] Uses `buildExternalOerId()` for unique IDs
- [ ] Returns `EMPTY_RESULT` for empty searches and no-results cases
- [ ] Exports a factory function (`create<Name>Adapter`)
- [ ] Has unit tests

**Proxy registration:**
- [ ] Added as workspace dependency in root `package.json`
- [ ] Registered in `src/adapter/services/adapter-loader.service.ts`
- [ ] Added to `.env.example` available adapters comment

**Plugin registration (for direct-client mode):**
- [ ] Added as dev dependency in `packages/oer-finder-plugin/package.json`
- [ ] Registered in `packages/oer-finder-plugin/src/adapters/adapter-manager.ts`
- [ ] Added to source configs in `packages/oer-finder-plugin-example/src/main.ts`

**Infrastructure:**
- [ ] Added COPY line in `Dockerfile`
- [ ] Added test step in `.github/workflows/ci.yml` (`oer-adapters` job)
- [ ] Added build step in `.github/workflows/ci.yml` (`oer-finder-plugin` job)

**Verification:**
- [ ] Builds cleanly (`pnpm run build`)
- [ ] Passes type checking (`pnpm run type-check`)
- [ ] All tests pass (`pnpm run test`)
- [ ] Lint passes (`pnpm run lint`)
