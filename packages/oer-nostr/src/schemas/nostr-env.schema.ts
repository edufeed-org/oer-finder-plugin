import * as v from 'valibot';

export const NostrEnvSchema = v.object({
  NOSTR_RELAY_URL: v.optional(v.string(), 'ws://localhost:10547'),
  NOSTR_RELAY_URLS: v.optional(v.string(), ''),
  NOSTR_RECONNECT_DELAY: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
    ),
    '5000',
  ),
});

export type NostrEnv = v.InferOutput<typeof NostrEnvSchema>;
