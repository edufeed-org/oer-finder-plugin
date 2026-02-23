# oer-adapter-nostr-amb-relay

Nostr AMB Relay adapter for OER source integration — searches educational metadata via the Nostr protocol on a specialized AMB relay with Typesense full-text search.

## What This Package Does

- Implements `SourceAdapter` from `oer-adapter-core`
- Connects to a WebSocket relay via `nostr-tools/Relay`
- Queries Nostr kind `30142` (AMB) events
- Supports all resource types, license filtering, and educational level filtering
- Appends field-specific query tokens to search string (`inLanguage:de`, `license.id:...`, `type:...`, `educationalLevel.id:...`) which the relay backend parses into Typesense filters
- Configurable timeout (default 10000ms) and AbortSignal support
- Client-side pagination after all events are received

## Key Files

- `src/nostr-amb-relay.adapter.ts` — `NostrAmbRelayAdapter` class implementing `SourceAdapter`
- `src/nostr-amb-relay.types.ts` — Valibot schema for kind 30142 events, `NostrAmbRelayConfig`, constants
- `src/utils/tag-parser.util.ts` — Parses flat Nostr tag arrays into nested JSON using colon-separated key paths
- `src/mappers/nostr-amb-to-external.mapper.ts` — Maps Nostr AMB events to `ExternalOerItem`

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-adapter-nostr-amb-relay build        # Vite build + tsc declarations (uses tsconfig.build.json)
pnpm --filter @edufeed-org/oer-adapter-nostr-amb-relay test          # Jest
pnpm --filter @edufeed-org/oer-adapter-nostr-amb-relay type-check    # tsc --noEmit
pnpm --filter @edufeed-org/oer-adapter-nostr-amb-relay lint          # ESLint
pnpm --filter @edufeed-org/oer-adapter-nostr-amb-relay format        # Prettier
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations. `tsconfig.build.json` excludes `test/`
- **Test:** Jest (not Vitest). Tests in separate `test/` directory
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode
- **Dependencies:** `oer-adapter-core` (workspace), `nostr-tools`, `valibot`

## Conventions

- Uses Valibot for runtime schema validation
- Tests are in a separate `test/` directory (not co-located)
- Requires `baseUrl` (WebSocket relay URL) in config
