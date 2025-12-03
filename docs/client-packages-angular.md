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

  ngAfterViewInit(): void {
    // Wire up pagination
    this.listElement.nativeElement.onPageChange = (page: number) => {
      this.searchElement.nativeElement.handlePageChange(page);
    };
  }

  onSearchResults(event: Event): void {
    const { data, meta } = (event as CustomEvent<OerSearchResultEvent>).detail;
    const listEl = this.listElement.nativeElement;
    listEl.oers = data;
    listEl.showPagination = true;
    listEl.metadata = meta;
  }

  onSearchError(event: Event): void {
    const { error } = (event as CustomEvent<{ error: string }>).detail;
    const listEl = this.listElement.nativeElement;
    listEl.oers = [];
    listEl.error = error;
    listEl.showPagination = false;
  }

  onSearchCleared(): void {
    const listEl = this.listElement.nativeElement;
    listEl.oers = [];
    listEl.error = null;
    listEl.showPagination = false;
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
></oer-search>

<oer-list
  #listElement
  language="de"
  (card-click)="onCardClick($event)"
></oer-list>
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
