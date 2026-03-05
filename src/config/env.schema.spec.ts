import * as v from 'valibot';
import { EnvSchema } from './env.schema';

function parseEnv(overrides: Record<string, string> = {}) {
  return v.parse(EnvSchema, overrides);
}

describe('EnvSchema', () => {
  describe('PORT', () => {
    it('should default to 3000', () => {
      const result = parseEnv();
      expect(result.PORT).toBe(3000);
    });

    it('should reject port 0', () => {
      expect(() => parseEnv({ PORT: '0' })).toThrow(v.ValiError);
    });

    it('should reject port above 65535', () => {
      expect(() => parseEnv({ PORT: '70000' })).toThrow(v.ValiError);
    });

    it('should accept valid port', () => {
      const result = parseEnv({ PORT: '8080' });
      expect(result.PORT).toBe(8080);
    });
  });

  describe('ADAPTER_TIMEOUT_MS', () => {
    it('should default to 3000', () => {
      const result = parseEnv();
      expect(result.ADAPTER_TIMEOUT_MS).toBe(3000);
    });

    it('should reject value below 100', () => {
      expect(() => parseEnv({ ADAPTER_TIMEOUT_MS: '50' })).toThrow(v.ValiError);
    });

    it('should reject value above 60000', () => {
      expect(() => parseEnv({ ADAPTER_TIMEOUT_MS: '120000' })).toThrow(
        v.ValiError,
      );
    });

    it('should accept valid timeout', () => {
      const result = parseEnv({ ADAPTER_TIMEOUT_MS: '5000' });
      expect(result.ADAPTER_TIMEOUT_MS).toBe(5000);
    });
  });

  describe('THROTTLE_TTL', () => {
    it('should default to 60000', () => {
      const result = parseEnv();
      expect(result.THROTTLE_TTL).toBe(60000);
    });

    it('should accept a valid numeric string', () => {
      const result = parseEnv({ THROTTLE_TTL: '30000' });
      expect(result.THROTTLE_TTL).toBe(30000);
    });

    it('should reject a value less than 1', () => {
      expect(() => parseEnv({ THROTTLE_TTL: '0' })).toThrow(v.ValiError);
    });

    it('should reject a non-numeric string', () => {
      expect(() => parseEnv({ THROTTLE_TTL: 'abc' })).toThrow();
    });
  });

  describe('THROTTLE_LIMIT', () => {
    it('should default to 30', () => {
      const result = parseEnv();
      expect(result.THROTTLE_LIMIT).toBe(30);
    });

    it('should accept a valid numeric string', () => {
      const result = parseEnv({ THROTTLE_LIMIT: '100' });
      expect(result.THROTTLE_LIMIT).toBe(100);
    });

    it('should reject a value less than 1', () => {
      expect(() => parseEnv({ THROTTLE_LIMIT: '0' })).toThrow(v.ValiError);
    });
  });

  describe('THROTTLE_BLOCK_DURATION', () => {
    it('should default to 60000', () => {
      const result = parseEnv();
      expect(result.THROTTLE_BLOCK_DURATION).toBe(60000);
    });

    it('should accept zero', () => {
      const result = parseEnv({ THROTTLE_BLOCK_DURATION: '0' });
      expect(result.THROTTLE_BLOCK_DURATION).toBe(0);
    });

    it('should reject a negative value', () => {
      expect(() => parseEnv({ THROTTLE_BLOCK_DURATION: '-1' })).toThrow(
        v.ValiError,
      );
    });
  });
});
