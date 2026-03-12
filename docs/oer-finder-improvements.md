# OER Finder Plugin — Upstream Improvement Report

**Package:** `@edufeed-org/oer-finder-plugin-react` (v0.1.1) / `@edufeed-org/oer-finder-plugin` (v0.2.x)
**Documentation:** [client-packages-react.md](https://github.com/edufeed-org/oer-finder-plugin/blob/main/docs/client-packages-react.md)
**Date:** 2026-03-05

---

## 1. Pinned Dependency Causes Dual Adapter Registry

**Severity:** Critical
**Affected package:** `@edufeed-org/oer-finder-plugin-react`

`oer-finder-plugin-react@0.1.1` declares its dependency on the base plugin as an **exact pinned version**:

```json
"@edufeed-org/oer-finder-plugin": "0.2.0"
```

Because no caret (`^`) or tilde (`~`) range is used, npm cannot deduplicate this dependency when a consumer also installs `@edufeed-org/oer-finder-plugin` at any other version (e.g. `^0.2.1`). This results in **two physically separate copies** on disk, each with its own module-level adapter registry `Map` singleton.

The consequence is a silent runtime failure: adapters registered via the top-level copy are invisible to the React components, which read from the nested copy's registry. All searches return zero results with no error.

**Suggested fix:** Use a caret range for the peer/dependency specification:

```json
"@edufeed-org/oer-finder-plugin": "^0.2.0"
```

This allows npm to hoist and deduplicate a single copy when the consumer installs a compatible version.

---

## 2. Adapter Registration Path Not Documented

**Severity:** High
**Affected:** `client-packages-react.md` documentation

The React package exports a `/adapters` subpath that re-exports `registerAllBuiltInAdapters`:

```json
// package.json exports field
"./adapters": {
  "types": "./dist/adapters.d.ts",
  "import": "./dist/adapters.js"
}
```

This allows consumers to register adapters through the React package:

```typescript
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin-react/adapters';
```

This import path is **critical** for avoiding the dual-registry problem described above, because it guarantees the registration targets the same module instance that the React components use. However, the documentation only shows the base plugin import path:

```typescript
// Docs currently show only this:
import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
```

**Suggested fix:** Update the documentation to recommend the React package re-export path as the primary (or only) way to register adapters when using the React package. At minimum, add a warning that importing from the base plugin directly can cause registry mismatches.

---

## 3. Documentation States Base Plugin Is Bundled, But Registration Requires It

**Severity:** High
**Affected:** `client-packages-react.md` documentation

The docs state:

> "The base plugin dependency is bundled automatically—separate installation is unnecessary."

This is correct for the components themselves, but the documented adapter registration pattern imports directly from `@edufeed-org/oer-finder-plugin/adapters` — a path that only resolves if the base plugin is installed as a top-level dependency (or the consumer knows to use the undocumented `/adapters` re-export from the React package).

This contradiction leads consumers to add the base plugin as a direct dependency, which triggers the dual-registry issue in point 1.

**Suggested fix:** Either:
- Document the `@edufeed-org/oer-finder-plugin-react/adapters` re-export path (preferred), or
- List `@edufeed-org/oer-finder-plugin` as a `peerDependency` with a compatible range so npm can deduplicate correctly

---

## 4. `OerCardClickDetail` Type Exported But Not Documented

**Severity:** Low
**Affected:** `client-packages-react.md` documentation

The React package's `index.d.ts` exports `OerCardClickDetail`:

```typescript
export type { OerSearchResultDetail, OerSearchResultEvent, OerCardClickDetail, OerCardClickEvent, ... }
```

However, the documentation's "Core Component Imports" and "Key Types" sections do not list `OerCardClickDetail`. Consumers who discover it via IDE autocompletion may rely on it without knowing whether it is part of the stable public API.

**Suggested fix:** Either add `OerCardClickDetail` (and `OerSearchResultDetail`) to the documented types list, or mark them as internal/unstable if they are not intended for direct use.

---

## 5. `wikimedia` Adapter Not Documented

**Severity:** Low
**Affected:** `client-packages-react.md` documentation

The base plugin ships a built-in `wikimedia` adapter that is registered by `registerAllBuiltInAdapters()`. Both v0.2.0 and v0.2.1 include `dist/adapter/wikimedia.js`. However, the documentation only mentions `openverse`, `arasaac`, and `nostr` as available sources.

**Suggested fix:** Add `wikimedia` to the list of built-in adapters in the documentation, including any configuration notes (e.g. whether a `baseUrl` is needed).

---

## 6. `shownCount` Prop on `OerLoadMore` Not Documented

**Severity:** Low
**Affected:** `client-packages-react.md` documentation

The `OerLoadMore` component accepts a `shownCount` prop (visible in the package's JSDoc / type declarations):

```tsx
<OerLoadMore metadata={metadata} shownCount={oers.length} loading={isLoading} language="en" />
```

Without `shownCount`, the "Showing X of Y" display may show an incorrect count. The documentation's props table for `OerLoadMore` does not list this prop.

**Suggested fix:** Add `shownCount` to the documented `OerLoadMore` props table with its type (`number`) and a note that it controls the displayed count of currently shown results.

---

## 7. Additional Exported Types Missing From Documentation

**Severity:** Low
**Affected:** `client-packages-react.md` documentation

The following types are exported from the React package but not mentioned in the docs:

| Type | Purpose |
|---|---|
| `OerSearchResultDetail` | Detail payload of `OerSearchResultEvent` |
| `OerMetadata` | Metadata structure on `OerItem` |
| `OerListResponse` | Full list response shape |
| `SearchParams` | Search parameter structure |
| `SourceOption` | Source option type |
| `AdapterFactory` | Factory function type for custom adapters |
| `OerSearchElement` | Underlying web component type |
| `OerListElement` | Underlying web component type |
| `OerCardElement` | Underlying web component type |
| `LoadMoreElement` | Underlying web component type |

Consumers building custom integrations or extending the plugin would benefit from having these documented, even if briefly.

**Suggested fix:** Add a "Complete Type Reference" section listing all exported types with short descriptions.
