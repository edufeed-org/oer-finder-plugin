import { describe, it, expect } from 'vitest';
import { ClientFactory } from './client-factory.js';
import { ApiClient } from './api-client.js';
import { DirectClient } from './direct-client.js';
import type { SourceConfig } from '../types/source-config.js';

describe('ClientFactory', () => {
  it('creates ApiClient when apiUrl is provided', () => {
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com' });
    expect(client).toBeInstanceOf(ApiClient);
  });

  it('creates DirectClient with defaults when no config provided', () => {
    const client = ClientFactory.create({});

    expect(client).toBeInstanceOf(DirectClient);
    expect(client.getAvailableSources().map((s) => s.value)).toEqual(['openverse', 'arasaac']);
  });

  it('creates ApiClient with sources mapped to SourceOption', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client).toBeInstanceOf(ApiClient);
    expect(client.getAvailableSources()).toEqual([
      { value: 'nostr', label: 'Nostr DB' },
      { value: 'openverse', label: 'OV' },
    ]);
  });

  it('creates DirectClient with sources when no apiUrl', () => {
    const sources: SourceConfig[] = [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ];
    const client = ClientFactory.create({ sources });

    expect(client).toBeInstanceOf(DirectClient);
    expect(client.getAvailableSources()).toEqual([
      { value: 'openverse', label: 'Openverse' },
      { value: 'arasaac', label: 'ARASAAC' },
    ]);
  });
});
