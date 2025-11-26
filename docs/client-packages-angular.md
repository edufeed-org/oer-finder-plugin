# Using OER Finder Plugin in Angular

This guide covers Angular-specific integration of the `@edufeed-org/oer-finder-plugin` web components. For general component documentation, see [Client Packages](./client-packages.md).

## Installation

### 1. Configure npm Registry

Create `.npmrc` in your project root:

```
@edufeed-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### 2. Install the Package

```bash
npm install @edufeed-org/oer-finder-plugin
```

## Angular Configuration

### Enable Custom Elements Schema

Angular requires `CUSTOM_ELEMENTS_SCHEMA` to recognize web component tags.

Add `CUSTOM_ELEMENTS_SCHEMA` to your module:

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  declarations: [OerFinderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OerFinderModule {}
```

## Basic Implementation

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
  @ViewChild('listElement') listElement!: ElementRef;

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
    // ... do something here
  }
}
```

### Template

```html
<oer-theme-provider>
  <oer-search
    api-url="https://your-api-url.com"
    language="de"
    page-size="5"
    (search-results)="onSearchResults($event)"
    (search-error)="onSearchError($event)"
    (search-cleared)="onSearchCleared()"
  ></oer-search>

  <oer-list
    #listElement
    language="de"
    (card-click)="onCardClick($event)"
  ></oer-list>
</oer-theme-provider>
```

## Pagination

Wire up the page change callback in `ngAfterViewInit`:

```typescript
@ViewChild('searchElement') searchElement!: ElementRef;
@ViewChild('listElement') listElement!: ElementRef;

ngAfterViewInit(): void {
  this.listElement.nativeElement.onPageChange = (page: number) => {
    this.searchElement.nativeElement.handlePageChange(page);
  };
}
```

Add `#searchElement` to the template:

```html
<oer-search #searchElement ...></oer-search>
```

## Styling with CSS Variables

Override colors in your component stylesheet:

```scss
oer-search,
oer-list,
oer-card {
  --primary-color: #8b5cf6;
  --primary-hover-color: #7c3aed;
  --secondary-color: #ec4899;
}
```

## Example

For an example, see https://github.com/b310-digital/teammapper/pull/1081
This is a draft on how to include the oer-finder-plugin into teammapper, which is an angular application.

<img src="./images/oer-finder-plugin-teammapper.png" width=750/>