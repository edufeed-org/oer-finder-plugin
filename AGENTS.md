# OER Finder Aggregator and Plugin

A pnpm workspace monorepo containing a NestJS aggregator server with PostgreSQL database, a set of OER (Open Educational Resources) source adapters, and a framework-agnostic Web Components plugin for searching OER.

## Architecture

The system has two operation modes:

1. **Aggregator mode** — The NestJS server ingests Nostr AMB events into a local PostgreSQL database and serves them via API. External adapters provide additional sources.
2. **Direct-client mode** — The Web Components plugin runs adapters directly in the browser, with no server required.

```
                                              ┌──────────────────┐
┌──────────────────┐     ┌──────────────────┐ │  Nostr Relays    │
│  Web Components  │────▶│ NestJS Aggregator│◀┤  (WebSocket)     │
│  (oer-finder-    │     │  (this root app) │ └──────────────────┘
│   plugin)        │     │       │          │
│                  │     │  ┌────▼─────┐    │──▶ Adapters ──▶ External Sources
│  Direct mode ────┼─────┤  │PostgreSQL│    │       │
└──────────────────┘     │  └──────────┘    │       │
                         └──────────────────┘       │
                                                    │
```

### NestJS Aggregator (root `src/`)

An HTTP API backed by PostgreSQL. The `source` query parameter routes to the internal database (`source=nostr`) or to an external adapter.

- **Endpoint:** `GET /api/v1/oer?source=<id>&searchTerm=<text>` — paginated OER search
- **Endpoint:** `GET /health` — health check
- **Swagger:** Available at `/api-docs`
- **Rate limiting:** `ThrottlerGuard` on the OER endpoint (configurable via env)
- **Image proxying:** `ImgproxyService` generates HMAC-signed imgproxy URLs (three sizes)
- **Validation:** Valibot for both env variables and HTTP query parameters (no class-validator)

### Key Modules

| Module | Purpose |
|--------|---------|
| `src/nostr/` | Nostr ingestion module — wires oer-nostr services for WebSocket relay subscriptions |
| `src/adapter/` | Adapter registry, loader (factory switch), and search orchestration with AbortController timeouts |
| `src/oer/` | OER controller, query DTO (Valibot), query service, asset URL service |
| `src/config/` | Configuration factory (app, database), env schema, env validation |
| `src/migrations/` | TypeORM database migrations |

### Internal Sources

| Source | Package | Description |
|--------|---------|-------------|
| `nostr` (internal DB) | `oer-nostr` + `oer-entities` | Subscribes to Nostr AMB relays, stores events in PostgreSQL, queries locally |

### External Adapters (workspace packages)

| Adapter | Source | Capabilities |
|---------|--------|-------------|
| `oer-adapter-arasaac` | ARASAAC pictograms API | Images only |
| `oer-adapter-openverse` | Openverse (Flickr, Wikimedia, etc.) | Images, license filter |
| `oer-adapter-rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) | All types, license, educational level, German only |
| `oer-adapter-wikimedia` | Wikimedia Commons API | Images |

All adapters implement `SourceAdapter` from `oer-adapter-core` and normalize results to the AMB metadata standard.

### Adding a New Adapter

1. Create a new package under `packages/oer-adapter-<name>/` implementing `SourceAdapter`
2. Add a factory case in `src/adapter/services/adapter-loader.service.ts`
3. Add the adapter ID to `ENABLED_ADAPTERS` env variable

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `development`, `production`, `test` |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `''` | PostgreSQL password |
| `POSTGRES_DATABASE` | `oer-aggregator-dev` | PostgreSQL database name |
| `NOSTR_INGEST_ENABLED` | `false` | Enable Nostr relay ingestion |
| `NOSTR_RELAY_URL` | `''` | Primary Nostr relay WebSocket URL |
| `NOSTR_RELAY_URLS` | `''` | Additional relay URLs (comma-separated) |
| `ENABLED_ADAPTERS` | `''` | Comma-separated adapter IDs |
| `ADAPTER_TIMEOUT_MS` | `3000` | Per-adapter request timeout |
| `RPI_VIRTUELL_API_URL` | `''` | Optional override for RPI-Virtuell |
| `IMGPROXY_BASE_URL` | `''` | Enables imgproxy when set |
| `IMGPROXY_KEY` | `''` | Hex key for signed URLs |
| `IMGPROXY_SALT` | `''` | Hex salt for signed URLs |
| `ASSET_SIGNING_KEY` | `''` | HMAC key for signed asset URLs (min 32 chars) |
| `ASSET_SIGNING_TTL_SECONDS` | `3600` | Signed URL lifetime in seconds (0 = non-expiring) |
| `ASSET_PROXY_TIMEOUT_MS` | `15000` | Per-asset proxy fetch timeout in ms (range 1000-30000) |
| `ASSET_PROXY_ALLOWED_DOMAINS` | `''` | Comma-separated domain allowlist for asset proxy (empty = allow all). Subdomains are matched automatically |
| `PUBLIC_BASE_URL` | `''` | Base URL for signed asset URLs (falls back to localhost) |
| `CORS_ALLOWED_ORIGINS` | `''` | Comma-separated allowed origins (empty = allow all). Supports wildcards e.g. `*.example.com` |
| `TRUST_PROXY` | `0` | Number of trusted reverse proxy hops (0 = disabled, max 10) |
| `THROTTLE_TTL` | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | `30` | Requests per window |
| `THROTTLE_BLOCK_DURATION` | `60000` | Block duration (ms) after exceeding limit |

## Build & Test

```bash
pnpm run build              # Build all adapter packages + NestJS app
pnpm run test               # Build packages + run Jest unit tests
pnpm run test:e2e           # Build packages + run e2e tests (sequential)
pnpm run test:cov           # Build packages + run tests with coverage
pnpm run lint               # ESLint
pnpm run format             # Prettier
pnpm run type-check         # Build packages + tsc --noEmit
pnpm run start:dev          # Build packages + nest start --watch
pnpm run generate:openapi   # Regenerate OpenAPI spec for api-client package
```

## Docker

```bash
docker compose up           # Starts aggregator, PostgreSQL, AMB relay, Typesense, imgproxy
```

Services: `app` (aggregator on :3000), `postgres` (:5432), `amb-relay` (:3334), `typesense` (:8108), `imgproxy` (:8080).

## Tech Stack

- **Runtime:** NestJS on Node 24
- **Database:** PostgreSQL via TypeORM
- **Validation:** Valibot (env + query params)
- **TypeScript:** ES2023 target, nodenext modules, strict null checks, no implicit any, experimental decorators
- **Test:** Jest with ts-jest, tests co-located in `src/` (`__tests__/` or `.spec.ts`)
- **Build:** Nest CLI (`nest build`), adapters via Vite
- **Monorepo:** pnpm workspaces — entities, nostr, and adapter packages must be built before the aggregator

## Instructions

After every change do the following:

- Run all the tests
- Run lints
- Run formatter
- Run typescript check
- Run test build

Use Typescript best practices:

- Clear types
- Strict mode, never use the any type
