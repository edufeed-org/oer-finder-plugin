# Using OER Finder Plugin in Svelte

This guide covers Svelte-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

For installation, see [Client Packages (Web Components Plugin)](./client-packages.md).

## Basic Usage

The recommended pattern is to slot `<oer-list>` and `<oer-pagination>` inside `<oer-search>` for automatic pagination handling.

```javascript
<script lang="ts">
	import type {
		OerSearchResultEvent,
		OerSearchElement,
		OerListElement,
		PaginationElement,
    OerCardClickEvent
	} from '@edufeed-org/oer-finder-plugin';
  import { onMount } from 'svelte';
  import '@edufeed-org/oer-finder-plugin';

	let searchElement: OerSearchElement;
	let listElement: OerListElement;
	let paginationElement: PaginationElement;

  onMount(() => {
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

## Passing Complex Properties

For array/object properties like `available-sources`, convert to JSON string:

```javascript
<script lang="ts">
  const availableSources = [
    { value: 'all', label: 'All Sources' },
    { value: 'arasaac', label: 'ARASAAC' },
  ];
</script>

<oer-search
  api-url="https://your-api-url.com"
  available-sources={JSON.stringify(availableSources)}
/>
```

## Example

See https://github.com/edufeed-org/kanban-editor/pull/38