// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs', 'vite.config.ts', 'vitest.config.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  lit.configs['flat/recommended'],
  wc.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Lit-specific rules
      'lit/no-invalid-html': 'error',
      'lit/no-useless-template-literals': 'warn',
      'lit/no-legacy-template-syntax': 'error',
      'lit/prefer-static-styles': 'warn',

      // Web Components rules
      // Disabled: LitElement always implements lifecycle callbacks, so guards are unnecessary
      'wc/guard-super-call': 'off',
      'wc/no-closed-shadow-root': 'error',

      // Prettier
      'prettier/prettier': ['error', {
        endOfLine: 'auto',
        singleQuote: true,
        semi: true,
        trailingComma: 'all',
        printWidth: 100,
      }],
    },
  },
  {
    files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
