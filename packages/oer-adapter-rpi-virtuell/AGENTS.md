# oer-adapter-rpi-virtuell

RPI-Virtuell Materialpool adapter for OER source integration — searches a German platform for religious education materials via GraphQL.

## What This Package Does

- Implements `SourceAdapter` from `oer-adapter-core`
- Only serves German content (`supportedLanguages: ['de']`)
- Supports all resource types, license filtering, and educational level filtering via taxonomy slugs
- Builds dynamic GraphQL queries with taxonomy filters (MEDIENTYP, BILDUNGSSTUFE, LIZENZEN)
- Maps type/license/educationalLevel URIs to RPI taxonomy slugs via lookup tables
- Total count estimated heuristically (10x page size if full page returned)

## Key Files

- `src/rpi-virtuell.adapter.ts` — `RpiVirtuellAdapter` class implementing `SourceAdapter`, GraphQL query building, slug mapping tables
- `src/rpi-virtuell.types.ts` — Valibot schemas for the nested GraphQL response
- `src/mappers/rpi-virtuell-to-amb.mapper.ts` — Maps RpiMaterialPost to `ExternalOerItem`

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-adapter-rpi-virtuell build        # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-adapter-rpi-virtuell test          # Vitest
pnpm --filter @edufeed-org/oer-adapter-rpi-virtuell type-check    # tsc --noEmit
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations
- **Test:** Vitest, tests co-located in `src/` (`.spec.ts`)
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode
- **Dependencies:** `oer-adapter-core` (workspace), `valibot`

## Conventions

- Uses Valibot for runtime schema validation of external API responses
- Mapper outputs conform to AMB metadata standard
- Configurable `apiUrl` passed via constructor config
- Search text is passed as a safe GraphQL variable (no injection risk)
