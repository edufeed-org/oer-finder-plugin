/**
 * OER Hello World Component
 *
 * A simple Web Component that demonstrates the OER Plugin structure
 * and shows connectivity to the API client.
 *
 * Usage:
 * ```html
 * <oer-hello api-url="https://api.example.com"></oer-hello>
 * ```
 */

import { createOerClient } from '@oer-aggregator/api-client';
import type { OerClient } from '@oer-aggregator/api-client';

export class OerHelloElement extends HTMLElement {
  private shadow: ShadowRoot;
  private apiClient: OerClient | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['api-url'];
  }

  connectedCallback(): void {
    this.render();
    this.initializeApiClient();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'api-url' && oldValue !== newValue) {
      this.initializeApiClient();
      this.render();
    }
  }

  private initializeApiClient(): void {
    const apiUrl = this.getAttribute('api-url');
    if (apiUrl) {
      this.apiClient = createOerClient(apiUrl);
    }
  }

  private render(): void {
    const apiUrl = this.getAttribute('api-url') || 'Not configured';

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .container {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 600;
        }

        .info {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .label {
          font-weight: 600;
          opacity: 0.9;
        }

        .value {
          font-family: monospace;
          margin-top: 0.5rem;
          word-break: break-all;
        }

        button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        button:hover {
          transform: translateY(-2px);
        }

        button:active {
          transform: translateY(0);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          min-height: 1.5rem;
        }

        .status.success {
          background: rgba(72, 187, 120, 0.3);
        }

        .status.error {
          background: rgba(245, 101, 101, 0.3);
        }

        .oer-list {
          margin-top: 1rem;
          display: none;
        }

        .oer-list.visible {
          display: block;
        }

        .oer-item {
          background: rgba(255, 255, 255, 0.95);
          color: #2d3748;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .oer-item:last-child {
          margin-bottom: 0;
        }

        .oer-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin: 0 0 0.5rem 0;
          color: #667eea;
        }

        .oer-description {
          color: #4a5568;
          margin: 0.5rem 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .oer-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.75rem;
          font-size: 0.85rem;
        }

        .oer-meta-item {
          background: #edf2f7;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: #4a5568;
        }

        .oer-meta-label {
          font-weight: 600;
          margin-right: 0.25rem;
        }

        .oer-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .oer-keyword {
          background: #bee3f8;
          color: #2c5282;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .oer-url {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .oer-url:hover {
          text-decoration: underline;
        }
      </style>

      <div class="container">
        <h1>🎓 Hello from OER Plugin!</h1>
        <p>This is a Web Component built with TypeScript and packaged as an NPM module.</p>

        <div class="info">
          <div class="label">API Endpoint:</div>
          <div class="value">${apiUrl}</div>
        </div>

        <div class="info">
          <div class="label">Plugin Version:</div>
          <div class="value">0.0.1</div>
        </div>

        ${this.apiClient ? `
          <button id="load-button">Load 10 OER Examples</button>
          <div id="status" class="status"></div>
          <div id="oer-list" class="oer-list"></div>
        ` : `
          <p style="margin-top: 1rem; opacity: 0.9;">
            💡 Tip: Add an <code>api-url</code> attribute to enable OER loading
          </p>
        `}
      </div>
    `;

    if (this.apiClient) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    const button = this.shadow.getElementById('load-button');
    const status = this.shadow.getElementById('status');
    const oerList = this.shadow.getElementById('oer-list');

    if (button && status && oerList) {
      button.addEventListener('click', async () => {
        button.setAttribute('disabled', 'true');
        status.textContent = '⏳ Loading OER resources...';
        status.className = 'status';
        oerList.innerHTML = '';
        oerList.classList.remove('visible');

        try {
          // Fetch 10 OER items without filters
          const { data: oerData, error: oerError } = await this.apiClient!.GET('/api/v1/oer', {
            params: {
              query: {
                page: 1,
                pageSize: 10,
              },
            },
          });

          if (oerError) {
            throw new Error(`Failed to fetch OER: ${JSON.stringify(oerError)}`);
          }

          if (!oerData || !oerData.data || oerData.data.length === 0) {
            status.textContent = '📚 No OER resources found';
            status.className = 'status';
            return;
          }

          status.textContent = `✅ Loaded ${oerData.data.length} OER resources (${oerData.meta.total} total available)`;
          status.className = 'status success';

          // Render OER items
          oerList.innerHTML = oerData.data.map((item, index) => {
            const metadata = item.amb_metadata as { name?: string; type?: string; inLanguage?: string[] } | null;
            const title = metadata?.name || `OER Resource #${index + 1}`;
            const description = item.amb_description as string | null;
            const keywords = item.amb_keywords;
            const url = item.url as string | null;
            const mimeType = item.file_mime_type as string | null;
            const license = item.amb_license_uri as string | null;
            const resourceType = metadata?.type;
            const language = metadata?.inLanguage?.[0];

            return `
              <div class="oer-item">
                <h3 class="oer-title">${this.escapeHtml(title)}</h3>
                ${description ? `<p class="oer-description">${this.escapeHtml(description)}</p>` : ''}
                ${url ? `<a class="oer-url" href="${this.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View Resource →</a>` : ''}
                <div class="oer-meta">
                  ${resourceType ? `<span class="oer-meta-item"><span class="oer-meta-label">Type:</span>${this.escapeHtml(resourceType)}</span>` : ''}
                  ${mimeType ? `<span class="oer-meta-item"><span class="oer-meta-label">Format:</span>${this.escapeHtml(mimeType)}</span>` : ''}
                  ${language ? `<span class="oer-meta-item"><span class="oer-meta-label">Language:</span>${this.escapeHtml(language)}</span>` : ''}
                  ${license ? `<span class="oer-meta-item"><span class="oer-meta-label">License:</span>${this.extractLicenseName(license)}</span>` : ''}
                </div>
                ${keywords && keywords.length > 0 ? `
                  <div class="oer-keywords">
                    ${keywords.map(keyword => `<span class="oer-keyword">${this.escapeHtml(keyword)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');

          oerList.classList.add('visible');
        } catch (error) {
          status.textContent = `❌ Failed to load OER resources: ${error instanceof Error ? error.message : 'Unknown error'}`;
          status.className = 'status error';
        } finally {
          button.removeAttribute('disabled');
        }
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private extractLicenseName(licenseUri: string): string {
    // Extract a human-readable name from the license URI
    const match = licenseUri.match(/\/licenses\/([\w-]+)/);
    return match ? match[1].toUpperCase() : 'View License';
  }
}

// Register the custom element
if (!customElements.get('oer-hello')) {
  customElements.define('oer-hello', OerHelloElement);
}
