import * as v from 'valibot';

export const EnvSchema = v.object({
  PORT: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(1, 'PORT must be at least 1'),
      v.maxValue(65535, 'PORT must be at most 65535'),
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
      v.minValue(100, 'ADAPTER_TIMEOUT_MS must be at least 100'),
      v.maxValue(60000, 'ADAPTER_TIMEOUT_MS must be at most 60000'),
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
  TRUST_PROXY: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(0, 'TRUST_PROXY must be non-negative'),
      v.maxValue(10, 'TRUST_PROXY must be at most 10'),
    ),
    '0',
  ),
  THROTTLE_TTL: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(1, 'THROTTLE_TTL must be at least 1'),
    ),
    '60000',
  ),
  THROTTLE_LIMIT: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(1, 'THROTTLE_LIMIT must be at least 1'),
    ),
    '30',
  ),
  THROTTLE_BLOCK_DURATION: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => parseInt(val, 10)),
      v.number(),
      v.minValue(0, 'THROTTLE_BLOCK_DURATION must be non-negative'),
    ),
    '60000',
  ),
});

export type Env = v.InferOutput<typeof EnvSchema>;
