/**
 * Lit Context for theme propagation
 */
import type { Theme } from './theme-types.js';
/**
 * Context key for theme
 * Components consume this context to access the current theme
 */
export declare const themeContext: {
    __context__: Theme;
};
/**
 * Default theme value used when no provider is found
 */
export declare const defaultThemeValue: Theme;
