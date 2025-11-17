import { describe, it, expect } from 'vitest';
import './ThemeProvider.js';
import type { OerThemeProvider } from './ThemeProvider.js';

describe('ThemeProvider', () => {
  it('renders and matches snapshot', async () => {
    const provider = document.createElement('oer-theme-provider') as OerThemeProvider;

    provider.setAttribute('theme', 'default');

    document.body.appendChild(provider);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider.shadowRoot?.innerHTML).toMatchSnapshot();

    document.body.removeChild(provider);
  });
});
