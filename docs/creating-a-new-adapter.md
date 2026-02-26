# Creating a New Adapter

Adapters are self-contained packages that translate an external API into the shared AMB metadata format. The proxy calls your adapter's `search()` method and you return normalized results.

```
User request  -->  Proxy  -->  Your Adapter  -->  External API
                      <--  AMB-normalized results  <--
```

## Quick Start

Copy the ARASAAC adapter (`packages/oer-adapter-arasaac/`), rename it, and replace the internals. It's the simplest adapter and a solid template.

## Step by Step

### 1. Scaffold Your Package

Create `packages/oer-adapter-<name>/` with this structure:

```
packages/oer-adapter-<name>/
  src/
    <name>.adapter.ts          # SourceAdapter implementation
    <name>.types.ts            # Valibot schemas for external API responses
    mappers/
      <name>-to-amb.mapper.ts  # Maps external data to ExternalOerItem
    index.ts                   # Public exports
  package.json
  tsconfig.json
  vite.config.ts
```

Copy `package.json`, `tsconfig.json`, and `vite.config.ts` from the ARASAAC adapter and update the package name to `@edufeed-org/oer-adapter-<name>`. If your adapter has runtime dependencies beyond `valibot` and `oer-adapter-core`, add them to `rollupOptions.external` in `vite.config.ts`.

Then run `pnpm install`.

### 2. Implement the Adapter

Your adapter class implements `SourceAdapter` from `oer-adapter-core`:

```typescript
import type {
  SourceAdapter,
  AdapterSearchQuery,
  AdapterSearchOptions,
  AdapterSearchResult,
  AdapterCapabilities,
} from '@edufeed-org/oer-adapter-core';
import { isEmptySearch, EMPTY_RESULT } from '@edufeed-org/oer-adapter-core';

export class MySourceAdapter implements SourceAdapter {
  readonly sourceId = '<name>';
  readonly sourceName = '<Display Name>';

  readonly capabilities: AdapterCapabilities = {
    supportedTypes: ['image'],
    supportsLicenseFilter: false,
    supportsEducationalLevelFilter: false,
  };

  async search(
    query: AdapterSearchQuery,
    options?: AdapterSearchOptions,
  ): Promise<AdapterSearchResult> {
    if (isEmptySearch(query)) return EMPTY_RESULT;

    const url = `https://api.example.com/search?q=${encodeURIComponent(query.keywords!.trim())}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: options?.signal, // Always pass through for timeout support
    });

    if (!response.ok) {
      if (response.status === 404) return EMPTY_RESULT;
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const rawData: unknown = await response.json();
    const parsed = parseMyApiResponse(rawData);
    const items = parsed.map((item) => mapToAmb(item));

    return { items, total: parsed.length };
  }
}

export function createMySourceAdapter(): MySourceAdapter {
  return new MySourceAdapter();
}
```

**Key rules:**
- Always pass `options?.signal` to `fetch` — the proxy uses this for timeouts
- Use `isEmptySearch()` and `EMPTY_RESULT` from core
- Throw on unexpected API failures — the proxy catches them

If your adapter needs configuration (URL, API key), accept it via the constructor and the factory function.

### 3. Validate External Responses

Use Valibot with `v.looseObject()` (not `v.object()`) so unknown fields from the external API don't cause runtime failures:

```typescript
import * as v from 'valibot';

export const MyItemSchema = v.looseObject({
  id: v.union([v.string(), v.number()]),
  title: v.string(),
  imageUrl: v.optional(v.string()),
});

export type MyItem = v.InferOutput<typeof MyItemSchema>;

export function parseMyApiResponse(data: unknown): MyItem[] {
  return v.parse(v.array(MyItemSchema), data);
}
```

### 4. Map to AMB Metadata

Every result must be an `ExternalOerItem` with `id`, `amb` (AMB metadata), and `extensions` (image URLs, landing page, attribution):

```typescript
import type { ExternalOerItem, AmbMetadata } from '@edufeed-org/oer-adapter-core';
import { AMB_CONTEXT_URL, buildExternalOerId } from '@edufeed-org/oer-adapter-core';

export function mapToAmb(item: MyItem): ExternalOerItem {
  const amb: AmbMetadata = {
    '@context': AMB_CONTEXT_URL,
    id: `https://example.com/resource/${item.id}`,
    type: ['LearningResource', 'ImageObject'],
    name: item.title,
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

### 5. Register the Adapter

> **This is the most critical step.** Missing any registration point will cause build failures in CI or silent omissions in production. Work through every item.

#### Proxy (NestJS backend)

**a)** Add workspace dependency in root `package.json`:
```json
"@edufeed-org/oer-adapter-<name>": "workspace:*"
```

**b)** Add factory case in `src/adapter/services/adapter-loader.service.ts`:
```typescript
case '<name>': {
  const adapter = createMySourceAdapter();
  this.adapterRegistry.registerAdapter(adapter);
  break;
}
```

For adapters with config, read values from `ConfigService` and add the env variable in `src/config/configuration.ts`.

**c)** Add adapter ID to `.env.example` available adapters comment.

#### Plugin (direct-client mode)

**d)** Add as dev dependency in `packages/oer-finder-plugin/package.json`:
```json
"@edufeed-org/oer-adapter-<name>": "workspace:*"
```

**e)** Create a per-adapter entry file at `packages/oer-finder-plugin/src/adapter/<name>.ts`:
```typescript
import { registerAdapter } from '../adapters/adapter-registry.js';
import { createMySourceAdapter } from '@edufeed-org/oer-adapter-<name>';

export function register<Name>Adapter(): void {
  registerAdapter('<name>', () => createMySourceAdapter());
}
```

