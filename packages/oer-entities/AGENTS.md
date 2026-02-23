# oer-entities

Shared TypeORM entities for OER aggregation. Used by the NestJS aggregator server and `oer-nostr` package.

## What This Package Does

- Defines `OpenEducationalResource` entity — the canonical OER record with JSONB metadata, keywords, and a unique constraint on `(url, source_name)`
- Defines `OerSource` entity — stores raw source data from any origin (Nostr relay, external API) with provenance tracking and status (`pending | processed | failed`)
- `OerSource` has a ManyToOne relationship to `OpenEducationalResource`

## Key Files

- `src/open-educational-resource.entity.ts` — `OpenEducationalResource` TypeORM entity (table `open_educational_resources`)
- `src/oer-source.entity.ts` — `OerSource` TypeORM entity (table `oer_sources`)
- `src/index.ts` — Exports both entities and `OerSourceStatus` type

## Build

```bash
pnpm --filter @edufeed-org/oer-entities build        # tsc (CommonJS output)
pnpm --filter @edufeed-org/oer-entities type-check    # tsc --noEmit
pnpm --filter @edufeed-org/oer-entities lint          # ESLint
pnpm --filter @edufeed-org/oer-entities format        # Prettier
```

## Tech Stack

- **Build:** Pure tsc (CommonJS only output)
- **Test:** No tests
- **TypeScript:** CommonJS module, node resolution, `experimentalDecorators`, `emitDecoratorMetadata`, `strictPropertyInitialization: false` (required for TypeORM)
- **Dependencies:** `typeorm` (peer/optional)

## Conventions

- TypeORM decorator-based entities require `experimentalDecorators` and `emitDecoratorMetadata`
- `strictPropertyInitialization` is disabled because TypeORM initializes entity properties via decorators
- CommonJS output (not ESM) for NestJS compatibility
