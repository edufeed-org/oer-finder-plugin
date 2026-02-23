# oer-finder-plugin-example

Vanilla HTML/TypeScript showcase app demonstrating the OER Finder Plugin Web Components. Private package, not published.

## What This Package Does

- Side-by-side demo of server-proxy mode (connects to `http://localhost:3000`) and direct-client mode (runs adapters in browser)
- Shows `SourceConfig[]` setup patterns and event handling for all search events
- Auto-rebuilds the plugin before starting the dev server

## Key Files

- `src/main.ts` — Event handlers for two demo instances (server-proxy and direct-client)
- `src/styles.css` — Example app styles
- `index.html` — HTML with two `<oer-search>` instances

## Development

```bash
pnpm --filter @edufeed-org/oer-finder-plugin-example dev          # Vite dev server (auto-rebuilds plugin)
pnpm --filter @edufeed-org/oer-finder-plugin-example build         # Production build
pnpm --filter @edufeed-org/oer-finder-plugin-example type-check    # tsc --noEmit
```

## Tech Stack

- **Dev server:** Vite
- **Test:** No tests
- **TypeScript:** ES2020, ESNext modules, bundler resolution, DOM lib
- **Dependencies:** `oer-finder-plugin` (workspace)

## Conventions

- `predev` script auto-rebuilds the plugin before `vite` starts
- Server-proxy mode requires the NestJS backend running on `localhost:3000`
