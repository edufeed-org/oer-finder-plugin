# oer-adapter-arasaac

ARASAAC adapter for OER source integration — searches the Aragonese Portal of Augmentative and Alternative Communication for AAC pictograms.

## What This Package Does

- Implements `SourceAdapter` from `oer-adapter-core`
- Searches `https://api.arasaac.org/api/pictograms/{locale}/search/{searchText}`
- Always returns images (pictograms). No license or educational level filtering
- Client-side pagination (API returns full list, adapter slices)
- Handles 404 gracefully (no results)
- Language defaults to `en` if not specified

## Key Files

- `src/arasaac.adapter.ts` — `ArasaacAdapter` class implementing `SourceAdapter`
- `src/arasaac.types.ts` — Valibot schemas for API response validation
- `src/mappers/arasaac-to-amb.mapper.ts` — Maps ARASAAC pictograms to `ExternalOerItem` with AMB metadata (CC BY-NC-SA license)

## Build

```bash
pnpm --filter @edufeed-org/oer-adapter-arasaac build        # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-adapter-arasaac type-check    # tsc --noEmit
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations
- **Test:** No tests yet
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode
- **Dependencies:** `oer-adapter-core` (workspace), `valibot`

## Conventions

- Uses Valibot for runtime schema validation of external API responses
- Mapper outputs conform to AMB metadata standard
- Factory function: `createArasaacAdapter()` for convenient instantiation
