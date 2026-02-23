# oer-finder-plugin

Framework-agnostic Web Components plugin for searching OER (Open Educational Resources). This is the main end-user deliverable of the project.

## What This Package Does

- Provides 4 Lit-based Web Components: `<oer-search>`, `<oer-list>`, `<oer-card>`, `<oer-load-more>`
- Two operation modes:
  - **Server-proxy mode:** Set `api-url` attribute, routes to `ApiClient` which calls the NestJS backend
  - **Direct-adapter mode:** No `api-url`, routes to `DirectClient` which runs adapters in the browser
- Multi-source search with round-robin interleaving and per-source timeouts
- i18n support (English and German)
- Themeable via CSS custom properties

## Key Files

- `src/oer-search/OerSearch.ts` — Main search component, manages client creation and pagination
- `src/oer-list/OerList.ts` — Renders grid of `<oer-card>` elements
- `src/oer-card/OerCard.ts` — Single OER item display with thumbnail, title, license info
- `src/load-more/LoadMore.ts` — "Showing X of Y" with load-more button
- `src/clients/client-factory.ts` — `ClientFactory.create()` chooses `ApiClient` or `DirectClient`
- `src/clients/direct-client.ts` — Runs adapters in-browser via `AdapterManager`
- `src/adapters/adapter-manager.ts` — Creates adapter instances by source ID, applies filter guards
- `src/pagination/multi-source-paginator.ts` — Pure functional multi-source pagination with interleaving
- `src/translations.ts` — i18n strings for EN and DE
- `src/types/source-config.ts` — `SourceConfig` interface

## Build & Test

```bash
pnpm --filter @edufeed-org/oer-finder-plugin build        # Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-finder-plugin test          # Vitest with happy-dom
pnpm --filter @edufeed-org/oer-finder-plugin test:watch    # Vitest watch mode
pnpm --filter @edufeed-org/oer-finder-plugin type-check    # tsc --noEmit
pnpm --filter @edufeed-org/oer-finder-plugin lint          # ESLint (includes lit/wc plugins)
pnpm --filter @edufeed-org/oer-finder-plugin format        # Prettier
```

## Tech Stack

- **Build:** Vite (UMD + ESM output) + tsc for declarations
- **Test:** Vitest with `happy-dom`, tests co-located in `src/`
- **TypeScript:** ES2020, ESNext modules, bundler resolution, strict mode, DOM lib, `experimentalDecorators` (Lit), `useDefineForClassFields: false` (required for Lit decorators)
- **UI:** Lit 3, Shadow DOM, scoped styles
- **Dependencies:** `lit` (runtime); all adapters and api-client as devDeps (bundled)

## Conventions

- Web Components use Lit decorators (`@customElement`, `@property`, `@state`)
- Events are dispatched as `CustomEvent` (`search-results`, `search-error`, `card-click`, `load-more`, etc.)
- Pagination logic is pure functional (no class state) in `src/pagination/`
- ESLint includes `eslint-plugin-lit` and `eslint-plugin-wc` for web component linting
