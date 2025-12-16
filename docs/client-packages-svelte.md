# Using OER Finder Plugin in Svelte

This guide covers Svelte-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Create `.npmrc` in your project root:

```
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install:

```bash
npm install @edufeed-org/oer-finder-plugin
```

## Basic Usage

The recommended pattern is to slot `<oer-list>` and `<oer-pagination>` inside `<oer-search>` for automatic pagination handling.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { OerSearchResultEvent, OerCardClickEvent } from '@edufeed-org/oer-finder-plugin';
  import '@edufeed-org/oer-finder-plugin';

  let searchElement: HTMLElement;
  let listElement: HTMLElement;
  let paginationElement: HTMLElement;

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
      const url = oer.amb_metadata?.id || oer.url;
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

```svelte
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
