import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  getSearchTranslations,
  type SupportedLanguage,
  type OerSearchTranslations,
} from '../translations.js';
import { COMMON_LICENSES, FILTER_LANGUAGES, RESOURCE_TYPES, SOURCE_ID_ALL } from '../constants.js';
import { styles } from './styles.js';
import { ClientFactory, type SearchClient } from '../clients/index.js';
import type { AllSourcesState } from '../clients/search-client.interface.js';
import type { SourceConfig } from '../types/source-config.js';

type OerItem = components['schemas']['OerItemSchema'];

export interface SearchParams {
  page?: number;
  pageSize?: number;
  source?: string;
  type?: string;
  searchTerm?: string;
  license?: string;
  free_for_use?: boolean;
  educational_level?: string;
  language?: string;
  /** For "all sources" Load More: per-source cursor state from previous result */
  allSourcesState?: AllSourcesState;
}

export interface SourceOption {
  id: string;
  label: string;
  selected?: boolean;
}

export interface OerSearchResultEvent {
  data: OerItem[];
  meta: components['schemas']['OerMetadataSchema'];
}

@customElement('oer-search')
export class OerSearchElement extends LitElement {
  static styles = styles;

  /**
   * API URL for server-proxy mode.
   * If not provided, direct-adapter mode is used (adapters run in browser).
   */
  @property({ type: String, attribute: 'api-url' })
  apiUrl?: string;

  /**
   * Unified source configuration.
   * Set as a JS property (not HTML attribute) since all consumers use JS/React.
   *
   * @example
   * ```ts
   * el.sources = [
   *   { id: 'openverse', label: 'Openverse' },
   *   { id: 'nostr-amb-relay', label: 'Nostr Relay', baseUrl: 'wss://relay.example.com' },
   * ];
   * ```
   */
  @property({ type: Array, attribute: false })
  sources?: SourceConfig[];

  @property({ type: String })
  language: SupportedLanguage = 'en';

  @property({ type: String, attribute: 'locked-type' })
  lockedType?: string;

  @property({ type: Boolean, attribute: 'show-type-filter' })
  showTypeFilter = true;

  @property({ type: Number, attribute: 'page-size' })
  pageSize = 20;

  @property({ type: String, attribute: 'locked-source' })
  lockedSource?: string;

  @property({ type: Boolean, attribute: 'show-source-filter' })
  showSourceFilter = true;

  /**
   * Internal list of available sources for the dropdown.
   * Derived from `sources` or from the client's adapter manager.
   */
  @state()
  private availableSources: SourceOption[] = [];

  private get t(): OerSearchTranslations {
    return getSearchTranslations(this.language);
  }

  /**
   * Get the default source ID from the client.
   * Falls back to 'openverse' if client is not initialized.
   */
  private getDefaultSource(): string {
    return this.client?.getDefaultSourceId() || 'openverse';
  }

  @state()
  private client: SearchClient | null = null;

  @state()
  private searchParams: SearchParams = {
    page: 1,
  };

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private advancedFiltersExpanded = false;

  @state()
  private accumulatedOers: OerItem[] = [];

  /** Per-source cursor state for "all sources" pagination */
  private allSourcesState?: AllSourcesState;

  private searchGeneration = 0;

  connectedCallback() {
    super.connectedCallback();
    this.initializeClient();
    this.initializeSearchParams();
    this.addEventListener('load-more', this.handleLoadMore);
  }

  private initializeSearchParams(): void {
    this.searchParams = {
      ...this.searchParams,
      pageSize: this.pageSize,
      ...(this.lockedType && { type: this.lockedType }),
      ...(this.lockedSource && { source: this.lockedSource }),
    };
  }

