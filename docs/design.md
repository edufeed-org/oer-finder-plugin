# Design Principles and Requirements

## Requirements

- **Simple Setup**: Docker-based deployment for both development and production
- **Dual Operation Modes**: Server-proxy mode (NestJS backend) and direct-client mode (browser-only, no server needed)
- **Unified Metadata Format**: All sources normalized to the [AMB standard](https://dini-ag-kim.github.io/amb/latest/) (Allgemeines Metadatenprofil fur Bildungsressourcen)
- **Search Capabilities**: Type, keyword, license, educational level, and language filtering across all sources
- **Configurable Sources**: Pluggable adapter system — enable/disable sources via environment variables (server) or adapter registration (client)
- **Privacy-Aware Asset Proxying**: Implicit assets (thumbnails) proxied server-side to prevent IP leakage and tracking; explicit navigation remains the user's choice
- **Framework-Agnostic Plugin**: Web Components (Lit) usable in any JavaScript framework, with dedicated React wrappers
- **Extensibility**: New OER sources can be added without modifying the core proxy or plugin

## Design Principles

### Simplicity over Complexity

- **Stateless proxy** — no local database, no event storage; all queries are forwarded to source adapters
- **One source per request** — the `source` query parameter selects a single adapter, avoiding complex multi-source orchestration on the server
- **Minimal configuration** — sensible defaults for all settings; only `ENABLED_ADAPTERS` is required to get started
- **Maintainable code over premature optimization** — clear types, small files, co-located tests

### Adapter-Based Architecture

- Adapters implement a common `SourceAdapter` interface from `oer-adapter-core`
- Each adapter is a separate workspace package (`packages/oer-adapter-*`) with its own build, tests, and types
- New sources can be added without modifying the core proxy — see the [Creating a New Adapter](./creating-a-new-adapter.md) guide
- The same adapter code runs server-side (NestJS) and client-side (browser) — no separate implementations needed

### Privacy by Design

- **Implicit/explicit boundary** — thumbnails loaded automatically in search results are proxied; deliberate user actions (opening original resources) go directly to the source
- **Two proxying strategies** — imgproxy (full image proxy with resizing) or HMAC-signed URL redirects (lightweight, no extra service)
- **Domain allowlisting** — `ASSET_PROXY_ALLOWED_DOMAINS` restricts which external domains the proxy may contact, mitigating SSRF risks
- **Private IP blocking** — the asset proxy rejects requests targeting private/internal IP ranges

### Validation at the Boundary

- **Environment variables** — validated at startup with Valibot schemas; invalid config fails fast
- **HTTP query parameters** — validated with Valibot DTOs before reaching any adapter
- **External API responses** — validated with Valibot (`v.looseObject()` to tolerate unknown fields) inside each adapter

### Web Components as Integration Layer

- Built with [Lit](https://lit.dev/) for small bundle size and native browser support
- Framework-agnostic — works in vanilla HTML, Angular, Svelte, Vue, or any framework that supports custom elements
- React wrappers provided via `@lit/react` for idiomatic React usage (props, event handlers)
- Selective adapter registration enables tree-shaking — only bundle the adapters you use

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| NestJS | Decorator-based modules, built-in DI, Swagger integration, throttling — good fit for a structured API proxy |
| Valibot over Zod/class-validator | Smaller bundle size, works in both Node and browser, no decorator dependency |
| pnpm workspaces | Shared adapter code between server and plugin without publishing to a registry during development |
| Vite for adapter builds | Fast builds, native ESM output, works well with Lit and library mode |
| AMB as canonical format | German educational metadata standard — aligns with DINI-AG-KIM ecosystem and Nostr AMB relay conventions |
| imgproxy for thumbnails | On-the-fly resizing without storage overhead, built-in CORS headers, HMAC URL signing |

## Future Enhancements

- **Additional sources** — add more OER source adapters as they become available (e.g., OERSI)
- **Content moderation** — leverage AMB relay moderation features for quality control
- **Multi-source queries** — aggregate results from multiple adapters in a single request
