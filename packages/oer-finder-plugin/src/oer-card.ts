import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@oer-aggregator/api-client';
import {
  getCardTranslations,
  type SupportedLanguage,
  type OerCardTranslations,
} from './translations.js';

type OerItem = components['schemas']['OerItemSchema'];

@customElement('oer-card')
export class OerCardElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      --primary-color: #667eea;
      --secondary-color: #764ba2;
    }

    .card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .thumbnail-container {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: #f5f5f5;
      position: relative;
      cursor: pointer;
    }

    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }

    .thumbnail-container:hover .thumbnail {
      transform: scale(1.05);
    }

    .placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white;
      font-size: 48px;
    }

    .content {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .description {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px 0;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      flex: 1;
    }

    .metadata {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
    }

    .license {
      font-size: 12px;
      color: #666;
    }

    .license a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .license a:hover {
      text-decoration: underline;
    }

    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .keyword {
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      color: #555;
    }

    .no-data {
      color: #999;
      font-style: italic;
      font-size: 12px;
    }
  `;

  @property({ type: Object })
  oer: OerItem | null = null;

  @property({ type: Function })
  onImageClick: ((oer: OerItem) => void) | null = null;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  @property({ type: String, attribute: 'primary-color' })
  primaryColor = '#667eea';

  @property({ type: String, attribute: 'secondary-color' })
  secondaryColor = '#764ba2';

  private get t(): OerCardTranslations {
    return getCardTranslations(this.language);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('primaryColor')) {
      this.style.setProperty('--primary-color', this.primaryColor);
    }
    if (changedProperties.has('secondaryColor')) {
      this.style.setProperty('--secondary-color', this.secondaryColor);
    }
  }

  private handleImageClick() {
    if (this.oer && this.onImageClick) {
      this.onImageClick(this.oer);
    }
  }

  private getLicenseName(licenseUri: string | Record<string, unknown> | null | undefined): string {
    if (!licenseUri) return 'Unknown License';

    const uri = typeof licenseUri === 'string' ? licenseUri : JSON.stringify(licenseUri);

    // Common Creative Commons licenses
    if (uri.includes('creativecommons.org')) {
      if (uri.includes('/by-sa/')) return 'CC BY-SA';
      if (uri.includes('/by-nd/')) return 'CC BY-ND';
      if (uri.includes('/by-nc/')) return 'CC BY-NC';
      if (uri.includes('/by-nc-sa/')) return 'CC BY-NC-SA';
      if (uri.includes('/by-nc-nd/')) return 'CC BY-NC-ND';
      if (uri.includes('/by/')) return 'CC BY';
      if (uri.includes('/zero/')) return 'CC0';
      return 'Creative Commons';
    }

    return 'License';
  }

  render() {
    if (!this.oer) {
      return html`
        <div class="card">
          <div class="content">
            <p class="no-data">${this.t.noDataMessage}</p>
          </div>
        </div>
      `;
    }

    const imageUrl = this.oer.amb_metadata?.image;
    const title = this.oer.amb_metadata?.name || this.t.untitledMessage;
    const description = this.oer.amb_metadata?.description || this.oer.amb_description;
    const keywords = this.oer.amb_keywords || this.oer.amb_metadata?.keywords || [];
    const licenseUri = this.oer.amb_license_uri || this.oer.amb_metadata?.license;

    return html`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${imageUrl
            ? html`<img
                class="thumbnail"
                src="${imageUrl}"
                alt="${this.oer.file_alt || title}"
                loading="lazy"
              />`
            : html`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">${title}</h3>
          ${description
            ? html`<p class="description">${description}</p>`
            : ''}
          <div class="metadata">
            <div class="license">
              ${licenseUri
                ? html`${this.t.licenseLabel}
                    <a
                      href="${typeof licenseUri === 'string' ? licenseUri : String(licenseUri)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${this.getLicenseName(licenseUri)}</a
                    >`
                : html`<span class="no-data">${this.t.noLicenseMessage}</span>`}
            </div>
            ${keywords && keywords.length > 0
              ? html`
                  <div class="keywords">
                    ${keywords.slice(0, 5).map(
                      (keyword) => html`<span class="keyword">${keyword}</span>`
                    )}
                  </div>
                `
              : ''}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-card': OerCardElement;
  }
}
