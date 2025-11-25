import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImgproxyService } from '../services/imgproxy.service';

describe('ImgproxyService', () => {
  let service: ImgproxyService;

  const createService = async (baseUrl: string, key = '', salt = '') => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImgproxyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({ baseUrl, key, salt }),
          },
        },
      ],
    }).compile();

    return module.get<ImgproxyService>(ImgproxyService);
  };

  describe('when imgproxy is configured', () => {
    beforeEach(async () => {
      service = await createService('http://localhost:8080');
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return true for isEnabled when baseUrl is set', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should generate proxy URLs for a valid image URL', () => {
      const sourceUrl = 'https://example.com/images/photo.jpg';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        high: 'http://localhost:8080/insecure/rs:fit:0:0/plain/https%3A%2F%2Fexample.com%2Fimages%2Fphoto.jpg',
        medium:
          'http://localhost:8080/insecure/rs:fit:400:0/plain/https%3A%2F%2Fexample.com%2Fimages%2Fphoto.jpg',
        small:
          'http://localhost:8080/insecure/rs:fit:200:0/plain/https%3A%2F%2Fexample.com%2Fimages%2Fphoto.jpg',
      });
    });

    it('should properly encode URLs with special characters', () => {
      const sourceUrl =
        'https://example.com/images/photo with spaces.jpg?size=large&format=png';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      expect(result?.high).toContain(
        'http://localhost:8080/insecure/rs:fit:0:0/plain/',
      );
      expect(result?.high).toContain(encodeURIComponent(sourceUrl));
    });

    it('should return null when source URL is null', () => {
      const result = service.generateUrls(null);
      expect(result).toBeNull();
    });

    it('should return null when source URL is undefined', () => {
      const result = service.generateUrls(undefined);
      expect(result).toBeNull();
    });

    it('should return null when source URL is empty string', () => {
      const result = service.generateUrls('');
      expect(result).toBeNull();
    });

    it('should generate correct resize parameters for each size', () => {
      const sourceUrl = 'https://example.com/image.jpg';
      const result = service.generateUrls(sourceUrl);

      expect(result?.high).toContain('/insecure/rs:fit:0:0/');
      expect(result?.medium).toContain('/insecure/rs:fit:400:0/');
      expect(result?.small).toContain('/insecure/rs:fit:200:0/');
    });

    it('should handle URLs with query parameters', () => {
      const sourceUrl = 'https://cdn.example.com/image.jpg?token=abc123&v=2';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      const encodedUrl = encodeURIComponent(sourceUrl);
      expect(result?.high).toBe(
        `http://localhost:8080/insecure/rs:fit:0:0/plain/${encodedUrl}`,
      );
    });

    it('should handle URLs with fragments', () => {
      const sourceUrl = 'https://example.com/image.jpg#section';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      const encodedUrl = encodeURIComponent(sourceUrl);
      expect(result?.high).toBe(
        `http://localhost:8080/insecure/rs:fit:0:0/plain/${encodedUrl}`,
      );
    });

    it('should handle URLs with unicode characters', () => {
      const sourceUrl = 'https://example.com/图片/photo.jpg';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      const encodedUrl = encodeURIComponent(sourceUrl);
      expect(result?.high).toBe(
        `http://localhost:8080/insecure/rs:fit:0:0/plain/${encodedUrl}`,
      );
    });
  });

  describe('when imgproxy is configured with signature keys (secure mode)', () => {
    beforeEach(async () => {
      // Using test keys
      service = await createService(
        'http://localhost:8080',
        '943b421c9eb07c830af81030552c86009268de4e532ba2ee2eab8247c6da0881',
        '520f986b998545b4785e0defbc4f3c1203f22de2374a3d53cb7a7fe9fea309c5',
      );
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return true for isEnabled when baseUrl is set', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should generate signed proxy URLs', () => {
      const sourceUrl = 'https://example.com/images/photo.jpg';
      const result = service.generateUrls(sourceUrl);

      expect(result).not.toBeNull();
      // URLs should start with base URL and contain a signature (not /insecure)
      expect(result?.high).toMatch(
        /^http:\/\/localhost:8080\/[A-Za-z0-9_-]+\/rs:fit:0:0\//,
      );
      expect(result?.high).not.toContain('/insecure/');
      expect(result?.medium).toMatch(
        /^http:\/\/localhost:8080\/[A-Za-z0-9_-]+\/rs:fit:400:0\//,
      );
      expect(result?.small).toMatch(
        /^http:\/\/localhost:8080\/[A-Za-z0-9_-]+\/rs:fit:200:0\//,
      );
    });

    it('should generate consistent signatures for the same URL', () => {
      const sourceUrl = 'https://example.com/image.jpg';
      const result1 = service.generateUrls(sourceUrl);
      const result2 = service.generateUrls(sourceUrl);

      expect(result1?.high).toBe(result2?.high);
      expect(result1?.medium).toBe(result2?.medium);
      expect(result1?.small).toBe(result2?.small);
    });
  });

  describe('when imgproxy is not configured', () => {
    beforeEach(async () => {
      service = await createService('');
    });

    it('should return false for isEnabled when baseUrl is empty', () => {
      expect(service.isEnabled()).toBe(false);
    });

    it('should return null for generateUrls when disabled', () => {
      const result = service.generateUrls('https://example.com/image.jpg');
      expect(result).toBeNull();
    });
  });

  describe('when config returns undefined', () => {
    it('should handle missing imgproxy config gracefully', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ImgproxyService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      const svc = module.get<ImgproxyService>(ImgproxyService);
      expect(svc.isEnabled()).toBe(false);
      expect(svc.generateUrls('https://example.com/image.jpg')).toBeNull();
    });
  });
});
