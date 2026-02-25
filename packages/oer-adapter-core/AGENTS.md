# oer-adapter-core

Core types and interfaces for OER source adapters. This is the foundational shared library that all adapters depend on.

## What This Package Does

- Defines the `SourceAdapter` interface that every adapter must implement
- Defines AMB (Allgemeines Metadatenprofil fur Bildungsressourcen) metadata types
- Provides `isFilterIncompatible()` guard to prevent adapters from returning unfiltered results when a requested filter is unsupported
- Provides `filterAmbMetadata()` to strip non-AMB-compliant fields
- Exports `ALL_RESOURCE_TYPES` constant

## Key Files

- `src/adapter.interface.ts` — All core interfaces (`SourceAdapter`, `ExternalOerItem`, `AdapterSearchOptions`, `AdapterSearchResult`, `AdapterCapabilities`)
- `src/filter-guard.ts` — `isFilterIncompatible()` function
- `src/amb-metadata.util.ts` — `ALLOWED_AMB_FIELDS` and `filterAmbMetadata()`

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-adapter-core build        # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-adapter-core test          # Vitest
pnpm --filter @edufeed-org/oer-adapter-core type-check    # tsc --noEmit
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations
- **Test:** Vitest, tests co-located in `src/`
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode
- **Dependencies:** None (pure TypeScript, zero runtime deps)

## Conventions

- No DOM types — this is a pure library
- All types are exported from `src/index.ts`
- Tests are co-located next to source files (e.g. `filter-guard.spec.ts`)
