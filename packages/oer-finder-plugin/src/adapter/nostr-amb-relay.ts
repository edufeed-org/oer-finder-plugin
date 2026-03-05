import { registerAdapter } from '../adapters/adapter-registry.js';
import { createNostrAmbRelayAdapter } from '@edufeed-org/oer-adapter-nostr-amb-relay';

// nostr-amb-relay requires at least one relay URL — skipped if baseUrl is missing
export function registerNostrAmbRelayAdapter(): void {
  registerAdapter('nostr-amb-relay', (config) => {
    if (!config.baseUrl) return null;
    const relayUrls = config.baseUrl
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return relayUrls.length > 0 ? createNostrAmbRelayAdapter({ relayUrls }) : null;
  });
}
