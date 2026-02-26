import { registerAdapter } from '../adapters/adapter-registry.js';
import { createNostrAmbRelayAdapter } from '@edufeed-org/oer-adapter-nostr-amb-relay';

// nostr-amb-relay requires a relay URL — skipped if baseUrl is missing
export function registerNostrAmbRelayAdapter(): void {
  registerAdapter('nostr-amb-relay', (config) =>
    config.baseUrl ? createNostrAmbRelayAdapter({ relayUrl: config.baseUrl }) : null,
  );
}
