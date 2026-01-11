import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  getCardTranslations,
  type SupportedLanguage,
  type OerCardTranslations,
} from '../translations.js';
import { getLicenseShortName } from '../constants.js';
import { truncateTitle, truncateContent, shortenLabels } from '../utils.js';
import { styles } from './styles.js';

type OerItem = components['schemas']['OerItemSchema'];

export interface OerCardClickEvent {
  oer: OerItem;
}

@customElement('oer-card')
export class OerCardElement extends LitElement {
  static styles = styles;

  @property({ type: Object })
  oer: OerItem | null = null;

  @property({ type: String })
  language: SupportedLanguage = 'en';

  private get t(): OerCardTranslations {
    return getCardTranslations(this.language);
  }

  private handleImageClick() {
    if (this.oer) {
      this.dispatchEvent(
        new CustomEvent<OerCardClickEvent>('card-click', {
          detail: { oer: this.oer },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private getLicenseUrl(
    license: string | Record<string, unknown> | null | undefined,
  ): string | null {
    if (!license) return null;
    if (typeof license === 'string') return license;
    if (typeof license === 'object' && 'id' in license && typeof license.id === 'string') {
      return license.id;
    }
    return null;
  }

  private getLicenseName(license: string | Record<string, unknown> | null | undefined): string {
    const uri = this.getLicenseUrl(license);
    if (!uri) return 'Unknown License';

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

    // Use AMB + extensions structure
    // Fallback to amb.image (thumbnail) if no image proxy URLs available
    const imageUrl = this.oer.extensions?.images?.small ?? this.oer.amb?.image ?? null;
    const title = truncateTitle(this.oer.amb?.name || this.t.untitledMessage);
    const description = this.oer.amb?.description;
    const descriptionStr = typeof description === 'string' ? description : '';
    const truncatedDescription = descriptionStr ? truncateContent(descriptionStr) : '';
    const keywords = this.oer.amb?.keywords || [];
    const processedKeywords = shortenLabels(keywords);
    const licenseUri = this.oer.amb?.license;
    const attribution = this.oer.extensions?.system?.attribution;
    const foreignLandingUrl = this.oer.extensions?.system?.foreignLandingUrl;

    return html`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${imageUrl
            ? html`<img
                class="thumbnail"
                src="${imageUrl}"
                alt="${this.oer.extensions?.fileMetadata?.fileAlt || title}"
                loading="lazy"
              />`
            : html`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">
            ${foreignLandingUrl
              ? html`<a href="${foreignLandingUrl}" target="_blank" rel="noopener noreferrer"
                  >${title}</a
                >`
              : title}
          </h3>
          ${truncatedDescription ? html`<p class="description">${truncatedDescription}</p>` : ''}
          <div class="metadata">
            <div class="license">
              ${this.getLicenseUrl(licenseUri)
                ? html`${this.t.licenseLabel}
                    <a
                      href="${this.getLicenseUrl(licenseUri)}"
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
            ${attribution ? html`<div class="attribution">${attribution}</div>` : ''}
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
