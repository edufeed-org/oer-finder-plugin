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
  ASSET_SIGNING_KEY: v.optional(
    v.pipe(
      v.string(),
      v.check(
        (val) => val === '' || val.length >= 32,
        'ASSET_SIGNING_KEY must be at least 32 characters',
      ),
    ),
    '',
  ),
  ASSET_SIGNING_TTL_SECONDS: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(0, 'ASSET_SIGNING_TTL_SECONDS must be non-negative'),
    ),
    '3600',
  ),
  PUBLIC_BASE_URL: v.optional(v.string(), ''),
  CORS_ALLOWED_ORIGINS: v.optional(v.string(), ''),
});

export type Env = v.InferOutput<typeof EnvSchema>;
