import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || true,
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 60 seconds (1 minute)
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10), // 10 requests per minute
    blockDuration: parseInt(process.env.THROTTLE_BLOCK_DURATION || '60000', 10), // Block for 1 minute
  },
}));
