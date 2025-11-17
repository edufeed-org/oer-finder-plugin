/**
 * Lit Context for theme propagation
 */

import { createContext } from '@lit/context';
import type { Theme } from './theme-types.js';
import { defaultTheme } from './themes.js';

/**
 * Context key for theme
 * Components consume this context to access the current theme
 */
export const themeContext = createContext<Theme>('oer-theme');

/**
 * Default theme value used when no provider is found
 */
export const defaultThemeValue = defaultTheme;
