import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  getSearchTranslations,
  type SupportedLanguage,
  type OerSearchTranslations,
} from '../translations.js';
import { COMMON_LICENSES, FILTER_LANGUAGES, RESOURCE_TYPES } from '../constants.js';
import { styles } from './styles.js';
import { ClientFactory, type SearchClient } from '../clients/index.js';
import type { SourceConfig } from '../types/source-config.js';
import { PaginationController } from './pagination-controller.js';
import type { FetchPageFn } from '../pagination/types.js';
import type { LoadMoreMeta } from '../load-more/LoadMore.js';

type OerItem = components['schemas']['OerItemSchema'];

export interface SearchParams {
  page?: number;
  pageSize?: number;
  /** Source ID for single-source search. Set by the pagination layer, not by the UI. */
  source?: string;
  type?: string;
  searchTerm?: string;
  license?: string;
  educational_level?: string;
  language?: string;
}

export interface SourceOption {
  id: string;
  label: string;
  selected?: boolean;
}

export interface OerSearchResultEvent {
  data: OerItem[];
  meta: LoadMoreMeta;
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
   * Internal list of available sources for the checkbox UI.
   * Derived from `sources` or from the client's adapter manager.
   */
  @state()
  private availableSources: SourceOption[] = [];

  /** Currently selected source IDs (checked checkboxes). */
  @state()
  private selectedSources: string[] = [];

  private get t(): OerSearchTranslations {
    return getSearchTranslations(this.language);
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

  /** Manages pagination state across selected sources */
  private paginationController = new PaginationController();

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

    this.availableSources = this.client.getAvailableSources();

    // Initialize selected sources: all checked by default, or locked to a single source
    if (this.lockedSource && this.availableSources.some((s) => s.id === this.lockedSource)) {
      this.selectedSources = [this.lockedSource];
    } else {
      this.selectedSources = this.availableSources.map((s) => s.id);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('load-more', this.handleLoadMore);
  }

  private handleLoadMore = (event: Event) => {
    event.stopPropagation();
    if (this.loading) return;

    // Set loading synchronously before any async work to prevent
    // duplicate requests from rapid clicks in the race window.
    this.loading = true;

    void this.performLoadMore();
  };

  protected willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);

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
    if (this.lockedSource && this.availableSources.some((s) => s.id === this.lockedSource)) {
      this.selectedSources = [this.lockedSource];
    } else {
      this.selectedSources = this.availableSources.map((s) => s.id);
    }
  }

  private removeSearchParam(key: keyof SearchParams): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = this.searchParams;
    this.searchParams = rest as SearchParams;
  }

  /**
   * Configure the PaginationController with a FetchPageFn that calls
   * client.search() for individual sources using current filter params.
   */
  private configurePaginationController(sourceIds: string[]): void {
    if (!this.client) return;

    const client = this.client;
    const params = { ...this.searchParams };

    const fetchPage: FetchPageFn = async (sourceId, page, pageSize, signal) => {
      const result = await client.search(
        {
          ...params,
          source: sourceId,
          page,
          pageSize,
        },
        signal,
      );
      return {
        items: [...result.data],
        total: result.meta.total,
        totalPages: result.meta.totalPages,
        page: result.meta.page,
      };
    };

    this.paginationController.configure({
      sourceIds,
      fetchPage,
      pageSize: this.pageSize,
    });
  }

  /**
   * Perform a search across the selected sources using PaginationController.
   */
  private async performSearch() {
    if (!this.client) return;

    const generation = ++this.searchGeneration;

    this.loading = true;
    this.error = null;
    this.dispatchEvent(new CustomEvent('search-loading', { bubbles: true, composed: true }));

    try {
      this.configurePaginationController(this.selectedSources);
      const result = await this.paginationController.loadFirst();

      if (generation !== this.searchGeneration) return;

      this.accumulatedOers = [...result.items];

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

  /**
   * Load more results using PaginationController.
   */
  private async performLoadMore() {
    const generation = ++this.searchGeneration;

    this.loading = true;
    this.error = null;
    this.dispatchEvent(new CustomEvent('search-loading', { bubbles: true, composed: true }));

    try {
      const result = await this.paginationController.loadNext();

      if (generation !== this.searchGeneration) return;

      this.accumulatedOers = [...this.accumulatedOers, ...result.items];

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

    if (this.selectedSources.length === 0) {
      return;
    }

    this.searchParams = { ...this.searchParams, page: 1 };
    void this.performSearch();
  }

  private handleClear() {
    this.paginationController.reset();
    this.selectedSources = this.lockedSource
      ? [this.lockedSource]
      : this.availableSources.map((s) => s.id);
    this.searchParams = {
      page: 1,
      pageSize: this.pageSize,
      ...(this.lockedType && { type: this.lockedType }),
    };
    this.accumulatedOers = [];
    this.error = null;
    this.dispatchEvent(new CustomEvent('search-cleared', { bubbles: true, composed: true }));
  }

  private handleInputChange(field: keyof SearchParams) {
    return (e: Event) => {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value === '') {
        this.removeSearchParam(field);
      } else {
        this.searchParams = { ...this.searchParams, [field]: value };
      }
    };
  }

  private handleSourceToggle(sourceId: string) {
    const isSelected = this.selectedSources.includes(sourceId);

    // Prevent deselecting the last source
    if (isSelected && this.selectedSources.length === 1) {
      return;
    }

    this.selectedSources = isSelected
      ? this.selectedSources.filter((id) => id !== sourceId)
      : [...this.selectedSources, sourceId];

    this.paginationController.reset();
    this.accumulatedOers = [];
    this.error = null;
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
                      <label>${this.t.sourceLabel}</label>
                      <div class="checkbox-group">
                        ${this.availableSources.map(
                          (source) => html`
                            <label class="checkbox-label">
                              <input
                                type="checkbox"
                                .checked="${this.selectedSources.includes(source.id)}"
                                @change="${() => this.handleSourceToggle(source.id)}"
                              />
                              ${source.label}
                            </label>
                          `,
                        )}
                      </div>
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
