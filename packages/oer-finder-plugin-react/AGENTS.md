# oer-finder-plugin-react

React wrapper components for the OER Finder Plugin Web Components.

## What This Package Does

- Uses `@lit/react`'s `createComponent()` to wrap all 4 web components as React components: `OerSearch`, `OerList`, `OerCard`, `OerLoadMore`
- Maps custom event names to React prop callbacks (`onSearchResults`, `onCardClick`, `onLoadMore`, etc.)
- Re-exports all relevant types from `oer-finder-plugin`
- Peer dependency on React 18 or 19

## Key Files

- `src/index.ts` — Single file with all React component wrappers and type re-exports

## Build

```bash
pnpm --filter @edufeed-org/oer-finder-plugin-react build        # Rebuilds plugin first, then Vite build + tsc declarations
pnpm --filter @edufeed-org/oer-finder-plugin-react type-check    # tsc --noEmit
pnpm --filter @edufeed-org/oer-finder-plugin-react lint          # ESLint
pnpm --filter @edufeed-org/oer-finder-plugin-react format        # Prettier
```

## Tech Stack

- **Build:** Vite (dual CJS+ESM output) + tsc for declarations. Always rebuilds `oer-finder-plugin` first
- **Test:** No tests
- **TypeScript:** ES2020, ESNext modules, bundler resolution, `jsx: react-jsx`, DOM lib
- **Dependencies:** `oer-finder-plugin` (workspace), `@lit/react`
- **Peer deps:** `react ^18.0.0 || ^19.0.0`

## Conventions

- This is a thin wrapper layer — all logic lives in `oer-finder-plugin`
- Custom events are mapped to idiomatic React `onXxx` callback props
