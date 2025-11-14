/**
 * OER Hello World Component
 *
 * A simple Web Component that demonstrates the OER Plugin structure.
 * Built with Lit for CSP compliance and developer ergonomics.
 *
 * Usage:
 * ```html
 * <oer-hello name="World"></oer-hello>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class OerHelloElement extends LitElement {
  @property({ type: String })
  name = 'World';

  static styles = css`
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

    p {
      margin: 0 0 1.5rem 0;
      opacity: 0.95;
      line-height: 1.5;
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
      font-size: 0.875rem;
    }

    .value {
      font-family: monospace;
      margin-top: 0.5rem;
      word-break: break-all;
      font-size: 0.95rem;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>Hello, ${this.name}!</h1>
        <p>This is a Web Component from the OER Finder Plugin.</p>
        <div class="info">
          <div class="label">Component:</div>
          <div class="value">&lt;oer-hello&gt;</div>
        </div>
        <div class="info">
          <div class="label">Version:</div>
          <div class="value">0.0.1</div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
if (!customElements.get('oer-hello')) {
  customElements.define('oer-hello', OerHelloElement);
}
