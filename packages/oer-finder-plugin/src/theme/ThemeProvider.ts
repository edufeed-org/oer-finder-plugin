/**
 * Theme Provider Component
 * Provides theme CSS variables to all child components
 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Theme, ThemeName } from './theme-types.js';
import { getTheme, isThemeName, defaultTheme } from './themes.js';

@customElement('oer-theme-provider')
export class OerThemeProvider extends LitElement {
  /**
   * The theme to use. Can be either:
   * - A theme name string ('default', 'dark') - for HTML attributes
   * - A custom Theme object with name and colors - for JavaScript property assignment
   */
  @property({
    converter: {
      fromAttribute: (value: string | null): ThemeName => {
        if (!value) return 'default';
        // Only accept predefined theme names from HTML attributes
        // For custom themes, use JavaScript: element.theme = { name: '...', colors: {...} }
        if (isThemeName(value)) {
          return value;
        }
        console.warn(
          `Invalid theme name "${value}". Falling back to "default". Valid theme names: 'default', 'dark'`,
        );
        return 'default';
      },
      toAttribute: (value: ThemeName | Theme): string => {
        if (typeof value === 'string') {
          return value;
        }
        // For custom theme objects, return the theme name
        return value.name;
      },
    },
  })
  set theme(value: ThemeName | Theme) {
    const oldValue = this._theme;
    if (isThemeName(value)) {
      this._theme = getTheme(value);
    } else if (typeof value === 'object' && value !== null && 'colors' in value) {
      this._theme = value;
    } else {
      this._theme = defaultTheme;
    }
    this.requestUpdate('theme', oldValue);
  }
  get theme(): Theme {
    return this._theme;
  }

  private _theme: Theme = defaultTheme;

  /**
   * Update CSS variables when theme changes
   * CSS variables are set on the host element so child components can inherit them
   */
  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('theme')) {
      // Set CSS variables on the host element for child components to inherit
      this.style.setProperty('--primary-color', this._theme.colors.primary);
      this.style.setProperty('--primary-hover-color', this._theme.colors.primaryHover);
      this.style.setProperty('--secondary-color', this._theme.colors.secondary);
      this.style.setProperty('--background-card', this._theme.colors.background.card);
      this.style.setProperty('--background-form', this._theme.colors.background.form);
      this.style.setProperty('--text-primary', this._theme.colors.text.primary);
      this.style.setProperty('--text-secondary', this._theme.colors.text.secondary);
      this.style.setProperty('--text-muted', this._theme.colors.text.muted);
    }
  }

  /**
   * Render children in a slot (no shadow DOM styling needed)
   */
  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oer-theme-provider': OerThemeProvider;
  }
}
