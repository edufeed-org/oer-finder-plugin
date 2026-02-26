import { describe, it, expect, beforeEach } from 'vitest';
import { DirectClient } from './direct-client.js';
import { registerAdapter, clearAdapterRegistry } from '../adapters/adapter-registry.js';
import type { SourceConfig } from '../types/source-config.js';
import type { SourceAdapter } from '@edufeed-org/oer-adapter-core';

function createMockAdapter(sourceId: string): SourceAdapter {
  return {
    sourceId,
    sourceName: sourceId,
    capabilities: {
      supportsLicenseFilter: false,
      supportsEducationalLevelFilter: false,
    },
    search: async () => ({ items: [], total: 0 }),
  };
}

describe('DirectClient', () => {
  beforeEach(() => {
    clearAdapterRegistry();
    registerAdapter('openverse', () => createMockAdapter('openverse'));
    registerAdapter('arasaac', () => createMockAdapter('arasaac'));
  });

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

  it('does not initialize AdapterManager until first use', () => {
    const sources: SourceConfig[] = [{ id: 'openverse', label: 'OV' }];

    // Clear registry after construction — if eager, adapters would already be created
    const client = new DirectClient(sources);
    clearAdapterRegistry();

    // Re-register before first use
    registerAdapter('openverse', () => createMockAdapter('openverse'));
    const available = client.getAvailableSources();

    expect(available).toEqual([{ id: 'openverse', label: 'OV' }]);
  });
});
