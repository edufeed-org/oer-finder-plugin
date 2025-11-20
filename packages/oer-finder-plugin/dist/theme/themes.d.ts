/**
 * Predefined themes for OER Finder Plugin
 */
import type { Theme, ThemeName } from './theme-types.js';
/**
 * Default theme - Light mode with purple-blue accent
 */
export declare const defaultTheme: Theme;
/**
 * Dark theme - Dark mode variant
 */
export declare const darkTheme: Theme;
/**
 * Theme registry - maps theme names to theme objects
 */
export declare const themes: Record<ThemeName, Theme>;
/**
 * Get a theme by name
 * @param name - The theme name
 * @returns The requested theme, or default theme if not found
 */
export declare function getTheme(name: ThemeName): Theme;
/**
 * Check if a value is a predefined theme name
 * @param value - Value to check
 * @returns True if the value is a valid theme name
 */
export declare function isThemeName(value: unknown): value is ThemeName;
