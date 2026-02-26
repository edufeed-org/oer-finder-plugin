import type { SourceAdapter } from '../types/adapter-core-types.js';
import type { SourceConfig } from '../types/source-config.js';

/**
 * A factory that receives a SourceConfig and returns an adapter instance,
 * or null if the config is invalid (e.g. missing required baseUrl).
 */
export type AdapterFactory = (config: SourceConfig) => SourceAdapter | null;

const registry = new Map<string, AdapterFactory>();

/**
 * Register a factory for a given source ID.
 * Must be called before the first search or `getAvailableSources()` call,
 * since `DirectClient` caches the adapter set on first use.
 *
 * Calling with a previously registered sourceId silently overwrites the old factory.
 */
export function registerAdapter(sourceId: string, factory: AdapterFactory): void {
  registry.set(sourceId, factory);
}

/**
 * Look up a registered factory. Returns undefined for unknown IDs.
 */
export function getAdapterFactory(sourceId: string): AdapterFactory | undefined {
  return registry.get(sourceId);
}

/**
 * Remove all registered adapter factories.
 * Primarily useful for testing to ensure test isolation.
 */
export function clearAdapterRegistry(): void {
  registry.clear();
}
