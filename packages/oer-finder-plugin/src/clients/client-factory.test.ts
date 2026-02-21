import { describe, it, expect } from 'vitest';
import { ClientFactory } from './client-factory.js';
import { ApiClient } from './api-client.js';
import { DirectClient } from './direct-client.js';
import type { SourceConfig } from '../types/source-config.js';
import { SOURCE_ID_ALL } from '../constants.js';

describe('ClientFactory', () => {
  it('creates ApiClient when apiUrl is provided', () => {
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com' });
    expect(client).toBeInstanceOf(ApiClient);
  });

  it('creates DirectClient with defaults when no config provided', () => {
    const client = ClientFactory.create({});

    expect(client).toBeInstanceOf(DirectClient);
    expect(client.getAvailableSources().map((s) => s.id)).toEqual([
      SOURCE_ID_ALL,
      'openverse',
      'arasaac',
    ]);
  });

  it('creates ApiClient with sources mapped to SourceOption with all option', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client).toBeInstanceOf(ApiClient);
    expect(client.getAvailableSources()).toEqual([
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
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
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
    ]);
  });

  it('propagates selected flag to ApiClient source options', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', selected: true },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client.getAvailableSources()).toEqual([
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', selected: true },
    ]);
  });

  it('uses first source as default when no selected flag in ApiClient', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV' },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client.getDefaultSourceId()).toBe('nostr');
  });

  it('returns selected source as default in ApiClient', () => {
    const sources: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB' },
      { id: 'openverse', label: 'OV', selected: true },
    ];
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com', sources });

    expect(client.getDefaultSourceId()).toBe('openverse');
  });
});
