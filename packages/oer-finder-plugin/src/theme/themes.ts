/**
 * Predefined themes for OER Finder Plugin
 */

import type { Theme, ThemeName } from './theme-types.js';

/**
 * Default theme - Light mode with purple-blue accent
 */
export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    // Primary interaction colors (existing colors from components)
    primary: '#667eea',
    primaryHover: '#5568d3',
    secondary: '#764ba2',

    // Background colors
    background: {
      page: '#ffffff',
      card: '#ffffff',
      form: '#f8f9fa',
    },

    // Text colors
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
      muted: '#718096',
    },
  },
};

/**
 * Dark theme - Dark mode variant
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // Primary interaction colors
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    secondary: '#8b5cf6',

    // Background colors
    background: {
      page: '#1a202c',
      card: '#2d3748',
      form: '#374151',
    },

    // Text colors
    text: {
      primary: '#f7fafc',
      secondary: '#e2e8f0',
      muted: '#a0aec0',
    },
  },
};

/**
 * Theme registry - maps theme names to theme objects
 */
export const themes: Record<ThemeName, Theme> = {
  default: defaultTheme,
  dark: darkTheme,
};

/**
 * Get a theme by name
 * @param name - The theme name
 * @returns The requested theme, or default theme if not found
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name] || defaultTheme;
}

/**
 * Check if a value is a predefined theme name
 * @param value - Value to check
 * @returns True if the value is a valid theme name
 */
export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && value in themes;
}
