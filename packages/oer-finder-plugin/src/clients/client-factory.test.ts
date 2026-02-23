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

  it('creates DirectClient with default sources when no config provided', () => {
    const client = ClientFactory.create({});

    expect(client).toBeInstanceOf(DirectClient);
  });

  it('uses default openverse and arasaac sources when no config provided', () => {
    const client = ClientFactory.create({});

    expect(client.getAvailableSources().map((s) => s.id)).toEqual(['openverse', 'arasaac']);
  });

  it('returns configured sources for ApiClient', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client.getAvailableSources()).toEqual([
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ]);
  });

  it('returns configured sources for DirectClient', () => {
    const sources: SourceConfig[] = [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ];
    const client = ClientFactory.create({ sources });

    expect(client.getAvailableSources()).toEqual([
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ]);
  });

  it('propagates checked flag to ApiClient source options', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', checked: true },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client.getAvailableSources()).toEqual([
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', checked: true },
    ]);
  });

  it('uses first source as default when no checked flag in ApiClient', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ];
    const client = ClientFactory.createApiClient('https://api.example.com', sources);

    expect(client.getDefaultSourceId()).toBe('nostr');
  });

  it('returns checked source as default in ApiClient', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', checked: true },
    ];
    const client = ClientFactory.createApiClient('https://api.example.com', sources);

    expect(client.getDefaultSourceId()).toBe('openverse');
  });
});
