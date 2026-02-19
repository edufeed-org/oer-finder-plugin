import { describe, it, expect } from 'vitest';
import { AdapterManager } from './adapter-manager.js';

describe('AdapterManager', () => {
  it('initializes openverse and arasaac adapters by default', () => {
    const manager = new AdapterManager();
    const sources = manager.getAvailableSources();

    expect(sources.map((s) => s.value)).toContain('openverse');
    expect(sources.map((s) => s.value)).toContain('arasaac');
  });

  it('includes nostr adapter only when relay URL is provided', () => {
    const managerWithoutNostr = new AdapterManager();
    const managerWithNostr = new AdapterManager({
      nostrAmbRelay: { relayUrl: 'wss://relay.example.com' },
    });

    expect(managerWithoutNostr.getAdapter('nostr-amb-relay')).toBeUndefined();
    expect(managerWithNostr.getAdapter('nostr-amb-relay')).toBeDefined();
  });

  it('returns first available source as default', () => {
    const manager = new AdapterManager();
    const defaultSource = manager.getDefaultSourceId();

    expect(defaultSource).toBe('openverse');
  });

  it('does not include rpi-virtuell adapter by default', () => {
    const manager = new AdapterManager();
    const sources = manager.getAvailableSources();

    expect(sources.map((s) => s.value)).not.toContain('rpi-virtuell');
    expect(manager.getAdapter('rpi-virtuell')).toBeUndefined();
  });

  it('includes rpi-virtuell adapter when rpiVirtuell config is provided', () => {
    const manager = new AdapterManager({
      rpiVirtuell: {},
    });

    expect(manager.getAdapter('rpi-virtuell')).toBeDefined();
    expect(manager.getAvailableSources().map((s) => s.value)).toContain('rpi-virtuell');
  });

  it('includes rpi-virtuell adapter with custom apiUrl', () => {
    const manager = new AdapterManager({
      rpiVirtuell: { apiUrl: 'https://example.com/graphql' },
    });
    const adapter = manager.getAdapter('rpi-virtuell');

    expect(adapter).toBeDefined();
    expect(adapter?.sourceId).toBe('rpi-virtuell');
    expect(adapter?.sourceName).toBe('RPI-Virtuell Materialpool');
  });

  it('includes all four adapters when all are enabled', () => {
    const manager = new AdapterManager({
      openverse: true,
      arasaac: true,
      nostrAmbRelay: { relayUrl: 'wss://relay.example.com' },
      rpiVirtuell: { apiUrl: 'https://material.rpi-virtuell.de/graphql' },
    });
    const sourceIds = manager.getAvailableSources().map((s) => s.value);

    expect(sourceIds).toEqual(
      expect.arrayContaining(['openverse', 'arasaac', 'nostr-amb-relay', 'rpi-virtuell']),
    );
    expect(sourceIds).toHaveLength(4);
  });
});
