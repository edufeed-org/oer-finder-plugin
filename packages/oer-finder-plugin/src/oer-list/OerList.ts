import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@oer-aggregator/api-client';
import '../oer-card/OerCard.js';
import '../pagination/Pagination.js';
import {
  getListTranslations,
  type SupportedLanguage,
  type OerListTranslations,
} from '../translations.js';
import { styles } from './styles.js';

type OerItem = components['schemas']['OerItemSchema'];

@customElement('oer-list')
export class OerListElement extends LitElement {
  static styles = styles;

  @property({ type: Array })
  oers: OerItem[] = [];

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  error: string | null = null;

  @property({ type: Function })
  onCardClick: ((oer: OerItem) => void) | null = null;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  @property({ type: Boolean })
  showPagination = false;

  @property({ type: Object })
  metadata: components['schemas']['OerMetadataSchema'] | null = null;

  @property({ type: Function })
  onPageChange: ((page: number) => void) | null = null;

  private get t(): OerListTranslations {
    return getListTranslations(this.language);
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>${this.t.loadingMessage}</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error">
          <div class="error-icon">⚠️</div>
          <p class="error-message">${this.error}</p>
        </div>
      `;
    }

    if (!this.oers || this.oers.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">${this.t.emptyTitle}</h3>
          <p class="empty-message">${this.t.emptyMessage}</p>
        </div>
      `;
    }

    return html`
      <div class="list-container">
        <div class="grid">
          ${this.oers.map(
            (oer) => html`
              <oer-card
                .oer="${oer}"
                .onImageClick="${this.onCardClick}"
                .language="${this.language}"
              ></oer-card>
            `,
          )}
        </div>
      </div>
      ${this.showPagination && this.metadata
        ? html`
            <oer-pagination
              .metadata="${this.metadata}"
              .loading="${this.loading}"
              .onPageChange="${this.onPageChange}"
              .language="${this.language}"
            ></oer-pagination>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-list': OerListElement;
  }
}
