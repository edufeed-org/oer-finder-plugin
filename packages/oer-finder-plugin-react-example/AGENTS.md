# oer-finder-plugin-react-example

React showcase app demonstrating the OER Finder Plugin React Components. Private package, not published.

## What This Package Does

- Side-by-side demo of server-proxy mode (connects to `http://localhost:3000`) and direct-client mode (runs adapters in browser)
- Shows `SourceConfig[]` setup patterns and event handling for all search events as React callbacks
- Demonstrates CSS custom properties for theming
- Auto-rebuilds the React plugin wrapper before starting the dev server

## Key Files

- `src/App.tsx` — `SearchDemo` component for reusable search instance, `App` renders two demo modes (server-proxy and direct-client)
- `src/main.tsx` — React 19 root mount
- `src/styles.css` — CSS custom properties for theming

## Development

```bash
pnpm --filter @edufeed-org/oer-finder-plugin-react-example dev          # Vite dev server (auto-rebuilds plugin)
pnpm --filter @edufeed-org/oer-finder-plugin-react-example build         # Production build
pnpm --filter @edufeed-org/oer-finder-plugin-react-example type-check    # tsc --noEmit
```

## Tech Stack

- **Dev server:** Vite with `@vitejs/plugin-react`
- **Test:** No tests
- **TypeScript:** ES2020, ESNext modules, `jsx: react-jsx`, DOM lib
- **Dependencies:** `oer-finder-plugin-react` (workspace), `react`, `react-dom` (v19)

## Conventions

- `predev` script auto-rebuilds the React plugin wrapper before `vite` starts
- Server-proxy mode requires the NestJS backend running on `localhost:3000`
