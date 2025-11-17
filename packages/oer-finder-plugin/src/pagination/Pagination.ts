import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@oer-aggregator/api-client';
import {
  getPaginationTranslations,
  type SupportedLanguage,
  type PaginationTranslations,
} from '../translations.js';
import { styles } from './styles.js';

@customElement('oer-pagination')
export class PaginationElement extends LitElement {
  static styles = styles;

  @property({ type: Object })
  metadata: components['schemas']['OerMetadataSchema'] | null = null;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Function })
  onPageChange: ((page: number) => void) | null = null;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  private get t(): PaginationTranslations {
    return getPaginationTranslations(this.language);
  }

  render() {
    if (!this.metadata) {
      return '';
    }

    return html`
      <div class="pagination">
        <div class="pagination-info">
          ${this.t.showingPagesText} ${this.t.pageOfText.toLowerCase()} ${this.metadata.page} ${this.t.ofText} ${this.metadata.totalPages}
          (${this.metadata.total} ${this.t.totalResourcesText})
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
            >${this.t.pageOfText} ${this.metadata.page} ${this.t.ofText}
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
    `;
  }

  private handlePageChange(newPage: number) {
    if (this.onPageChange) {
      this.onPageChange(newPage);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-pagination': PaginationElement;
  }
}
