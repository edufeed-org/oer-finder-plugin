# oer-finder-api-client

Auto-generated type-safe API client for the OER Proxy backend.

## What This Package Does

- Provides `createOerClient(baseUrl)` which returns an `openapi-fetch` client
- Client can call `GET /api/v1/oer`, `GET /health`, etc. with full TypeScript type inference
- Types are auto-generated from the OpenAPI specification using `openapi-typescript`
- Used by `ApiClient` in `oer-finder-plugin` for server-proxy mode

## Key Files

- `src/index.ts` — Exports `createOerClient()`, `OerClient` type, and convenience type aliases (`OerItem`, `OerMetadata`, `OerListResponse`, `OerQueryParams`)
- `generated/schema.ts` — Auto-generated TypeScript types from `openapi.json` (do not edit manually)
- `openapi.json` — OpenAPI specification (source of truth for type generation)

## Build

```bash
pnpm --filter @edufeed-org/oer-finder-api-client generate        # Regenerate spec + types from running server
pnpm --filter @edufeed-org/oer-finder-api-client generate:types   # Regenerate types from existing openapi.json
pnpm --filter @edufeed-org/oer-finder-api-client build            # Generate types + Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-finder-api-client build:full       # Full rebuild including OpenAPI spec generation
pnpm --filter @edufeed-org/oer-finder-api-client type-check       # tsc --noEmit
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations
- **Code generation:** `openapi-typescript` from `openapi.json`
- **Test:** No tests
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode, DOM lib (for fetch types)
- **Dependencies:** `openapi-fetch`

## Conventions

- `generated/schema.ts` is auto-generated — never edit manually
- To update types, modify `openapi.json` or regenerate from the running server, then run `generate:types`
- The `build` script always regenerates types before building
