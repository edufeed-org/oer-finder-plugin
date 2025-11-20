/**
 * Theme Provider Component
 * Provides theme CSS variables to all child components
 */
import { LitElement } from 'lit';
import type { Theme, ThemeName } from './theme-types.js';
export declare class OerThemeProvider extends LitElement {
    /**
     * The theme to use. Can be either:
     * - A theme name string ('default', 'dark') - for HTML attributes
     * - A custom Theme object with name and colors - for JavaScript property assignment
     */
    set theme(value: ThemeName | Theme);
    get theme(): Theme;
    private _theme;
    /**
     * Update CSS variables when theme changes
     * CSS variables are set on the host element so child components can inherit them
     */
    updated(changedProperties: Map<string, unknown>): void;
    /**
     * Render children in a slot (no shadow DOM styling needed)
     */
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-theme-provider': OerThemeProvider;
    }
}
