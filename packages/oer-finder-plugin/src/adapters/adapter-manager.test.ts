import { describe, it, expect } from 'vitest';
import { AdapterManager } from './adapter-manager.js';
import type { SourceConfig } from '../types/source-config.js';

describe('AdapterManager', () => {
  it('creates adapters from source configs', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'OV' },
      { id: 'arasaac', label: 'AR' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sources = manager.getAvailableSources();

    expect(sources).toEqual([
      { value: 'openverse', label: 'OV' },
      { value: 'arasaac', label: 'AR' },
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
    const sources = manager.getAvailableSources();

    expect(sources).toHaveLength(1);
    expect(sources[0].value).toBe('openverse');
  });

  it('creates all four adapters from full config', () => {
    const configs: SourceConfig[] = [
      { id: 'openverse', label: 'Openverse' },
      { id: 'arasaac', label: 'ARASAAC' },
      { id: 'nostr-amb-relay', label: 'Nostr Relay', baseUrl: 'wss://relay.example.com' },
      { id: 'rpi-virtuell', label: 'RPI', baseUrl: 'https://example.com/graphql' },
    ];
    const manager = AdapterManager.fromSourceConfigs(configs);
    const sourceIds = manager.getAvailableSources().map((s) => s.value);

    expect(sourceIds).toEqual(
      expect.arrayContaining(['openverse', 'arasaac', 'nostr-amb-relay', 'rpi-virtuell']),
    );
    expect(sourceIds).toHaveLength(4);
  });

  it('returns first available source as default', () => {
    const manager = AdapterManager.fromSourceConfigs([{ id: 'arasaac', label: 'AR' }]);

    expect(manager.getDefaultSourceId()).toBe('arasaac');
  });

  it('falls back to openverse when no adapters configured', () => {
    const manager = AdapterManager.fromSourceConfigs([]);

    expect(manager.getDefaultSourceId()).toBe('openverse');
  });
});
