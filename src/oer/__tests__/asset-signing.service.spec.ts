import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssetSigningService } from '../services/asset-signing.service';

// Test key: 32+ character string
const TEST_KEY = 'my-secret-signing-key-for-testing-purposes';

describe('AssetSigningService', () => {
  const createService = async (key = '', ttlSeconds = 3600) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetSigningService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((path: string) => {
              if (path === 'app.assetSigning') {
                return { key, ttlSeconds };
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    return module.get<AssetSigningService>(AssetSigningService);
  };

  describe('isEnabled', () => {
    it('should return false when key is empty', async () => {
      const service = await createService('');
      expect(service.isEnabled()).toBe(false);
    });

    it('should return false when key is shorter than 32 characters', async () => {
      const service = await createService('short-key');
      expect(service.isEnabled()).toBe(false);
    });

    it('should return true when key is at least 32 characters', async () => {
      const service = await createService(TEST_KEY);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('generateSignedPath', () => {
    it('should produce a path starting with /api/v1/assets/', async () => {
      const service = await createService(TEST_KEY);
      const path = service.generateSignedPath('https://example.com/image.jpg');
      expect(path).toMatch(/^\/api\/v1\/assets\//);
    });

    it('should include url and exp query parameters', async () => {
      const service = await createService(TEST_KEY);
      const path = service.generateSignedPath('https://example.com/image.jpg');

      const queryString = path.split('?')[1];
      const params = new URLSearchParams(queryString);
      expect(params.has('url')).toBe(true);
      expect(params.has('exp')).toBe(true);
    });

    it('should base64url-encode the source URL in the url parameter', async () => {
      const service = await createService(TEST_KEY);
      const sourceUrl = 'https://example.com/image.jpg';
      const path = service.generateSignedPath(sourceUrl);

      const params = new URLSearchParams(path.split('?')[1]);
      const decoded = Buffer.from(
        params.get('url') as string,
        'base64url',
      ).toString('utf-8');
      expect(decoded).toBe(sourceUrl);
    });

    it('should set exp to a future timestamp when ttl > 0', async () => {
      const service = await createService(TEST_KEY, 3600);
      const before = Math.floor(Date.now() / 1000);
      const path = service.generateSignedPath('https://example.com/image.jpg');
      const after = Math.floor(Date.now() / 1000);

      const params = new URLSearchParams(path.split('?')[1]);
      const exp = parseInt(params.get('exp') as string, 10);
      expect(exp).toBeGreaterThanOrEqual(before + 3600);
      expect(exp).toBeLessThanOrEqual(after + 3600);
    });

    it('should set exp to 0 when ttl is 0 (no expiration)', async () => {
      const service = await createService(TEST_KEY, 0);
      const path = service.generateSignedPath('https://example.com/image.jpg');

      const params = new URLSearchParams(path.split('?')[1]);
      expect(params.get('exp')).toBe('0');
    });
  });

  describe('generateSignedUrl', () => {
    it('should prepend the base URL to the signed path', async () => {
      const service = await createService(TEST_KEY);
      const url = service.generateSignedUrl(
        'https://example.com/image.jpg',
        'http://localhost:3000',
      );
      expect(url).toMatch(/^http:\/\/localhost:3000\/api\/v1\/assets\//);
    });
  });

  describe('verify', () => {
    it('should return the original URL for a valid signature', async () => {
      const service = await createService(TEST_KEY, 3600);
      const sourceUrl = 'https://example.com/image.jpg';
      const path = service.generateSignedPath(sourceUrl);

      // Extract components from the generated path
      const [pathPart, queryString] = path.split('?');
      const signature = pathPart.split('/api/v1/assets/')[1];
      const params = new URLSearchParams(queryString);

      const result = service.verify(
        signature,
        params.get('url') as string,
        parseInt(params.get('exp') as string, 10),
      );
      expect(result).toBe(sourceUrl);
    });

    it('should return null for a tampered signature', async () => {
      const service = await createService(TEST_KEY, 3600);
      const sourceUrl = 'https://example.com/image.jpg';
      const path = service.generateSignedPath(sourceUrl);

      const params = new URLSearchParams(path.split('?')[1]);

      const result = service.verify(
        'tampered-signature',
        params.get('url') as string,
        parseInt(params.get('exp') as string, 10),
      );
      expect(result).toBeNull();
    });

    it('should return null for a tampered url parameter', async () => {
      const service = await createService(TEST_KEY, 3600);
      const sourceUrl = 'https://example.com/image.jpg';
      const path = service.generateSignedPath(sourceUrl);

      const [pathPart, queryString] = path.split('?');
      const signature = pathPart.split('/api/v1/assets/')[1];
      const params = new URLSearchParams(queryString);

      const tamperedUrl = Buffer.from('https://evil.com/hack.jpg').toString(
        'base64url',
      );

      const result = service.verify(
        signature,
        tamperedUrl,
        parseInt(params.get('exp') as string, 10),
      );
      expect(result).toBeNull();
    });

    it('should return null for an expired URL', async () => {
      const service = await createService(TEST_KEY, 3600);
      const sourceUrl = 'https://example.com/image.jpg';
      const urlEncoded = Buffer.from(sourceUrl).toString('base64url');

      // Use an expiration time in the past
      const expiredExp = Math.floor(Date.now() / 1000) - 100;

      // Generate a signature with a future exp, then verify with the expired exp.
      // This fails because the expiration check rejects it before signature comparison.
      const path = service.generateSignedPath(sourceUrl);
      const [pathPart] = path.split('?');
      const signature = pathPart.split('/api/v1/assets/')[1];

      const result = service.verify(signature, urlEncoded, expiredExp);
      expect(result).toBeNull();
    });

    it('should return the URL when exp is 0 (no expiration)', async () => {
      const service = await createService(TEST_KEY, 0);
      const sourceUrl = 'https://example.com/image.jpg';
      const path = service.generateSignedPath(sourceUrl);

      const [pathPart, queryString] = path.split('?');
      const signature = pathPart.split('/api/v1/assets/')[1];
      const params = new URLSearchParams(queryString);

      const result = service.verify(
        signature,
        params.get('url') as string,
        parseInt(params.get('exp') as string, 10),
      );
      expect(result).toBe(sourceUrl);
    });
  });

  describe('when config returns undefined', () => {
    it('should handle missing config gracefully', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AssetSigningService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      const service = module.get<AssetSigningService>(AssetSigningService);
      expect(service.isEnabled()).toBe(false);
    });
  });
});
