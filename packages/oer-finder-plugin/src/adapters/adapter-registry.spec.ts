import { describe, it, expect, beforeEach } from 'vitest';
import { registerAdapter, getAdapterFactory, clearAdapterRegistry } from './adapter-registry.js';
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

describe('adapter-registry', () => {
  beforeEach(() => {
    clearAdapterRegistry();
  });

  it('stores a factory that getAdapterFactory retrieves', () => {
    const factory = () => createMockAdapter('test');
    registerAdapter('test', factory);

    expect(getAdapterFactory('test')).toBe(factory);
  });

  it('returns undefined for unregistered IDs', () => {
    expect(getAdapterFactory('unknown')).toBeUndefined();
  });

  it('overwrites a previously registered factory for the same ID', () => {
    const factory1 = () => createMockAdapter('test-v1');
    const factory2 = () => createMockAdapter('test-v2');

    registerAdapter('test', factory1);
    registerAdapter('test', factory2);

    expect(getAdapterFactory('test')).toBe(factory2);
  });

  it('removes all registered factories on clear', () => {
    registerAdapter('a', () => createMockAdapter('a'));
    registerAdapter('b', () => createMockAdapter('b'));

    clearAdapterRegistry();

    expect(getAdapterFactory('a')).toBeUndefined();
    expect(getAdapterFactory('b')).toBeUndefined();
  });
});