  /**
   * Initialize the search client based on configuration.
   * Uses ClientFactory.create() with the unified sources path.
   * Defaults to openverse + arasaac when no sources are provided.
   */
  private initializeClient(): void {
    this.client = ClientFactory.create({
      apiUrl: this.apiUrl,
      sources: this.sources,
    });

    // Apply translated label for the "All Sources" virtual option
    this.availableSources = this.client
      .getAvailableSources()
      .map((s) => (s.id === SOURCE_ID_ALL ? { ...s, label: this.t.allSourcesLabel } : s));

    // Set the default source if not locked to a specific source
    if (!this.lockedSource) {
      this.searchParams = { ...this.searchParams, source: this.getDefaultSource() };
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('load-more', this.handleLoadMore);
  }

  private handleLoadMore = (event: Event) => {
    event.stopPropagation();
    if (this.loading) return;

    if (this.searchParams.source === SOURCE_ID_ALL) {
      // In all-sources mode, cursors handle pagination (no page increment needed)
      void this.performSearch();
    } else {
      const nextPage = (this.searchParams.page ?? 1) + 1;
      this.searchParams = { ...this.searchParams, page: nextPage };
      void this.performSearch();
    }
  };

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (this.shouldReinitializeClient(changedProperties)) {
      this.initializeClient();
    }

    if (changedProperties.has('pageSize')) {
      this.searchParams = { ...this.searchParams, pageSize: this.pageSize };
    }

    if (changedProperties.has('lockedType')) {
      this.handleLockedTypeChange();
    }

    if (changedProperties.has('lockedSource')) {
      this.handleLockedSourceChange();
    }
  }

  private shouldReinitializeClient(changedProperties: Map<string, unknown>): boolean {
    if (changedProperties.has('apiUrl') || changedProperties.has('sources')) {
      return true;
    }
    return false;
  }

  private handleLockedTypeChange(): void {
    if (this.lockedType) {
      this.searchParams = { ...this.searchParams, type: this.lockedType };
    } else {
      this.removeSearchParam('type');
    }
  }

  private handleLockedSourceChange(): void {
    this.searchParams = {
      ...this.searchParams,
      source: this.lockedSource || this.getDefaultSource(),
    };
  }

