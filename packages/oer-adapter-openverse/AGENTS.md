# oer-adapter-openverse

Openverse adapter for OER source integration — searches for openly licensed images and audio from Openverse (aggregates Flickr, Wikimedia Commons, Met Museum, etc.).

## What This Package Does

- Implements `SourceAdapter` from `oer-adapter-core`
- Supports license filtering (maps CC URIs to Openverse codes: `by`, `by-sa`, `cc0`, `pdm`)
- No educational level filtering
- Tries multiple API base URLs (`api.openverse.org/v1`, `api.openverse.engineering/v1`) and path variants with fallback logic for 429/403/5xx errors
- Applies safe defaults: `mature=false`, `filter_dead=true`

## Key Files

- `src/openverse.adapter.ts` — `OpenverseAdapter` class implementing `SourceAdapter`
- `src/openverse.types.ts` — Valibot schemas for API response validation
- `src/mappers/openverse-to-amb.mapper.ts` — Maps Openverse images to `ExternalOerItem` with AMB metadata

## Build

```bash
pnpm --filter @edufeed-org/oer-adapter-openverse build        # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-adapter-openverse type-check    # tsc --noEmit
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations
- **Test:** No tests yet
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode
- **Dependencies:** `oer-adapter-core` (workspace), `valibot`

## Conventions

- Uses Valibot for runtime schema validation of external API responses
- Mapper outputs conform to AMB metadata standard
- Handles CC0, PDM, and standard CC license variants
