import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DomainAllowlistService } from './domain-allowlist.service';

const createService = async (
  allowedDomains: string[],
): Promise<DomainAllowlistService> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DomainAllowlistService,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'app.assetProxy.allowedDomains') return allowedDomains;
            return undefined;
          }),
        },
      },
    ],
  }).compile();

  return module.get<DomainAllowlistService>(DomainAllowlistService);
};

describe('DomainAllowlistService', () => {
  describe('isEnabled', () => {
    it('should return false when allowlist is empty', async () => {
      const service = await createService([]);
      expect(service.isEnabled()).toBe(false);
    });

    it('should return true when allowlist has entries', async () => {
      const service = await createService(['example.com']);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('isDomainAllowed', () => {
    it('should allow all domains when allowlist is empty', async () => {
      const service = await createService([]);
      expect(service.isDomainAllowed('https://anything.com/image.jpg')).toBe(
        true,
      );
    });

    it('should allow exact domain match', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('https://example.com/image.jpg')).toBe(
        true,
      );
    });

    it('should allow subdomain of allowlisted domain', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('https://cdn.example.com/image.jpg')).toBe(
        true,
      );
    });

    it('should block non-allowlisted domain', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('https://evil.com/image.jpg')).toBe(false);
    });

    it('should not match partial domain names', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('https://notexample.com/image.jpg')).toBe(
        false,
      );
    });

    it('should return false for invalid URLs', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('not-a-url')).toBe(false);
    });

    it('should match case-insensitively', async () => {
      const service = await createService(['example.com']);
      expect(service.isDomainAllowed('https://EXAMPLE.COM/image.jpg')).toBe(
        true,
      );
    });
  });
});
