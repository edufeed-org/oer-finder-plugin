# oer-finder-plugin-react

React wrapper components for the OER Finder Plugin Web Components.

## What This Package Does

- Uses `@lit/react`'s `createComponent()` to wrap all 4 web components as React components: `OerSearch`, `OerList`, `OerCard`, `OerLoadMore`
- Maps custom event names to React prop callbacks (`onSearchResults`, `onCardClick`, `onLoadMore`, etc.)
- Re-exports relevant UI types from `oer-finder-plugin`
- Peer dependency on `@edufeed-org/oer-finder-plugin` and React 18 or 19
- Adapter registration and adapter types are imported directly from `@edufeed-org/oer-finder-plugin` by consumers

## Key Files

- `src/index.ts` — React component wrappers (via `@lit/react`) and type re-exports

## Build

```bash
pnpm --filter @edufeed-org/oer-finder-plugin-react build        # Rebuilds plugin first, then Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-finder-plugin-react type-check    # tsc --noEmit
pnpm --filter @edufeed-org/oer-finder-plugin-react lint          # ESLint
pnpm --filter @edufeed-org/oer-finder-plugin-react format        # Prettier
```

## Tech Stack

- **Build:** Vite (ESM-only output) + tsc for declarations. Always rebuilds `oer-finder-plugin` first. CJS was dropped to avoid dual-registry issues — `oer-finder-plugin` is ESM-only, so a CJS build would create separate module instances
- **Test:** No tests
- **TypeScript:** ES2020, ESNext modules, bundler resolution, `jsx: react-jsx`, DOM lib
- **Dependencies:** `@lit/react` is a dev dependency (bundled by Vite)
- **Peer deps:** `@edufeed-org/oer-finder-plugin` (workspace), `react ^18.0.0 || ^19.0.0`

## Conventions

- This is a thin wrapper layer — all logic lives in `oer-finder-plugin`
- Custom events are mapped to idiomatic React `onXxx` callback props
