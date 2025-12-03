# Using OER Finder Plugin in Angular

This guide covers Angular-specific integration. For component properties and events, see [Client Packages](./client-packages.md).

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
import { Component, ElementRef, ViewChild } from '@angular/core';
import type { OerSearchResultEvent, OerCardClickEvent } from '@edufeed-org/oer-finder-plugin';
import '@edufeed-org/oer-finder-plugin';

@Component({
  selector: 'app-oer-finder',
  templateUrl: './oer-finder.component.html',
})
export class OerFinderComponent {
  @ViewChild('searchElement') searchElement!: ElementRef;
  @ViewChild('listElement') listElement!: ElementRef;
  @ViewChild('paginationElement') paginationElement!: ElementRef;

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

## Passing Complex Properties

For array/object properties like `available-sources`, use JSON binding:

```typescript
availableSources = [
  { value: 'all', label: 'All Sources' },
  { value: 'arasaac', label: 'ARASAAC' },
];
```

```html
<oer-search
  [attr.available-sources]="availableSources | json"
></oer-search>
```

## Example

See the [TeamMapper integration PR](https://github.com/b310-digital/teammapper/pull/1081) for a real-world Angular example.

<img src="./images/oer-finder-plugin-teammapper.png" width=750/>
