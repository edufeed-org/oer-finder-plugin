# Using OER Finder Plugin in Angular

This guide covers Angular-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

## Installation

Ensure the GitHub package registry is configured (see [Registry Setup](./client-packages.md#registry-setup)), then install the web components plugin:

```bash
pnpm add @edufeed-org/oer-finder-plugin
```

For additional installation details (pnpm overrides, etc.), see [Client Packages — Web Components Plugin](./client-packages.md#web-components-plugin).

## Angular Configuration

Angular requires `CUSTOM_ELEMENTS_SCHEMA` to recognize web component tags:

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  declarations: [OerFinderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OerFinderModule {}
```

## Basic Usage

The recommended pattern is to slot `<oer-list>` and `<oer-pagination>` inside `<oer-search>` for automatic pagination handling.

### Component

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import type {
  OerSearchResultEvent,
  OerCardClickEvent,
  OerSearchElement,
  SourceConfig,
} from '@edufeed-org/oer-finder-plugin';
import '@edufeed-org/oer-finder-plugin';

@Component({
  selector: 'app-oer-finder',
  templateUrl: './oer-finder.component.html',
})
export class OerFinderComponent implements AfterViewInit {
  @ViewChild('searchElement') searchElement!: ElementRef;
  @ViewChild('listElement') listElement!: ElementRef;
  @ViewChild('paginationElement') paginationElement!: ElementRef;

  // Configure available sources
  sources: SourceConfig[] = [
    { id: 'nostr', label: 'OER Aggregator Nostr Database' },
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC' },
  ];

  ngAfterViewInit(): void {
    // Set sources as a JS property (not HTML attribute)
    const searchEl = this.searchElement.nativeElement as OerSearchElement;
    searchEl.sources = this.sources;
  }

  // Note: Page-change events from oer-pagination bubble up and are
  // automatically caught by oer-search to trigger new searches.

  onSearchResults(event: Event): void {
    const { data, meta } = (event as CustomEvent<OerSearchResultEvent>).detail;
    const listEl = this.listElement.nativeElement;
    const paginationEl = this.paginationElement.nativeElement;
    listEl.oers = data;
    listEl.loading = false;
    // Set metadata and loading on the pagination element
    paginationEl.metadata = meta;
    paginationEl.loading = false;
  }

  onSearchError(event: Event): void {
    const { error } = (event as CustomEvent<{ error: string }>).detail;
    const listEl = this.listElement.nativeElement;
    const paginationEl = this.paginationElement.nativeElement;
    listEl.oers = [];
    listEl.error = error;
    listEl.loading = false;
    paginationEl.metadata = null;
    paginationEl.loading = false;
  }

  onSearchCleared(): void {
    const listEl = this.listElement.nativeElement;
    const paginationEl = this.paginationElement.nativeElement;
    listEl.oers = [];
    listEl.error = null;
    listEl.loading = false;
    paginationEl.metadata = null;
    paginationEl.loading = false;
  }

  onCardClick(event: Event): void {
    const { oer } = (event as CustomEvent<OerCardClickEvent>).detail;
    // Handle card click
  }
}
```

### Template

```html
<oer-search
  #searchElement
  api-url="https://your-api-url.com"
  language="de"
  page-size="20"
  (search-results)="onSearchResults($event)"
  (search-error)="onSearchError($event)"
  (search-cleared)="onSearchCleared()"
>
  <oer-list
    #listElement
    language="de"
    (card-click)="onCardClick($event)"
  ></oer-list>
  <oer-pagination
    #paginationElement
    language="de"
  ></oer-pagination>
</oer-search>
```

## Configuring Sources

Sources are configured using the `SourceConfig` type and must be set as a JS property (not an HTML attribute).
Set the `sources` property in `ngAfterViewInit` as shown in the example above.

```typescript
import type { SourceConfig } from '@edufeed-org/oer-finder-plugin';

// Server-proxy mode sources (with api-url set)
// Use selected: true to set the default source
const serverSources: SourceConfig[] = [
  { id: 'nostr', label: 'Nostr', selected: true },
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
];

// Direct client mode sources (without api-url)
const directSources: SourceConfig[] = [
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC', selected: true },
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
];
```

## Example

See the [TeamMapper integration PR](https://github.com/b310-digital/teammapper/pull/1081) for a real-world Angular example.

<img src="./images/oer-finder-plugin-teammapper.png" width=750/>
