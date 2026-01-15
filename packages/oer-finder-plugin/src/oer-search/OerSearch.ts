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
import type { OerPageChangeEvent } from '../pagination/Pagination.js';
import { ClientFactory, type SearchClient } from '../clients/index.js';

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
}

export interface SourceOption {
  value: string;
  label: string;
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
   * Nostr relay URL for direct-adapter mode.
   * Only used when api-url is not provided.
   * Enables the Nostr AMB relay adapter.
   */
  @property({ type: String, attribute: 'nostr-relay-url' })
  nostrRelayUrl?: string;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  @property({ type: String, attribute: 'locked-type' })
  lockedType?: string;

  @property({ type: Boolean, attribute: 'show-type-filter' })
  showTypeFilter = true;

  @property({ type: Number, attribute: 'page-size' })
  pageSize = 20;

  @property({ type: Array, attribute: 'available-sources' })
  availableSources: SourceOption[] = [];

  @property({ type: String, attribute: 'locked-source' })
  lockedSource?: string;

  @property({ type: Boolean, attribute: 'show-source-filter' })
  showSourceFilter = true;

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

  connectedCallback() {
    super.connectedCallback();
    this.initializeClient();
    this.initializeSearchParams();
    this.addEventListener('page-change', this.handleSlottedPageChange);
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
   * - If apiUrl is provided: use server-proxy mode (ApiClient)
   * - If apiUrl is not provided: use direct-adapter mode (DirectClient)
   */
  private initializeClient(): void {
    if (this.apiUrl) {
      // Server-proxy mode
      this.client = ClientFactory.createApiClient(this.apiUrl, this.availableSources);
    } else {
      // Direct-adapter mode
      this.client = ClientFactory.createDirectClient({
        openverse: true,
        arasaac: true,
        nostrAmbRelay: this.nostrRelayUrl ? { relayUrl: this.nostrRelayUrl } : undefined,
      });

      // Auto-populate available sources from adapters if not already set
      if (this.availableSources.length === 0) {
        this.availableSources = this.client.getAvailableSources();
      }
    }

    // Set the default source if not locked to a specific source
    if (!this.lockedSource) {
      this.searchParams = { ...this.searchParams, source: this.getDefaultSource() };
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('page-change', this.handleSlottedPageChange);
  }

  private handleSlottedPageChange = (event: Event) => {
    const customEvent = event as CustomEvent<OerPageChangeEvent>;
    // Prevent event from bubbling further - we handle it here
    event.stopPropagation();
    this.searchParams = { ...this.searchParams, page: customEvent.detail.page };
    void this.performSearch();
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
    // Reinitialize when client config changes
    if (changedProperties.has('apiUrl') || changedProperties.has('nostrRelayUrl')) {
      return true;
    }
    // In API mode, reinitialize when available sources change
    if (changedProperties.has('availableSources') && this.apiUrl) {
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

    this.loading = true;
    this.error = null;

    try {
      const result = await this.client.search(this.searchParams);

      this.dispatchEvent(
        new CustomEvent<OerSearchResultEvent>('search-results', {
          detail: {
            data: result.data,
            meta: result.meta,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.t.errorMessage;
      this.dispatchEvent(
        new CustomEvent('search-error', {
          detail: { error: this.error },
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.loading = false;
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.searchParams = { ...this.searchParams, page: 1 };
    void this.performSearch();
  }

  private handleClear() {
    this.searchParams = {
      page: 1,
      pageSize: this.pageSize,
      source: this.lockedSource || this.getDefaultSource(),
      ...(this.lockedType && { type: this.lockedType }),
    };
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

  private handleBooleanChange(field: keyof SearchParams) {
    return (e: Event) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value === '') {
        this.removeSearchParam(field);
      } else {
        this.searchParams = { ...this.searchParams, [field]: value === 'true' };
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
                          (source) => html`
                            <option value="${source.value}">${source.label}</option>
                          `,
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
