# Using OER Finder Plugin in Svelte

This guide covers Svelte-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install the web components plugin:

```bash
pnpm add @edufeed-org/oer-finder-plugin
```

For additional installation details (pnpm overrides, etc.), see [Client Packages — Web Components Plugin](./client-packages.md#web-components-plugin).

## Basic Usage (Svelte)

The recommended pattern is to slot `<oer-list>` and `<oer-load-more>` inside `<oer-search>`. Import the plugin at the top level and use `bind:this` to get element references.

```svelte
<script lang="ts">
  import type {
    OerSearchResultEvent,
    OerSearchElement,
    OerListElement,
    OerCardClickEvent,
    SourceConfig,
    LoadMoreElement
  } from '@edufeed-org/oer-finder-plugin';
  import { onMount } from 'svelte';
  import '@edufeed-org/oer-finder-plugin';

  let searchElement: OerSearchElement;
  let listElement: OerListElement;
  let loadMoreElement: LoadMoreElement;

  // Configure available sources
  const sources: SourceConfig[] = [
    { id: 'nostr-amb-relay', label: 'AMB Relay' },
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC' },
  ];

  onMount(() => {
    // Set sources as a JS property (not HTML attribute)
    searchElement.sources = sources;

    searchElement.addEventListener('search-loading', () => {
      listElement.loading = true;
      loadMoreElement.loading = true;
    });

    // Handle search results
    searchElement.addEventListener('search-results', (event: Event) => {
      const { data, meta } = (event as CustomEvent<OerSearchResultEvent>).detail;
      listElement.oers = data;
      listElement.loading = false;
      loadMoreElement.metadata = meta;
      loadMoreElement.loading = false;
    });

    // Handle search errors
    searchElement.addEventListener('search-error', (event: Event) => {
      const { error } = (event as CustomEvent<{ error: string }>).detail;
      listElement.oers = [];
      listElement.error = error;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    // Handle search cleared
    searchElement.addEventListener('search-cleared', () => {
      listElement.oers = [];
      listElement.error = null;
      listElement.loading = false;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    // Handle card clicks
    listElement.addEventListener('card-click', (event: Event) => {
      const { oer } = (event as CustomEvent<OerCardClickEvent>).detail;
      const url = oer.amb?.id;
      if (url) {
        window.open(String(url), '_blank', 'noopener,noreferrer');
      }
    });
  });
</script>

<oer-search
  bind:this={searchElement}
  api-url="https://your-api-url.com"
  language="en"
  page-size="20"
>
  <oer-list bind:this={listElement} language="en"></oer-list>
  <oer-load-more bind:this={loadMoreElement} language="en"></oer-load-more>
</oer-search>
```

## SvelteKit Usage

SvelteKit uses server-side rendering (SSR) by default. Since web components rely on browser APIs, the plugin must be imported dynamically inside `onMount` to avoid SSR errors.

This example shows a reusable SvelteKit component (Svelte 5 runes syntax) that uses direct-client mode with `<oer-load-more>` for infinite scrolling and CSS variable theming:

```svelte
<script lang="ts">
  import type {
    OerSearchResultEvent,
    OerSearchElement,
    OerListElement,
    OerCardClickEvent,
    SourceConfig,
    LoadMoreElement
  } from '@edufeed-org/oer-finder-plugin';
  import { onMount } from 'svelte';

  interface Props {
    onSelect: (imageUrl: string) => void;
  }

  const language = $state('en');
  const { onSelect }: Props = $props();

  const availableSources: SourceConfig[] = [
    { id: 'arasaac', label: 'ARASAAC' },
    { id: 'openverse', label: 'Openverse', checked: true },
    { id: 'wikimedia', label: 'Wikimedia', checked: true },
    { id: 'nostr-amb-relay', label: 'Nostr AMB', checked: true, baseUrl: 'wss://amb-relay.edufeed.org' },
    { id: 'rpi-virtuell', label: 'RPI Virtuell' },
  ];

  let searchEl: OerSearchElement;
  let listEl: OerListElement;
  let loadMoreElement: LoadMoreElement;

  onMount(async () => {
    // Dynamically import the plugin only on the client side to avoid SSR issues
    await import('@edufeed-org/oer-finder-plugin');

    // Set sources as a JS property (not HTML attribute)
    searchEl.sources = availableSources;

    searchEl?.addEventListener('search-loading', () => {
      listEl.loading = true;
      loadMoreElement.loading = true;
    });

    // Handle search results
    searchEl?.addEventListener('search-results', (e: Event) => {
      const customEvent = e as CustomEvent<OerSearchResultEvent>;
      listEl.oers = customEvent.detail.data;
      listEl.loading = false;
      loadMoreElement.metadata = customEvent.detail.meta;
      loadMoreElement.loading = false;
    });

    searchEl?.addEventListener('search-error', (e: Event) => {
      const customEvent = e as CustomEvent<{ error: string }>;
      listEl.oers = [];
      listEl.error = customEvent.detail.error;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    searchEl?.addEventListener('search-cleared', () => {
      listEl.oers = [];
      listEl.loading = false;
      listEl.error = null;
      loadMoreElement.metadata = null;
      loadMoreElement.loading = false;
    });

    // Handle card selection - extract image URL from extensions
    listEl?.addEventListener('card-click', (e: Event) => {
      const customEvent = e as CustomEvent<OerCardClickEvent>;
      const oer = customEvent.detail.oer;
      const imageUrl = oer.extensions?.images?.high || oer.extensions?.images?.medium || oer.extensions?.images?.small || oer.amb?.id;
      if (imageUrl) {
        onSelect(imageUrl);
      }
    });
  });
</script>

<div class="oer-picker-container">
  <oer-search
    bind:this={searchEl}
    language={language}
    locked-type="image"
    page-size={12}
  >
    <oer-list bind:this={listEl} {language}></oer-list>
    <oer-load-more bind:this={loadMoreElement} language={language}></oer-load-more>
  </oer-search>
</div>

<style>
  .oer-picker-container {
    --primary-color: var(--accent);
    --primary-hover-color: color-mix(in oklch, var(--accent) 85%, black);
    --secondary-color: var(--secondary);
    --background-card: var(--card);
    --background-form: var(--background);
    --background-input: var(--background);
    --text-primary: var(--foreground);
    --text-secondary: var(--foreground);
    --text-muted: var(--muted-foreground);
    --border-color: var(--border);
    --input-border-color: var(--border);
  }
</style>
```

### Key SvelteKit Differences

| Concern | Svelte (SPA) | SvelteKit (SSR) |
|---------|-------------|-----------------|
| Plugin import | Top-level `import '@edufeed-org/oer-finder-plugin'` | Dynamic `await import(...)` inside `onMount` |
| Reactivity | Svelte 4 `let` bindings or Svelte 5 runes | Svelte 5 `$state()`, `$props()` runes |
| Component API | Props via `export let` | Props via `$props()` interface |
| SSR safety | Not a concern | Must guard all DOM access with `onMount` |

### SSR Considerations

- **Always use dynamic imports**: The plugin registers custom elements on import, which requires the `customElements` browser API. A top-level import will crash during SSR.
- **Guard DOM access**: All `addEventListener` calls and property assignments on element refs must be inside `onMount`.
- **Optional chaining**: Use `searchEl?.addEventListener(...)` to guard against refs that may not yet be assigned.

## Configuring Sources

Sources are configured using the `SourceConfig` type and set as a JS property on the `<oer-search>` element.
This is a JS property (not an HTML attribute), so it must be set programmatically.

For **server-proxy mode** (with `api-url`):

```svelte
<script lang="ts">
  import type { SourceConfig } from '@edufeed-org/oer-finder-plugin';

  // Use checked: true to set the pre-selected sources
  const sources: SourceConfig[] = [
    { id: 'nostr-amb-relay', label: 'AMB Relay', checked: true },
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC' },
  ];
</script>
```

For **direct client mode** (without `api-url`), provide `baseUrl` where needed:

```svelte
<script lang="ts">
  import type { SourceConfig } from '@edufeed-org/oer-finder-plugin';

  const sources: SourceConfig[] = [
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC', checked: true },
    { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
    { id: 'wikimedia', label: 'Wikimedia' },
    { id: 'rpi-virtuell', label: 'RPI Virtuell' },
  ];
</script>
```

## CSS Theming

Map your application's design tokens to the plugin's CSS custom properties on a wrapper element:

```svelte
<style>
  .oer-wrapper {
    --primary-color: #8b5cf6;
    --primary-hover-color: #7c3aed;
    --secondary-color: #ec4899;
    --background-card: #ffffff;
    --background-form: #f8f9fa;
    --background-input: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #4a4a4a;
    --text-muted: #9ca3af;
    --border-color: #e5e7eb;
    --input-border-color: #d1d5db;
  }
</style>
```

See [Client Packages — Styling with CSS Variables](./client-packages.md#styling-with-css-variables) for the full list of available properties.

## Example

See https://github.com/edufeed-org/kanban-editor/pull/38
