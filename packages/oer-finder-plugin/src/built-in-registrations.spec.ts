import { describe, it, expect, beforeEach } from 'vitest';
import { registerAllBuiltInAdapters } from './built-in-registrations.js';
import { getAdapterFactory, clearAdapterRegistry } from './adapters/adapter-registry.js';

describe('registerAllBuiltInAdapters', () => {
  beforeEach(() => {
    clearAdapterRegistry();
  });

  it('registers factories for all five built-in source IDs', () => {
    registerAllBuiltInAdapters();

    expect(getAdapterFactory('openverse')).toBeDefined();
    expect(getAdapterFactory('arasaac')).toBeDefined();
    expect(getAdapterFactory('nostr-amb-relay')).toBeDefined();
    expect(getAdapterFactory('rpi-virtuell')).toBeDefined();
    expect(getAdapterFactory('wikimedia')).toBeDefined();
  });

  it('creates valid adapter instances from registered factories', () => {
    registerAllBuiltInAdapters();

    const openverse = getAdapterFactory('openverse')!({ id: 'openverse', label: 'OV' });
    expect(openverse?.sourceId).toBe('openverse');

    const arasaac = getAdapterFactory('arasaac')!({ id: 'arasaac', label: 'AR' });
    expect(arasaac?.sourceId).toBe('arasaac');

    const wikimedia = getAdapterFactory('wikimedia')!({ id: 'wikimedia', label: 'WM' });
    expect(wikimedia?.sourceId).toBe('wikimedia');

    const rpiVirtuell = getAdapterFactory('rpi-virtuell')!({ id: 'rpi-virtuell', label: 'RPI' });
    expect(rpiVirtuell?.sourceId).toBe('rpi-virtuell');
  });

  it('returns null for nostr-amb-relay when baseUrl is missing', () => {
    registerAllBuiltInAdapters();

    const adapter = getAdapterFactory('nostr-amb-relay')!({
      id: 'nostr-amb-relay',
      label: 'Relay',
    });

    expect(adapter).toBeNull();
  });

  it('creates nostr-amb-relay adapter when baseUrl is provided', () => {
    registerAllBuiltInAdapters();

    const adapter = getAdapterFactory('nostr-amb-relay')!({
      id: 'nostr-amb-relay',
      label: 'Relay',
      baseUrl: 'wss://relay.example.com',
    });

    expect(adapter?.sourceId).toBe('nostr-amb-relay');
  });
});
