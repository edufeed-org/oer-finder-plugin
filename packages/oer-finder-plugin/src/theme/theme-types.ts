/**
 * Theme system type definitions for OER Finder Plugin
 */

/**
 * Complete color palette for the theme
 */
export interface ThemeColors {
  // Primary interaction colors
  primary: string;
  primaryHover: string;
  secondary: string;

  // Background colors
  background: {
    page: string;
    card: string;
    form: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
}

/**
 * Complete theme definition including name and colors
 */
export interface Theme {
  name: string;
  colors: ThemeColors;
}

/**
 * Available predefined theme names
 */
export type ThemeName = 'default' | 'dark';
