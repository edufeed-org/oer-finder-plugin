import * as v from 'valibot';
import { NostrEnvSchema } from '@edufeed-org/oer-nostr';

export const EnvSchema = v.object({
  PORT: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
    ),
    '3000',
  ),
  NODE_ENV: v.optional(
    v.picklist(
      ['development', 'production', 'test'],
      'NODE_ENV must be development, production, or test',
    ),
    'development',
  ),
  POSTGRES_HOST: v.optional(v.string(), 'localhost'),
  POSTGRES_PORT: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
    ),
    '5432',
  ),
  POSTGRES_USER: v.optional(v.string(), 'postgres'),
  POSTGRES_PASSWORD: v.optional(v.string(), 'postgres'),
  POSTGRES_DATABASE: v.optional(v.string(), 'oer_aggregator'),
  POSTGRES_LOGGING: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => val === 'true'),
      v.boolean(),
    ),
    'false',
  ),
  // Nostr config imported from package
  ...NostrEnvSchema.entries,
  IMGPROXY_BASE_URL: v.optional(v.string(), ''),
  IMGPROXY_KEY: v.optional(v.string(), ''),
  IMGPROXY_SALT: v.optional(v.string(), ''),
  ENABLED_ADAPTERS: v.optional(v.string(), ''),
  ADAPTER_TIMEOUT_MS: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
    ),
    '3000',
  ),
  NOSTR_AMB_RELAY_URL: v.optional(v.string(), ''),
});

export type Env = v.InferOutput<typeof EnvSchema>;
