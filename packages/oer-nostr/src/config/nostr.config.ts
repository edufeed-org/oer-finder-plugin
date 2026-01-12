import { registerAs } from '@nestjs/config';

export const nostrConfig = registerAs('nostr', () => ({
  enabled: process.env.NOSTR_INGEST_ENABLED === 'true',
  relayUrl: process.env.NOSTR_RELAY_URL || 'ws://localhost:10547',
  relayUrls: process.env.NOSTR_RELAY_URLS || '',
  reconnectDelayMs: parseInt(
    process.env.NOSTR_RELAY_RECONNECT_TIME ||
      process.env.NOSTR_RECONNECT_DELAY ||
      '5000',
    10,
  ),
}));
