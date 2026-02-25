import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssetUrlService } from './asset-url.service';
import { ImgproxyService } from './imgproxy.service';
import { AssetSigningService } from './asset-signing.service';
import type { ImageUrls } from '../dto/oer-response.dto';

const mockImgproxyUrls: ImageUrls = {
  high: 'http://imgproxy:8080/insecure/rs:fit:0:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
  medium:
    'http://imgproxy:8080/insecure/rs:fit:400:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
  small:
    'http://imgproxy:8080/insecure/rs:fit:200:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
};

const mockSignedUrl =
  'http://localhost:3000/api/v1/assets/sig123?url=abc&exp=0';

const createMocks = (opts: {
  imgproxyEnabled?: boolean;
  signingEnabled?: boolean;
}) => {
  const imgproxyService = {
    isEnabled: jest.fn().mockReturnValue(opts.imgproxyEnabled ?? false),
    generateUrls: jest.fn().mockReturnValue(mockImgproxyUrls),
  } as unknown as jest.Mocked<ImgproxyService>;

  const assetSigningService = {
    isEnabled: jest.fn().mockReturnValue(opts.signingEnabled ?? false),
    generateSignedUrl: jest.fn().mockReturnValue(mockSignedUrl),
  } as unknown as jest.Mocked<AssetSigningService>;

  const configService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'app.port') return 3000;
      if (key === 'app.publicBaseUrl') return defaultValue;
      return defaultValue;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  return { imgproxyService, assetSigningService, configService };
};

describe('AssetUrlService', () => {
  const createService = async (opts: {
    imgproxyEnabled?: boolean;
    signingEnabled?: boolean;
  }) => {
    const mocks = createMocks(opts);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUrlService,
        { provide: ImgproxyService, useValue: mocks.imgproxyService },
        { provide: AssetSigningService, useValue: mocks.assetSigningService },
        { provide: ConfigService, useValue: mocks.configService },
      ],
    }).compile();

    return {
      service: module.get<AssetUrlService>(AssetUrlService),
      ...mocks,
    };
  };

  describe('when imgproxy is enabled', () => {
    it('should return imgproxy URLs from source URL when adapter has no images', async () => {
      const { service, imgproxyService } = await createService({
        imgproxyEnabled: true,
      });

      const result = service.resolveAssetUrls(
        null,
        'https://example.com/image.jpg',
      );

      expect(imgproxyService.generateUrls).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
      );
      expect(result).toEqual(mockImgproxyUrls);
    });

    it('should return adapter images as-is when adapter provides images', async () => {
      const { service, imgproxyService } = await createService({
        imgproxyEnabled: true,
      });
      const adapterImages: ImageUrls = {
        high: 'https://cdn.example.com/high.jpg',
        medium: 'https://cdn.example.com/medium.jpg',
        small: 'https://cdn.example.com/small.jpg',
      };

      const result = service.resolveAssetUrls(adapterImages, null);

      expect(imgproxyService.generateUrls).not.toHaveBeenCalled();
      expect(result).toEqual(adapterImages);
    });
  });

  describe('when imgproxy is disabled and signing is enabled', () => {
    it('should return signed URLs from source URL when adapter has no images', async () => {
      const { service, assetSigningService } = await createService({
        signingEnabled: true,
      });

      const result = service.resolveAssetUrls(
        null,
        'https://example.com/image.jpg',
      );

      expect(assetSigningService.generateSignedUrl).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        'http://localhost:3000',
      );
      expect(result).toEqual({
        high: mockSignedUrl,
        medium: mockSignedUrl,
        small: mockSignedUrl,
      });
    });

    it('should sign adapter-provided images when adapter provides images', async () => {
      const { service, assetSigningService } = await createService({
        signingEnabled: true,
      });
      const adapterImages: ImageUrls = {
        high: 'https://cdn.example.com/high.jpg',
        medium: 'https://cdn.example.com/medium.jpg',
        small: 'https://cdn.example.com/small.jpg',
      };

      const result = service.resolveAssetUrls(adapterImages, null);

      expect(assetSigningService.generateSignedUrl).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        high: mockSignedUrl,
        medium: mockSignedUrl,
        small: mockSignedUrl,
      });
    });
  });

  describe('when both are disabled', () => {
    it('should return source URL directly when adapter has no images', async () => {
      const { service } = await createService({});

      const result = service.resolveAssetUrls(
        null,
        'https://example.com/image.jpg',
      );

      expect(result).toEqual({
        high: 'https://example.com/image.jpg',
        medium: 'https://example.com/image.jpg',
        small: 'https://example.com/image.jpg',
      });
    });

    it('should return adapter images unchanged when adapter provides images', async () => {
      const { service } = await createService({});
      const adapterImages: ImageUrls = {
        high: 'https://cdn.example.com/high.jpg',
        medium: 'https://cdn.example.com/medium.jpg',
        small: 'https://cdn.example.com/small.jpg',
      };

      const result = service.resolveAssetUrls(adapterImages, null);

      expect(result).toEqual(adapterImages);
    });
  });

  describe('when source URL is null', () => {
    it('should return null regardless of configuration', async () => {
      const { service } = await createService({
        imgproxyEnabled: true,
        signingEnabled: true,
      });

      const result = service.resolveAssetUrls(null, null);

      expect(result).toBeNull();
    });
  });
});
