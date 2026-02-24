# Wikimedia Commons Adapter

OER source adapter for searching freely licensed media files on Wikimedia Commons.

## Identity

- **Package:** `@edufeed-org/oer-adapter-wikimedia`
- **Source ID:** `wikimedia`
- **Source Name:** Wikimedia Commons
- **Capabilities:** Images only, no license filter, no educational level filter

## API

Uses the MediaWiki Action API (`https://commons.wikimedia.org/w/api.php`) with `generator=search` to find files in the File namespace (ns=6). All content on Wikimedia Commons is freely licensed.

- Anonymous API limit: max 50 results per request
- Sends `Api-User-Agent` header per Wikimedia policy
- CORS enabled via `origin=*` parameter
- Pagination uses `gsroffset`; total is estimated from the `continue` field

## File Structure

```
src/
  index.ts                              # Public exports
  wikimedia.adapter.ts                  # SourceAdapter implementation (search method)
  wikimedia.adapter.spec.ts             # Adapter unit tests (vitest)
  wikimedia.types.ts                    # Valibot schemas + types for API response
  mappers/
    wikimedia-to-amb.mapper.ts          # Maps Wikimedia pages to AMB ExternalOerItem
    wikimedia-to-amb.mapper.spec.ts     # Mapper unit tests (vitest)
```

## Key Types

- `WikimediaSearchResponse` — Full API response (validated via Valibot)
- `WikimediaPage` — Single file page with optional `imageinfo`
- `WikimediaImageInfo` — Image URL, dimensions, MIME, extmetadata
- `WikimediaExtmetadata` — License, artist, description, date, categories

## Mapper Details

`mapWikimediaPageToAmb` converts a `WikimediaPage` to `ExternalOerItem` with AMB metadata:

- Strips `File:` prefix and extension from titles via `cleanTitle`
- Strips HTML tags and decodes entities from extmetadata fields via `stripHtmlTags`
- Parses pipe-separated categories into keyword arrays via `parseCategories`
- Normalizes license URLs to include trailing slash via `normalizeLicenseUrl`
- Builds three image sizes (high/medium/small) via `buildImageUrls`
- Sets `isAccessibleForFree: true` for all items
- Publisher is always `Wikimedia Commons`

## Registration

Add `wikimedia` to the `ENABLED_ADAPTERS` env variable. The adapter requires no additional configuration (no API key, no custom URL).

Factory case in `src/adapter/services/adapter-loader.service.ts`:
```typescript
case 'wikimedia': {
  const adapter = createWikimediaAdapter();
  this.adapterRegistry.registerAdapter(adapter);
  break;
}
```

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-adapter-wikimedia build    # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-adapter-wikimedia test     # Vitest unit tests
pnpm --filter @edufeed-org/oer-adapter-wikimedia type-check
```

## Tech

- **Validation:** Valibot with `looseObject` schemas (tolerant of extra API fields)
- **Build:** Vite (ESM + CJS dual output)
- **Types:** TypeScript strict mode, `declarationMap` enabled
- **Test:** Vitest with `vi.stubGlobal('fetch', ...)` for mocking
- **Dependency:** `@edufeed-org/oer-adapter-core` (workspace)
