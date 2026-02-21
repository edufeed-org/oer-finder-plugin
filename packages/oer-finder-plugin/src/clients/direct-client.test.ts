import { describe, it, expect } from 'vitest';
import { DirectClient } from './direct-client.js';
import type { SourceConfig } from '../types/source-config.js';
import { SOURCE_ID_ALL } from '../constants.js';

describe('DirectClient', () => {
  it('creates adapters from source configs with all option', () => {
    const sources: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const client = new DirectClient(sources);
    const available = client.getAvailableSources();

    expect(available).toEqual([
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ]);
  });

  it('returns default source ID from source configs', () => {
    const sources: SourceConfig[] = [{ id: 'arasaac', label: 'ARASAAC' }];
    const client = new DirectClient(sources);

    expect(client.getDefaultSourceId()).toBe('arasaac');
  });

  it('performs search with source configs', async () => {
    const sources: SourceConfig[] = [{ id: 'openverse', label: 'Openverse' }];
    const client = new DirectClient(sources);
    const result = await client.search({ searchTerm: 'test', page: 1, pageSize: 5 });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
  });

  it('returns selected source ID as default when selected flag is set', () => {
    const sources: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR', selected: true },
    ];
    const client = new DirectClient(sources);

    expect(client.getDefaultSourceId()).toBe('arasaac');
  });
});
