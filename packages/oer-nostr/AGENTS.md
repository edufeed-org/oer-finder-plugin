# oer-nostr

Server-side NestJS module for ingesting Nostr events into PostgreSQL.

## What This Package Does

- Subscribes to multiple Nostr relays via WebSocket
- Validates Schnorr signatures on Nostr events
- Stores raw events as `OerSource` records (from `oer-entities`)
- Extracts structured `OpenEducationalResource` records from AMB events (kind 30142)
- Links file metadata from kind 1063 events
- Processes deletions from kind 5 events
- Supports incremental sync resume on reconnect via per-relay timestamp tracking

## Key Files

- `src/services/nostr-client.service.ts` — Main NestJS service, connects to relays, handles event lifecycle
- `src/services/oer-storage.service.ts` — Core OER persistence, race-condition-safe saves
- `src/services/oer-extraction.service.ts` — Facade for OER extraction logic
- `src/services/nostr-event-database.service.ts` — Raw event storage as `OerSource` records
- `src/services/event-deletion.service.ts` — Processes kind 5 deletion events
- `src/utils/tag-parser.util.ts` — Parses Nostr colon-separated tag arrays into nested objects
- `src/utils/metadata-extractor.util.ts` — Extracts AMB metadata from Nostr events
- `src/utils/relay-connection.manager.ts` — WebSocket relay lifecycle management
- `src/constants/event-kinds.constants.ts` — `EVENT_FILE_KIND = 1063`, `EVENT_AMB_KIND = 30142`, `EVENT_DELETE_KIND = 5`

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-nostr build        # tsc via tsconfig.build.json (excludes test/)
pnpm --filter @edufeed-org/oer-nostr test          # Jest
pnpm --filter @edufeed-org/oer-nostr test:watch    # Jest watch mode
pnpm --filter @edufeed-org/oer-nostr type-check    # Builds oer-entities first, then tsc --noEmit
pnpm --filter @edufeed-org/oer-nostr lint          # ESLint
pnpm --filter @edufeed-org/oer-nostr format        # Prettier
```

## Tech Stack

- **Build:** Pure tsc (CommonJS only output). `tsconfig.build.json` excludes `test/`
- **Test:** Jest. Tests in separate `test/` directory with fixtures in `test/fixtures/`
- **TypeScript:** CommonJS module, node resolution, `experimentalDecorators`, `emitDecoratorMetadata`, `strictPropertyInitialization: false`
- **Dependencies:** `oer-entities` (workspace), `nostr-tools`
- **Peer deps:** `@nestjs/common`, `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `valibot`

## Conventions

- NestJS services use injection tokens (not class-based injection) for bundling compatibility
- Tests are in a separate `test/` directory (not co-located)
- `type-check` script builds `oer-entities` first (dependency)
- CommonJS output for NestJS compatibility
