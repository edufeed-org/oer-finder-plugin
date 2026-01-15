import { describe, it, expect } from 'vitest';
import { DirectClient } from './direct-client.js';

describe('DirectClient', () => {
  it('returns available sources from adapter manager', () => {
    const client = new DirectClient();
    const sources = client.getAvailableSources();

    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0]).toHaveProperty('value');
  });

  it('returns search results with data and meta properties', async () => {
    const client = new DirectClient();
    const result = await client.search({ searchTerm: 'test', page: 1, pageSize: 5 });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
  });
});