**f)** Import and call the new function in `packages/oer-finder-plugin/src/built-in-registrations.ts`:
```typescript
import { register<Name>Adapter } from './adapter/<name>.js';
// ... inside registerAllBuiltInAdapters():
register<Name>Adapter();
```

**g)** Add the entry point to `packages/oer-finder-plugin/vite.config.ts` (in `build.lib.entry`):
```typescript
'adapter/<name>': resolve(__dirname, 'src/adapter/<name>.ts'),
```

**h)** Add the sub-path export to `packages/oer-finder-plugin/package.json` (in `exports`):
```json
"./adapter/<name>": {
  "types": "./dist/adapter/<name>.d.ts",
  "import": "./dist/adapter/<name>.js"
}
```

**i)** Add to source configs in `packages/oer-finder-plugin-example/src/main.ts`.

#### Docker

**j)** Add a COPY line in the `Dockerfile` (in the `production` stage):
```dockerfile
COPY --chown=node:node packages/oer-adapter-<name> $APP_PATH/packages/oer-adapter-<name>/
```

#### CI/CD Workflows (all three required)

**k)** `.github/workflows/ci.yml` — `oer-adapters` job: add a test step:
```yaml
- name: Test adapter <name>
  run: pnpm --filter @edufeed-org/oer-adapter-<name> run test
```

**l)** `.github/workflows/ci.yml` — `oer-finder-plugin` job: add a build step inside "Build dependencies":
```yaml
pnpm --filter @edufeed-org/oer-adapter-<name> run build
```

**m)** `.github/workflows/release.yml` — `publish-npm-packages` job: add a build step inside "Build dependencies":
```yaml
pnpm --filter @edufeed-org/oer-adapter-<name> run build
```

> **Warning:** Forgetting the release workflow step (m) will cause the release build to fail with `[commonjs--resolver] Failed to resolve entry for package`. The plugin bundles all adapters — if yours isn't built before the plugin build runs, Vite cannot resolve it.

### 6. Export Your Public API

```typescript
// src/index.ts
export { MySourceAdapter, createMySourceAdapter } from './<name>.adapter.js';
```

Export types and schemas too if useful to consumers.

### 7. Build and Test

```bash
pnpm --filter @edufeed-org/oer-adapter-<name> build
pnpm run test
pnpm run type-check
pnpm run lint
pnpm run format
```

## Reference

### Capabilities

The `capabilities` object tells the proxy what your adapter supports. The proxy auto-skips adapters whose capabilities don't match the incoming query — you don't need to check this yourself.

```typescript
readonly capabilities: AdapterCapabilities = {
  supportedTypes: ['image', 'video'],       // Subset of ALL_RESOURCE_TYPES
  supportsLicenseFilter: true,              // Can filter by CC license?
  supportsEducationalLevelFilter: false,    // Can filter by educational level?
  supportedLanguages: ['en', 'de'],         // Omit to accept any language
};
```

### Core Utilities

| Export | Use |
|--------|-----|
| `isEmptySearch(query)` | Return early when keywords are blank |
| `EMPTY_RESULT` | Frozen `{ items: [], total: 0 }` |
| `paginateItems(items, page, pageSize)` | Client-side pagination when the API returns everything at once |
| `buildExternalOerId(sourceId, rawId)` | Globally unique item ID |
| `AMB_CONTEXT_URL` | Standard `@context` value for AMB metadata |
| `CC_LICENSE_URIS` | Map of license codes to URIs |
| `ccCodeToLicenseUri(code)` / `ccLicenseUriToCode(uri)` | Convert between license codes and URIs |

## Checklist

**Implementation:**
- [ ] Implements `SourceAdapter` with `sourceId`, `sourceName`, `capabilities`, `search()`
- [ ] Passes `options?.signal` to `fetch`
- [ ] Validates responses with Valibot (`v.looseObject()`)
- [ ] Maps results to `ExternalOerItem` with AMB metadata
- [ ] Uses `buildExternalOerId()` for unique IDs
- [ ] Returns `EMPTY_RESULT` for empty/no-results cases
- [ ] Exports a `create<Name>Adapter` factory function
- [ ] Has unit tests

**Registration (all required):**
- [ ] Workspace dependency in root `package.json`
- [ ] Factory case in `src/adapter/services/adapter-loader.service.ts`
- [ ] Added to `.env.example`
- [ ] Dev dependency in `packages/oer-finder-plugin/package.json`
- [ ] Per-adapter entry file in `packages/oer-finder-plugin/src/adapter/<name>.ts`
- [ ] Imported and called in `packages/oer-finder-plugin/src/built-in-registrations.ts`
- [ ] Entry point in `packages/oer-finder-plugin/vite.config.ts`
- [ ] Sub-path export in `packages/oer-finder-plugin/package.json`
- [ ] Source config in `packages/oer-finder-plugin-example/src/main.ts`
- [ ] COPY line in `Dockerfile`
- [ ] Test step in `.github/workflows/ci.yml` (`oer-adapters` job)
- [ ] Build step in `.github/workflows/ci.yml` (`oer-finder-plugin` job)
- [ ] Build step in `.github/workflows/release.yml` (`publish-npm-packages` job)

**Verification:**
- [ ] `pnpm run build` passes
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run test` passes
- [ ] `pnpm run lint` passes
