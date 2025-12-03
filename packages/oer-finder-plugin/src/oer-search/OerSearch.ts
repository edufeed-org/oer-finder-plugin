import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createOerClient, type OerClient } from '@edufeed-org/oer-finder-api-client';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  getSearchTranslations,
  type SupportedLanguage,
  type OerSearchTranslations,
} from '../translations.js';
import { COMMON_LICENSES, FILTER_LANGUAGES, DEFAULT_SOURCE } from '../constants.js';
import { styles } from './styles.js';
import type { OerPageChangeEvent } from '../pagination/Pagination.js';

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

  @property({ type: String, attribute: 'api-url' })
  apiUrl = 'http://localhost:3000';

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

  @state()
  private client: OerClient | null = null;

  @state()
  private searchParams: SearchParams = {
    page: 1,
    source: DEFAULT_SOURCE,
  };

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private advancedFiltersExpanded = false;

  connectedCallback() {
    super.connectedCallback();
    this.client = createOerClient(this.apiUrl);

    // Initialize search params with page size
    this.searchParams = {
      ...this.searchParams,
      pageSize: this.pageSize,
    };

    // If type is locked, set it in search params
    if (this.lockedType) {
      this.searchParams = {
        ...this.searchParams,
        type: this.lockedType,
      };
    }

    // If source is locked, set it in search params
    if (this.lockedSource) {
      this.searchParams = {
        ...this.searchParams,
        source: this.lockedSource,
      };
    }

    // Listen for page-change events from slotted children (e.g., oer-list with oer-pagination)
    this.addEventListener('page-change', this.handleSlottedPageChange);
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

    // Recreate the client when apiUrl changes
    if (changedProperties.has('apiUrl')) {
      this.client = createOerClient(this.apiUrl);
    }

    // Update pageSize in searchParams when it changes
    if (changedProperties.has('pageSize')) {
      this.searchParams = {
        ...this.searchParams,
        pageSize: this.pageSize,
      };
    }

    // Update type in searchParams when lockedType changes
    if (changedProperties.has('lockedType')) {
      if (this.lockedType) {
        this.searchParams = {
          ...this.searchParams,
          type: this.lockedType,
        };
      } else {
        // Remove type from searchParams if lockedType is cleared
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type: _, ...rest } = this.searchParams;
        this.searchParams = rest as SearchParams;
      }
    }

    // Update source in searchParams when lockedSource changes
    if (changedProperties.has('lockedSource')) {
      if (this.lockedSource) {
        this.searchParams = {
          ...this.searchParams,
          source: this.lockedSource,
        };
      } else {
        // Reset to default source if lockedSource is cleared
        this.searchParams = {
          ...this.searchParams,
          source: DEFAULT_SOURCE,
        };
      }
    }
  }

  private async performSearch() {
    if (!this.client) return;

    this.loading = true;
    this.error = null;

    try {
      const response = await this.client.GET('/api/v1/oer', {
        params: {
          query: this.searchParams,
        },
      });

      if (response.error) {
        const errorMessage = response.error.message
          ? Array.isArray(response.error.message)
            ? response.error.message.join(', ')
            : response.error.message
          : 'Failed to fetch resources';
        throw new Error(errorMessage);
      }

      if (response.data) {
        this.dispatchEvent(
          new CustomEvent<OerSearchResultEvent>('search-results', {
            detail: {
              data: response.data.data,
              meta: response.data.meta,
            },
            bubbles: true,
            composed: true,
          }),
        );
      }
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
      source: this.lockedSource || DEFAULT_SOURCE,
    };

    // Re-apply locked type if set
    if (this.lockedType) {
      this.searchParams = {
        ...this.searchParams,
        type: this.lockedType,
      };
    }

    this.error = null;
    this.dispatchEvent(
      new CustomEvent('search-cleared', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleInputChange(field: keyof SearchParams) {
    return (e: Event) => {
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();

      if (value === '') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = this.searchParams;
        this.searchParams = rest as SearchParams;
      } else {
        this.searchParams = {
          ...this.searchParams,
          [field]: value,
        };
      }
    };
  }

  private handleBooleanChange(field: keyof SearchParams) {
    return (e: Event) => {
      const select = e.target as HTMLSelectElement;
      const value = select.value;

      if (value === '') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = this.searchParams;
        this.searchParams = rest as SearchParams;
      } else {
        this.searchParams = {
          ...this.searchParams,
          [field]: value === 'true',
        };
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
                    <input
                      id="type"
                      type="text"
                      placeholder="${this.t.typePlaceholder}"
                      .value="${this.searchParams.type || ''}"
                      @input="${this.handleInputChange('type')}"
                    />
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

              <div class="form-group">
                <label for="free_for_use">${this.t.freeForUseLabel}</label>
                <select
                  id="free_for_use"
                  .value="${this.searchParams.free_for_use === undefined
                    ? ''
                    : String(this.searchParams.free_for_use)}"
                  @change="${this.handleBooleanChange('free_for_use')}"
                >
                  <option value="">${this.t.anyOptionText}</option>
                  <option value="true">${this.t.yesOptionText}</option>
                  <option value="false">${this.t.noOptionText}</option>
                </select>
              </div>

              ${this.showSourceFilter && !this.lockedSource && this.availableSources.length > 0
                ? html`
                    <div class="form-group">
                      <label for="source">${this.t.sourceLabel}</label>
                      <select
                        id="source"
                        .value="${this.searchParams.source || DEFAULT_SOURCE}"
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
