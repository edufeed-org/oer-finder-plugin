import { registerOpenverseAdapter } from './adapter/openverse.js';
import { registerArasaacAdapter } from './adapter/arasaac.js';
import { registerNostrAmbRelayAdapter } from './adapter/nostr-amb-relay.js';
import { registerRpiVirtuellAdapter } from './adapter/rpi-virtuell.js';
import { registerWikimediaAdapter } from './adapter/wikimedia.js';

export {
  registerOpenverseAdapter,
  registerArasaacAdapter,
  registerNostrAmbRelayAdapter,
  registerRpiVirtuellAdapter,
  registerWikimediaAdapter,
};

/**
 * Register all built-in adapter factories.
 * Convenience helper for consumers who want all adapters.
 *
 * Must be called before the first search.
 *
 * @example
 * ```typescript
 * import { registerAllBuiltInAdapters } from '@edufeed-org/oer-finder-plugin/adapters';
 * registerAllBuiltInAdapters();
 * ```
 */
export function registerAllBuiltInAdapters(): void {
  registerOpenverseAdapter();
  registerArasaacAdapter();
  registerNostrAmbRelayAdapter();
  registerRpiVirtuellAdapter();
  registerWikimediaAdapter();
}
