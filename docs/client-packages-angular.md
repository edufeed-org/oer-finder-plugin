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

The recommended pattern is to slot `<oer-list>` and `<oer-load-more>` inside `<oer-search>`.

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
  @ViewChild('loadMoreElement') loadMoreElement!: ElementRef;

  // Configure available sources
  sources: SourceConfig[] = [
    { id: 'nostr-amb-relay', label: 'AMB Relay' },
    { id: 'openverse', label: 'Openverse' },
    { id: 'arasaac', label: 'ARASAAC' },
  ];

  ngAfterViewInit(): void {
    // Set sources as a JS property (not HTML attribute)
    const searchEl = this.searchElement.nativeElement as OerSearchElement;
    searchEl.sources = this.sources;
  }

  // Note: load-more events bubble up and are automatically
  // caught by oer-search to fetch the next page of results.

  onSearchResults(event: Event): void {
    const { data, meta } = (event as CustomEvent<OerSearchResultEvent>).detail;
    const listEl = this.listElement.nativeElement;
    const loadMoreEl = this.loadMoreElement.nativeElement;
    listEl.oers = data;
    listEl.loading = false;
    loadMoreEl.metadata = meta;
    loadMoreEl.loading = false;
  }

  onSearchError(event: Event): void {
    const { error } = (event as CustomEvent<{ error: string }>).detail;
    const listEl = this.listElement.nativeElement;
    const loadMoreEl = this.loadMoreElement.nativeElement;
    listEl.oers = [];
    listEl.error = error;
    listEl.loading = false;
    loadMoreEl.metadata = null;
    loadMoreEl.loading = false;
  }

  onSearchCleared(): void {
    const listEl = this.listElement.nativeElement;
    const loadMoreEl = this.loadMoreElement.nativeElement;
    listEl.oers = [];
    listEl.error = null;
    listEl.loading = false;
    loadMoreEl.metadata = null;
    loadMoreEl.loading = false;
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
  <oer-load-more
    #loadMoreElement
    language="de"
  ></oer-load-more>
</oer-search>
```

## Configuring Sources

Sources are configured using the `SourceConfig` type and must be set as a JS property (not an HTML attribute).
Set the `sources` property in `ngAfterViewInit` as shown in the example above.

```typescript
import type { SourceConfig } from '@edufeed-org/oer-finder-plugin';

// Server-proxy mode sources (with api-url set)
// Use checked: true to set the pre-selected sources
const serverSources: SourceConfig[] = [
  { id: 'nostr-amb-relay', label: 'AMB Relay', checked: true },
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC' },
];

// Direct client mode sources (without api-url)
const directSources: SourceConfig[] = [
  { id: 'openverse', label: 'Openverse' },
  { id: 'arasaac', label: 'ARASAAC', checked: true },
  { id: 'nostr-amb-relay', label: 'Nostr AMB Relay', baseUrl: 'wss://amb-relay.edufeed.org' },
];
```

## Example

See the [TeamMapper integration PR](https://github.com/b310-digital/teammapper/pull/1081) for a real-world Angular example.

<img src="./images/oer-finder-plugin-teammapper.png" width=750/>
