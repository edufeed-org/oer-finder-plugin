import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@oer-aggregator/api-client';
import './oer-card.js';
import {
  getListTranslations,
  type SupportedLanguage,
  type OerListTranslations,
} from './translations.js';

type OerItem = components['schemas']['OerItemSchema'];

@customElement('oer-list')
export class OerListElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      --primary-color: #667eea;
    }

    .list-container {
      width: 100%;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }

    .empty-message {
      font-size: 14px;
      margin: 0;
      color: #666;
    }

    .loading {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .loading-spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .error {
      text-align: center;
      padding: 48px 24px;
      color: #d32f2f;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-message {
      font-size: 14px;
      margin: 0;
    }
  `;

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

  @property({ type: String, attribute: 'primary-color' })
  primaryColor = '#667eea';

  @property({ type: String, attribute: 'secondary-color' })
  secondaryColor = '#764ba2';

  private get t(): OerListTranslations {
    return getListTranslations(this.language);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('primaryColor')) {
      this.style.setProperty('--primary-color', this.primaryColor);
    }
    if (changedProperties.has('secondaryColor')) {
      this.style.setProperty('--secondary-color', this.secondaryColor);
    }
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
                .primaryColor="${this.primaryColor}"
                .secondaryColor="${this.secondaryColor}"
              ></oer-card>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-list': OerListElement;
  }
}
