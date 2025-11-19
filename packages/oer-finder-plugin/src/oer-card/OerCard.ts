import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@oer-aggregator/api-client';
import {
  getCardTranslations,
  type SupportedLanguage,
  type OerCardTranslations,
} from '../translations.js';
import { getLicenseShortName } from '../constants.js';
import { truncateTitle, truncateContent, shortenLabels } from '../utils.js';
import { styles } from './styles.js';

type OerItem = components['schemas']['OerItemSchema'];

@customElement('oer-card')
export class OerCardElement extends LitElement {
  static styles = styles;

  @property({ type: Object })
  oer: OerItem | null = null;

  @property({ type: Function })
  onImageClick: ((oer: OerItem) => void) | null = null;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  private get t(): OerCardTranslations {
    return getCardTranslations(this.language);
  }

  private handleImageClick() {
    if (this.oer && this.onImageClick) {
      this.onImageClick(this.oer);
    }
  }

  private getLicenseName(licenseUri: string | Record<string, unknown> | null | undefined): string {
    if (!licenseUri) return 'Unknown License';

    const uri = typeof licenseUri === 'string' ? licenseUri : JSON.stringify(licenseUri);

    // Try to get short name from constants
    const shortName = getLicenseShortName(uri);
    if (shortName) return shortName;

    // Fallback for unknown licenses
    if (uri.includes('creativecommons.org')) {
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
    const title = truncateTitle(this.oer.amb_metadata?.name || this.t.untitledMessage);
    const description = this.oer.amb_metadata?.description || this.oer.amb_description;
    const descriptionStr = typeof description === 'string' ? description : '';
    const truncatedDescription = descriptionStr ? truncateContent(descriptionStr) : '';
    const keywords = this.oer.amb_keywords || this.oer.amb_metadata?.keywords || [];
    const processedKeywords = shortenLabels(keywords);
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
          ${truncatedDescription ? html`<p class="description">${truncatedDescription}</p>` : ''}
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
            ${processedKeywords && processedKeywords.length > 0
              ? html`
                  <div class="keywords">
                    ${processedKeywords.map(
                      (keyword) => html`<span class="keyword">${keyword}</span>`,
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
