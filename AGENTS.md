# OER Finder Proxy and Plugin

A pnpm workspace monorepo containing a stateless NestJS proxy server and a set of OER (Open Educational Resources) source adapters, plus a framework-agnostic Web Components plugin for searching OER.

## Architecture

The system has two operation modes:

1. **Server-proxy mode** — The NestJS proxy receives HTTP requests, routes each to exactly one source adapter, and returns normalized AMB (Allgemeines Metadatenprofil fur Bildungsressourcen) metadata.
2. **Direct-client mode** — The Web Components plugin runs adapters directly in the browser, with no server required.

```
┌──────────────────┐     ┌──────────────────┐
│  Web Components  │────▶│   NestJS Proxy   │──▶ Adapters ──▶ External Sources
│  (oer-finder-    │     │  (this root app) │       │
│   plugin)        │     └──────────────────┘       │
│                  │                                │
│  Direct mode ────┼────────────────────────────────┘
└──────────────────┘
```

### NestJS Proxy (root `src/`)

A stateless HTTP API with no local database. One source per request — the `source` query parameter routes to exactly one adapter.

- **Endpoint:** `GET /api/v1/oer?source=<id>&searchTerm=<text>` — paginated OER search
- **Endpoint:** `GET /health` — health check
- **Swagger:** Available at `/api-docs`
- **Rate limiting:** `ThrottlerGuard` on the OER endpoint (configurable via env)
- **Image proxying:** `ImgproxyService` generates HMAC-signed imgproxy URLs (three sizes)
- **Validation:** Valibot for both env variables and HTTP query parameters (no class-validator)

### Key Modules

| Module | Purpose |
|--------|---------|
| `src/adapter/` | Adapter registry, loader (factory switch), and search orchestration with AbortController timeouts |
| `src/oer/` | OER controller, query DTO (Valibot), query service, imgproxy service |
| `src/config/` | Configuration factory, env schema, env validation |

### Adapters (workspace packages)

| Adapter | Source | Capabilities |
|---------|--------|-------------|
| `oer-adapter-nostr-amb-relay` | Nostr AMB relay (WebSocket, kind 30142) | All types, license, educational level |
| `oer-adapter-arasaac` | ARASAAC pictograms API | Images only |
| `oer-adapter-openverse` | Openverse (Flickr, Wikimedia, etc.) | Images, license filter |
| `oer-adapter-rpi-virtuell` | RPI-Virtuell Materialpool (GraphQL) | All types, license, educational level, German only |

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
| `ENABLED_ADAPTERS` | `''` | Comma-separated adapter IDs |
| `ADAPTER_TIMEOUT_MS` | `3000` | Per-adapter request timeout |
| `NOSTR_AMB_RELAY_URL` | `''` | WebSocket URL for AMB relay |
| `RPI_VIRTUELL_API_URL` | `''` | Optional override for RPI-Virtuell |
| `IMGPROXY_BASE_URL` | `''` | Enables imgproxy when set |
| `IMGPROXY_KEY` | `''` | Hex key for signed URLs |
| `IMGPROXY_SALT` | `''` | Hex salt for signed URLs |
| `ASSET_SIGNING_KEY` | `''` | HMAC key for signed asset URLs (min 32 chars) |
| `ASSET_SIGNING_TTL_SECONDS` | `3600` | Signed URL lifetime in seconds (0 = non-expiring) |
| `PUBLIC_BASE_URL` | `''` | Base URL for signed asset URLs (falls back to localhost) |
| `THROTTLE_TTL` | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | `30` | Requests per window |

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
docker compose up           # Starts proxy, AMB relay, Typesense, imgproxy
```

Services: `app` (proxy on :3000), `amb-relay` (:3334), `typesense` (:8108), `imgproxy` (:8080).

## Tech Stack

- **Runtime:** NestJS on Node 24
- **Validation:** Valibot (env + query params)
- **TypeScript:** ES2023 target, nodenext modules, strict null checks, no implicit any, experimental decorators
- **Test:** Jest with ts-jest, tests co-located in `src/` (`__tests__/` or `.spec.ts`)
- **Build:** Nest CLI (`nest build`), adapters via Vite
- **Monorepo:** pnpm workspaces — adapters must be built before the proxy

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
