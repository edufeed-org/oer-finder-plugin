import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  getLoadMoreTranslations,
  type SupportedLanguage,
  type LoadMoreTranslations,
} from '../translations.js';
import { styles } from './styles.js';

@customElement('oer-load-more')
export class LoadMoreElement extends LitElement {
  static styles = styles;

  @property({ type: Object })
  metadata: components['schemas']['OerMetadataSchema'] | null = null;

  @property({ type: Number, attribute: 'shown-count' })
  shownCount = 0;

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  private get t(): LoadMoreTranslations {
    return getLoadMoreTranslations(this.language);
  }

  private get hasMore(): boolean {
    if (!this.metadata) return false;
    return this.metadata.page < this.metadata.totalPages;
  }

  render() {
    if (!this.metadata || this.metadata.total === 0) {
      return '';
    }

    const displayCount =
      this.shownCount > 0 ? this.shownCount : this.metadata.pageSize * this.metadata.page;
    const shown = Math.min(displayCount, this.metadata.total);

    return html`
      <div class="load-more-container">
        <div class="load-more-info">
          ${this.t.showingText} ${shown} ${this.t.ofText} ${this.metadata.total}
          ${this.t.resourcesText}
        </div>
        ${this.hasMore
          ? html`
              <button
                type="button"
                class="load-more-button"
                ?disabled="${this.loading}"
                @click="${this.handleLoadMore}"
              >
                ${this.loading ? this.t.loadingText : this.t.loadMoreButtonText}
              </button>
            `
          : html`<div class="all-loaded">${this.t.allLoadedText}</div>`}
      </div>
    `;
  }

  private handleLoadMore() {
    if (this.loading) return;
    this.dispatchEvent(
      new CustomEvent('load-more', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-load-more': LoadMoreElement;
  }
}
