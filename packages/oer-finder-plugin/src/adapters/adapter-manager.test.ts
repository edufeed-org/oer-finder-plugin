import { describe, it, expect } from 'vitest';
import { AdapterManager } from './adapter-manager.js';
import type { SourceConfig } from '../types/source-config.js';
import { SOURCE_ID_ALL } from '../constants.js';

describe('AdapterManager', () => {
  it('does not prepend all option when not explicitly configured', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sources = manager.getAvailableSources();

    expect(sources).toEqual([
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ]);
  });

  it('prepends all option when explicitly configured in sources', () => {
    const configs: SourceConfig[] = [
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sources = manager.getAvailableSources();

    expect(sources).toEqual([
      { id: SOURCE_ID_ALL, label: 'All Sources' },
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ]);
  });

  it('uses custom labels instead of adapter defaults', () => {
    const configs: SourceConfig[] = [{ id: 'openverse', label: 'My Custom Openverse' }];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sources = manager.getAvailableSources();

    expect(sources[0].label).toBe('My Custom Openverse');
  });

  it('creates nostr-amb-relay adapter when baseUrl is provided', () => {
    const configs: SourceConfig[] = [
      { id: 'nostr-amb-relay', label: 'Relay', baseUrl: 'wss://relay.example.com' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAdapter('nostr-amb-relay')).toBeDefined();
  });

  it('skips nostr-amb-relay when baseUrl is missing', () => {
    const configs: SourceConfig[] = [{ id: 'nostr-amb-relay', label: 'Relay' }];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAdapter('nostr-amb-relay')).toBeUndefined();
    expect(manager.getAvailableSources()).toHaveLength(0);
  });

  it('creates rpi-virtuell adapter with optional baseUrl', () => {
    const configs: SourceConfig[] = [{ id: 'rpi-virtuell', label: 'RPI' }];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAdapter('rpi-virtuell')).toBeDefined();
  });

  it('skips unknown source IDs silently', () => {
    const configs: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr Database' },
      { id: 'openverse', label: 'OV' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAvailableSources()).toEqual([{ id: 'openverse', label: 'OV' }]);
  });

  it('creates all four adapters from full config without all option', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'nostr-amb-relay', label: 'Nostr Relay', baseUrl: 'wss://relay.example.com' },
      { id: 'rpi-virtuell', label: 'RPI', baseUrl: 'https://example.com/graphql' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sourceIds = manager.getAvailableSources().map((s) => s.id);

    expect(sourceIds).toEqual(['openverse', 'arasaac', 'nostr-amb-relay', 'rpi-virtuell']);
  });

  it('creates all four adapters with all option when explicitly configured', () => {
    const configs: SourceConfig[] = [
      { id: SOURCE_ID_ALL, label: 'All' },
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'nostr-amb-relay', label: 'Nostr Relay', baseUrl: 'wss://relay.example.com' },
      { id: 'rpi-virtuell', label: 'RPI', baseUrl: 'https://example.com/graphql' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sourceIds = manager.getAvailableSources().map((s) => s.id);

    expect(sourceIds).toEqual([
      SOURCE_ID_ALL,
      'openverse',
      'arasaac',
      'nostr-amb-relay',
      'rpi-virtuell',
    ]);
  });

  it('returns first available source as default', () => {
    const manager = AdapterManager.fromSourceConfigs([{ id: 'arasaac', label: 'AR' }]);

    expect(manager.getDefaultSourceId()).toBe('arasaac');
  });

  it('falls back to openverse when no adapters configured', () => {
    const manager = AdapterManager.fromSourceConfigs([]);

    expect(manager.getDefaultSourceId()).toBe('openverse');
  });

  it('returns selected source as default when selected flag is set', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR', selected: true },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getDefaultSourceId()).toBe('arasaac');
  });

  it('includes selected flag in available sources without all option', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR', selected: true },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAvailableSources()).toEqual([
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR', selected: true },
    ]);
  });

  it('ignores selected on unknown or skipped adapter IDs', () => {
    const configs: SourceConfig[] = [
      { id: 'nostr', label: 'Nostr DB', selected: true },
      { id: 'openverse', label: 'OV' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getDefaultSourceId()).toBe('openverse');
  });

  it('returns all registered source IDs from getAllSourceIds', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getAllSourceIds()).toEqual(['openverse', 'arasaac']);
  });

  it('does not include all option when only 1 source is configured', () => {
    const configs: SourceConfig[] = [{ id: 'openverse', label: 'OV' }];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sources = manager.getAvailableSources();

    expect(sources).toEqual([{ id: 'openverse', label: 'OV' }]);
  });

  it('uses first selected source when multiple are marked', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR', selected: true },
      { id: 'rpi-virtuell', label: 'RPI', selected: true },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);

    expect(manager.getDefaultSourceId()).toBe('arasaac');
  });

  describe('filter guard in search', () => {
    it('returns empty results when requested type is not in adapter supportedTypes', async () => {
      const configs: SourceConfig[] = [{ id: 'arasaac', label: 'ARASAAC' }];
      const manager = AdapterManager.fromSourceConfigs(configs);

      const result = await manager.search('arasaac', {
        keywords: 'test',
        type: 'video',
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({ items: [], total: 0 });
    });

    it('returns empty results when license filter is set and adapter does not support it', async () => {
      const configs: SourceConfig[] = [{ id: 'arasaac', label: 'ARASAAC' }];
      const manager = AdapterManager.fromSourceConfigs(configs);

      const result = await manager.search('arasaac', {
        keywords: 'test',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({ items: [], total: 0 });
    });

    it('returns empty results when language is not in supportedLanguages', async () => {
      const configs: SourceConfig[] = [{ id: 'rpi-virtuell', label: 'RPI' }];
      const manager = AdapterManager.fromSourceConfigs(configs);

      const result = await manager.search('rpi-virtuell', {
        keywords: 'test',
        language: 'en',
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({ items: [], total: 0 });
    });

    it('returns empty results when supportedTypes is undefined and type is set', async () => {
      const configs: SourceConfig[] = [{ id: 'openverse', label: 'OV' }];
      const manager = AdapterManager.fromSourceConfigs(configs);

      const result = await manager.search('openverse', {
        keywords: 'test',
        type: 'video',
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({ items: [], total: 0 });
    });

    it('returns empty results when educational level filter is set and adapter does not support it', async () => {
      const configs: SourceConfig[] = [{ id: 'arasaac', label: 'ARASAAC' }];
      const manager = AdapterManager.fromSourceConfigs(configs);

      const result = await manager.search('arasaac', {
        keywords: 'test',
        educationalLevel: 'https://w3id.org/kim/educationalLevel/level_06',
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
