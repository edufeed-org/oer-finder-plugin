import { registerAs } from '@nestjs/config';

export function parseCorsOrigins(raw: string): true | Array<string | RegExp> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return true;
  }

  return trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      if (entry.startsWith('*.')) {
        const domain = entry.slice(2).replace(/\./g, '\\.');
        return new RegExp(`^https?://[^.]+\\.${domain}$`);
      }
      return entry;
    });
}

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsAllowedOrigins: parseCorsOrigins(process.env.CORS_ALLOWED_ORIGINS ?? ''),
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 60 seconds (1 minute)
    limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10), // 30 requests per minute
    blockDuration: parseInt(process.env.THROTTLE_BLOCK_DURATION || '60000', 10), // Block for 1 minute
  },
  imgproxy: {
    baseUrl: process.env.IMGPROXY_BASE_URL || '',
    key: process.env.IMGPROXY_KEY || '',
    salt: process.env.IMGPROXY_SALT || '',
  },
  assetSigning: {
    key: process.env.ASSET_SIGNING_KEY || '',
    ttlSeconds: parseInt(process.env.ASSET_SIGNING_TTL_SECONDS || '3600', 10),
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  adapters: {
    enabled: (process.env.ENABLED_ADAPTERS || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    timeoutMs: parseInt(process.env.ADAPTER_TIMEOUT_MS || '3000', 10),
    nostrAmbRelay: {
      url: process.env.NOSTR_AMB_RELAY_URL || '',
    },
    rpiVirtuell: {
      url: process.env.RPI_VIRTUELL_API_URL || '',
    },
  },
}));
