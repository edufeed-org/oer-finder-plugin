# Using OER Finder Plugin in Svelte

This guide covers Svelte-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install the web components plugin:

```bash
pnpm add @edufeed-org/oer-finder-plugin
```

For additional installation details (pnpm overrides, etc.), see [Client Packages — Web Components Plugin](./client-packages.md#web-components-plugin).

## Basic Usage

The recommended pattern is to slot `<oer-list>` and `<oer-pagination>` inside `<oer-search>` for automatic pagination handling.

```javascript
<script lang="ts">
	import type {
		OerSearchResultEvent,
		OerSearchElement,
		OerListElement,
		PaginationElement,
		OerCardClickEvent,
		SourceConfig
	} from '@edufeed-org/oer-finder-plugin';
	import { onMount } from 'svelte';
	import '@edufeed-org/oer-finder-plugin';

	let searchElement: OerSearchElement;
	let listElement: OerListElement;
	let paginationElement: PaginationElement;

	// Configure available sources
	const sources: SourceConfig[] = [
		{ id: 'nostr-amb-relay', label: 'AMB Relay' },
		{ id: 'openverse', label: 'Openverse' },
		{ id: 'arasaac', label: 'ARASAAC' },
	];

	onMount(() => {
		// Set sources as a JS property (not HTML attribute)
		searchElement.sources = sources;

		// Handle search results
		searchElement.addEventListener('search-results', (event: Event) => {
			const { data, meta } = (event as CustomEvent<OerSearchResultEvent>).detail;
			listElement.oers = data;
			listElement.loading = false;
			paginationElement.metadata = meta;
			paginationElement.loading = false;
		});

		// Handle search errors
		searchElement.addEventListener('search-error', (event: Event) => {
			const { error } = (event as CustomEvent<{ error: string }>).detail;
			listElement.oers = [];
			listElement.error = error;
			listElement.loading = false;
			paginationElement.metadata = null;
			paginationElement.loading = false;
		});

		// Handle search cleared
		searchElement.addEventListener('search-cleared', () => {
			listElement.oers = [];
			listElement.error = null;
			listElement.loading = false;
			paginationElement.metadata = null;
			paginationElement.loading = false;
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

	// Note: Page-change events from oer-pagination bubble up and are
	// automatically caught by oer-search to trigger new searches.
</script>

<oer-search
  bind:this={searchElement}
  api-url="https://your-api-url.com"
  language="en"
  page-size="20"
>
  <oer-list
    bind:this={listElement}
    language="en"
  />
  <oer-pagination
    bind:this={paginationElement}
    language="en"
  />
</oer-search>
```

## Configuring Sources

Sources are configured using the `SourceConfig` type and set as a JS property on the `<oer-search>` element.
This is a JS property (not an HTML attribute), so it must be set programmatically.

For **server-proxy mode** (with `api-url`):

```javascript
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

```javascript
<script lang="ts">
  import type { SourceConfig } from '@edufeed-org/oer-finder-plugin';

  const sources: SourceConfig[] = [
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC', checked: true },
    { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
  ];
</script>
```

## Example

See https://github.com/edufeed-org/kanban-editor/pull/38