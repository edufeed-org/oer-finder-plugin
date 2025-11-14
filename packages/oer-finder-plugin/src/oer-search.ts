import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createOerClient, type OerClient } from '@oer-aggregator/api-client';
import type { components } from '@oer-aggregator/api-client';
import {
  getSearchTranslations,
  type SupportedLanguage,
  type OerSearchTranslations,
} from './translations.js';

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
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      --primary-color: #667eea;
      --primary-hover-color: #5568d3;
    }

    .search-container {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .search-header {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .search-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
    }

    input,
    select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .search-input {
      width: 100%;
    }

    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .search-button {
      background: var(--primary-color);
      color: white;
      flex: 1;
    }

    .search-button:hover:not(:disabled) {
      background: var(--primary-hover-color);
    }

    .search-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .clear-button {
      background: #f5f5f5;
      color: #666;
      flex: 0 0 auto;
    }

    .clear-button:hover {
      background: #e0e0e0;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-top: 24px;
    }

    .pagination-info {
      font-size: 14px;
      color: #666;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .page-button {
      padding: 8px 12px;
      background: #f5f5f5;
      color: #333;
      min-width: 40px;
    }

    .page-button:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .page-button:disabled {
      background: #f5f5f5;
      color: #ccc;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: #666;
      margin: 0 8px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 12px;
      font-size: 14px;
    }
  `;

  @property({ type: String })
  apiUrl = 'http://localhost:3000';

  @property({ type: Boolean })
  showPagination = true;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  @property({ type: String, attribute: 'primary-color' })
  primaryColor = '#667eea';

  @property({ type: String, attribute: 'primary-hover-color' })
  primaryHoverColor = '#5568d3';

  private get t(): OerSearchTranslations {
    return getSearchTranslations(this.language);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('primaryColor')) {
      this.style.setProperty('--primary-color', this.primaryColor);
    }
    if (changedProperties.has('primaryHoverColor')) {
      this.style.setProperty('--primary-hover-color', this.primaryHoverColor);
    }
  }

  @state()
  private client: OerClient | null = null;

  @state()
  private searchParams: SearchParams = {
    page: 1,
    pageSize: 20,
  };

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private metadata: components['schemas']['OerMetadataSchema'] | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.client = createOerClient(this.apiUrl);
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
        this.metadata = response.data.meta;
        this.dispatchEvent(
          new CustomEvent<OerSearchResultEvent>('search-results', {
            detail: {
              data: response.data.data,
              meta: response.data.meta,
            },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred';
      this.dispatchEvent(
        new CustomEvent('search-error', {
          detail: { error: this.error },
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this.loading = false;
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.searchParams = { ...this.searchParams, page: 1 };
    this.performSearch();
  }

  private handleClear() {
    this.searchParams = {
      page: 1,
      pageSize: 20,
    };
    this.error = null;
    this.metadata = null;
    this.dispatchEvent(
      new CustomEvent('search-cleared', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleInputChange(field: keyof SearchParams) {
    return (e: Event) => {
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();

      if (value === '') {
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

  private handlePageChange(newPage: number) {
    this.searchParams = { ...this.searchParams, page: newPage };
    this.performSearch();
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
              class="search-input"
              placeholder="${this.t.keywordsPlaceholder}"
              .value="${this.searchParams.keywords || ''}"
              @input="${this.handleInputChange('keywords')}"
            />
          </div>

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
              <input
                id="license"
                type="text"
                placeholder="${this.t.licensePlaceholder}"
                .value="${this.searchParams.license || ''}"
                @input="${this.handleInputChange('license')}"
              />
            </div>

            <div class="form-group">
              <label for="free_for_use">${this.t.freeForUseLabel}</label>
              <select
                id="free_for_use"
                .value="${this.searchParams.free_for_use === undefined ? '' : String(this.searchParams.free_for_use)}"
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

          <div class="button-group">
            <button
              type="submit"
              class="search-button"
              ?disabled="${this.loading}"
            >
              ${this.loading ? this.t.searchingText : this.t.searchButtonText}
            </button>
            <button
              type="button"
              class="clear-button"
              @click="${this.handleClear}"
            >
              ${this.t.clearButtonText}
            </button>
          </div>

          ${this.error
            ? html`<div class="error-message">${this.error}</div>`
            : ''}
        </form>
      </div>

      ${this.showPagination && this.metadata
        ? html`
            <div class="pagination">
              <div class="pagination-info">
                Showing ${this.metadata.page} of ${this.metadata.totalPages}
                pages (${this.metadata.total} total resources)
              </div>
              <div class="pagination-controls">
                <button
                  class="page-button"
                  ?disabled="${this.metadata.page === 1 || this.loading}"
                  @click="${() => this.handlePageChange(1)}"
                >
                  ${this.t.firstButtonText}
                </button>
                <button
                  class="page-button"
                  ?disabled="${this.metadata.page === 1 || this.loading}"
                  @click="${() => this.handlePageChange(this.metadata!.page - 1)}"
                >
                  ${this.t.previousButtonText}
                </button>
                <span class="page-info"
                  >Page ${this.metadata.page} of
                  ${this.metadata.totalPages}</span
                >
                <button
                  class="page-button"
                  ?disabled="${this.metadata.page === this.metadata.totalPages || this.loading}"
                  @click="${() => this.handlePageChange(this.metadata!.page + 1)}"
                >
                  ${this.t.nextButtonText}
                </button>
                <button
                  class="page-button"
                  ?disabled="${this.metadata.page === this.metadata.totalPages || this.loading}"
                  @click="${() => this.handlePageChange(this.metadata!.totalPages)}"
                >
                  ${this.t.lastButtonText}
                </button>
              </div>
            </div>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-search': OerSearchElement;
  }
}
