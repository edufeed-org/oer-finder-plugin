import { describe, it, expect } from 'vitest';
import { DirectClient } from './direct-client.js';
import type { SourceConfig } from '../types/source-config.js';

describe('DirectClient', () => {
  it('returns available sources from adapter manager', () => {
    const sources: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const client = new DirectClient(sources);
    const available = client.getAvailableSources();

    expect(available).toEqual([
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ]);
  });

  it('throws when source is not provided', async () => {
    const sources: SourceConfig[] = [{ id: 'openverse', label: 'OV' }];
    const client = new DirectClient(sources);

    await expect(client.search({ searchTerm: 'test' })).rejects.toThrow(
      'source is required for direct searches',
    );
  });

  it('performs search and returns data with meta', async () => {
    const sources: SourceConfig[] = [{ id: 'openverse', label: 'Openverse' }];
    const client = new DirectClient(sources);
    const result = await client.search({
      source: 'openverse',
      searchTerm: 'test',
      page: 1,
      pageSize: 5,
    });

    expect(result).toMatchObject({
      data: expect.any(Array),
      meta: { page: 1, pageSize: 5 },
    });
  });
});
