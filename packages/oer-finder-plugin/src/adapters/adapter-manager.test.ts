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
});
