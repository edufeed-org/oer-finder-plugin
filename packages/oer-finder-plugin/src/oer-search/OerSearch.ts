import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createOerClient, type OerClient } from '@oer-aggregator/api-client';
import type { components } from '@oer-aggregator/api-client';
import {
  getSearchTranslations,
  type SupportedLanguage,
  type OerSearchTranslations,
} from '../translations.js';
import { COMMON_LICENSES } from '../constants.js';
import { styles } from './styles.js';

type OerItem = components['schemas']['OerItemSchema'];

export interface SearchParams {
  page?: number;
  pageSize?: number;
  type?: string;
  description?: string;
  name?: string;
  keywords?: string;
  license?: string;
  free_for_use?: boolean;
  educational_level?: string;
  language?: string;
  date_created_from?: string;
  date_created_to?: string;
  date_published_from?: string;
  date_published_to?: string;
  date_modified_from?: string;
  date_modified_to?: string;
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

  private get t(): OerSearchTranslations {
    return getSearchTranslations(this.language);
  }

  @state()
  private client: OerClient | null = null;

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

  public handlePageChange(newPage: number) {
    this.searchParams = { ...this.searchParams, page: newPage };
    void this.performSearch();
  }

  render() {
    return html`
      <div class="search-container">
        <h2 class="search-header">${this.t.headerTitle}</h2>
        <form class="search-form" @submit="${this.handleSubmit}">
          <div class="form-group">
            <label for="keywords">${this.t.keywordsLabel}</label>
            <input
              id="keywords"
              type="text"
              placeholder="${this.t.keywordsPlaceholder}"
              .value="${this.searchParams.keywords || ''}"
              @input="${this.handleInputChange('keywords')}"
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
                <label for="name">${this.t.nameLabel}</label>
                <input
                  id="name"
                  type="text"
                  placeholder="${this.t.namePlaceholder}"
                  .value="${this.searchParams.name || ''}"
                  @input="${this.handleInputChange('name')}"
                />
              </div>

              <div class="form-group">
                <label for="language">${this.t.languageLabel}</label>
                <input
                  id="language"
                  type="text"
                  placeholder="${this.t.languagePlaceholder}"
                  maxlength="3"
                  .value="${this.searchParams.language || ''}"
                  @input="${this.handleInputChange('language')}"
                />
              </div>
            </div>

            <div class="form-row">
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
            </div>

            <div class="form-group">
              <label for="description">${this.t.descriptionLabel}</label>
              <input
                id="description"
                type="text"
                placeholder="${this.t.descriptionPlaceholder}"
                .value="${this.searchParams.description || ''}"
                @input="${this.handleInputChange('description')}"
              />
            </div>
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-search': OerSearchElement;
  }
}