  private removeSearchParam(key: keyof SearchParams): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = this.searchParams;
    this.searchParams = rest as SearchParams;
  }

  private async performSearch() {
    if (!this.client) return;

    // Snapshot params and generation before any async work to prevent reactive
    // property changes from altering the page/params between the request and
    // the result handling, and to discard stale responses from concurrent searches.
    const generation = ++this.searchGeneration;
    const params: SearchParams = {
      ...this.searchParams,
      ...(this.allSourcesState && { allSourcesState: this.allSourcesState }),
    };

    this.loading = true;
    this.error = null;
    this.dispatchEvent(new CustomEvent('search-loading', { bubbles: true, composed: true }));

    try {
      const result = await this.client.search(params);

      if (generation !== this.searchGeneration) return;

      // Update all-sources cursor state if present
      this.allSourcesState = result.allSourcesState;

      const isFirstPage =
        params.source === SOURCE_ID_ALL ? !params.allSourcesState : (params.page ?? 1) === 1;

      this.accumulatedOers = isFirstPage ? result.data : [...this.accumulatedOers, ...result.data];

      this.dispatchEvent(
        new CustomEvent<OerSearchResultEvent>('search-results', {
          detail: {
            data: this.accumulatedOers,
            meta: result.meta,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if (generation !== this.searchGeneration) return;

      this.error = err instanceof Error ? err.message : this.t.errorMessage;
      this.dispatchEvent(
        new CustomEvent('search-error', {
          detail: { error: this.error },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      if (generation === this.searchGeneration) {
        this.loading = false;
      }
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.allSourcesState = undefined;
    this.searchParams = { ...this.searchParams, page: 1 };
    void this.performSearch();
  }

  private handleClear() {
    this.allSourcesState = undefined;
    this.searchParams = {
      page: 1,
      pageSize: this.pageSize,
      source: this.lockedSource || this.getDefaultSource(),
      ...(this.lockedType && { type: this.lockedType }),
    };
    this.accumulatedOers = [];
    this.error = null;
    this.dispatchEvent(new CustomEvent('search-cleared', { bubbles: true, composed: true }));
  }

  private handleInputChange(field: keyof SearchParams) {
    return (e: Event) => {
      const value = (e.target as HTMLInputElement).value.trim();
      if (field === 'source') {
        this.allSourcesState = undefined;
      }
      if (value === '') {
        this.removeSearchParam(field);
      } else {
        this.searchParams = { ...this.searchParams, [field]: value };
      }
    };
  }

  private toggleAdvancedFilters() {
    this.advancedFiltersExpanded = !this.advancedFiltersExpanded;
  }

  render() {
    return html`
      <div class="search-wrapper">
        <div class="search-container">
          <h2 class="search-header">${this.t.headerTitle}</h2>
          <form class="search-form" @submit="${this.handleSubmit}">
            <div class="form-group">
              <label for="searchTerm">${this.t.keywordsLabel}</label>
              <input
                id="searchTerm"
                type="text"
                placeholder="${this.t.keywordsPlaceholder}"
                .value="${this.searchParams.searchTerm || ''}"
                @input="${this.handleInputChange('searchTerm')}"
                required
              />
            </div>

            ${this.showTypeFilter && !this.lockedType
              ? html`
                  <div class="form-group">
                    <label for="type">${this.t.typeLabel}</label>
                    <select
                      id="type"
                      .value="${this.searchParams.type || ''}"
                      @change="${this.handleInputChange('type')}"
                    >
                      <option value="">${this.t.anyOptionText}</option>
                      ${RESOURCE_TYPES.map(
                        (type) => html` <option value="${type.value}">${type.label}</option> `,
                      )}
                    </select>
                  </div>
                `
              : ''}

            <button
              type="button"
              class="toggle-filters-button"
              @click="${this.toggleAdvancedFilters}"
            >
              ${this.advancedFiltersExpanded
                ? this.t.advancedFiltersHideText
                : this.t.advancedFiltersShowText}
            </button>

            <div class="advanced-filters ${this.advancedFiltersExpanded ? 'expanded' : ''}">
              <div class="form-row">
                <div class="form-group">
                  <label for="language">${this.t.languageLabel}</label>
                  <select
                    id="language"
                    .value="${this.searchParams.language || ''}"
                    @change="${this.handleInputChange('language')}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${FILTER_LANGUAGES.map(
                      (lang) => html` <option value="${lang.code}">${lang.label}</option> `,
                    )}
                  </select>
                </div>

                <div class="form-group">
                  <label for="license">${this.t.licenseLabel}</label>
                  <select
                    id="license"
                    .value="${this.searchParams.license || ''}"
                    @change="${this.handleInputChange('license')}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${COMMON_LICENSES.map(
                      (license) => html`
                        <option value="${license.uri}">${license.shortName}</option>
                      `,
                    )}
                  </select>
                </div>
              </div>

              ${this.showSourceFilter && !this.lockedSource && this.availableSources.length > 0
                ? html`
                    <div class="form-group">
                      <label for="source">${this.t.sourceLabel}</label>
                      <select
                        id="source"
                        .value="${this.searchParams.source || this.getDefaultSource()}"
                        @change="${this.handleInputChange('source')}"
                      >
                        ${this.availableSources.map(
                          (source) => html` <option value="${source.id}">${source.label}</option> `,
                        )}
                      </select>
                    </div>
                  `
                : ''}
            </div>

            <div class="button-group">
              <button type="submit" class="search-button" ?disabled="${this.loading}">
                ${this.loading ? this.t.searchingText : this.t.searchButtonText}
              </button>
              <button type="button" class="clear-button" @click="${this.handleClear}">
                ${this.t.clearButtonText}
              </button>
            </div>

            ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
          </form>
        </div>
        <div class="slot-container">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-search': OerSearchElement;
  }
}
