import * as v from 'valibot';

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
