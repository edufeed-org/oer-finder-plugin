import { Test, TestingModule } from '@nestjs/testing';
import { OerQueryService } from './oer-query.service';
import { AssetUrlService } from './asset-url.service';
import { AdapterSearchService } from '../../adapter';
import {
  createAssetUrlServiceMock,
  mockImgproxyUrls,
} from '../../../test/fixtures';

const createAdapterSearchServiceMock = () => ({
  searchAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  searchBySource: jest.fn().mockResolvedValue({ items: [], total: 0 }),
});

describe('OerQueryService', () => {
  let service: OerQueryService;
  let assetUrlService: jest.Mocked<AssetUrlService>;
  let adapterSearchService: jest.Mocked<AdapterSearchService>;

  beforeEach(async () => {
    assetUrlService = createAssetUrlServiceMock({
      resolveResult: mockImgproxyUrls,
    });
    adapterSearchService =
      createAdapterSearchServiceMock() as unknown as jest.Mocked<AdapterSearchService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerQueryService,
        {
          provide: AssetUrlService,
          useValue: assetUrlService,
        },
        {
          provide: AdapterSearchService,
          useValue: adapterSearchService,
        },
      ],
    }).compile();

    service = module.get<OerQueryService>(OerQueryService);
    assetUrlService = module.get(AssetUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should route to adapter when source is specified', async () => {
      const mockAdapterItem = {
        id: 'ext-123',
        amb: {
          type: 'LearningResource',
          name: 'External resource',
          keywords: ['test'],
          license: {
            id: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
          },
          isAccessibleForFree: true,
        },
        extensions: {
          images: null,
          foreignLandingUrl: null,
          attribution: null,
          url: 'https://external.com/resource',
        },
        source: 'arasaac',
      };

      adapterSearchService.searchBySource.mockResolvedValue({
        items: [mockAdapterItem],
        total: 1,
      });

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'arasaac',
      });

      expect(adapterSearchService.searchBySource).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'arasaac' }),
        'arasaac',
      );
      expect(result.total).toBe(1);
      expect(result.data[0].extensions.system.source).toBe('arasaac');
      expect(result.data[0].amb.name).toBe('External resource');
    });

    it('should route to nostr-amb-relay adapter when source is nostr-amb-relay', async () => {
      adapterSearchService.searchBySource.mockResolvedValue({
        items: [],
        total: 0,
      });

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr-amb-relay',
      });

      expect(adapterSearchService.searchBySource).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'nostr-amb-relay' }),
        'nostr-amb-relay',
      );
    });

    it('should map adapter items with resolved image URLs when images are provided', async () => {
      const mockAdapterItem = {
        id: 'img-123',
        amb: {
          type: 'LearningResource',
          name: 'Image resource',
          id: 'https://example.com/image.jpg',
        },
        extensions: {
          images: mockImgproxyUrls,
          foreignLandingUrl: 'https://example.com/landing',
          attribution: 'Test Author',
        },
        source: 'nostr-amb-relay',
      };

      adapterSearchService.searchBySource.mockResolvedValue({
        items: [mockAdapterItem],
        total: 1,
      });

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr-amb-relay',
      });

      expect(assetUrlService.resolveAssetUrls).toHaveBeenCalledWith(
        mockImgproxyUrls,
        'https://example.com/image.jpg',
      );
      expect(result.data[0]).toEqual({
        amb: mockAdapterItem.amb,
        extensions: {
          fileMetadata: null,
          images: mockImgproxyUrls,
          system: {
            source: 'nostr-amb-relay',
            foreignLandingUrl: 'https://example.com/landing',
            attribution: 'Test Author',
          },
        },
      });
    });

    it('should resolve image URLs from amb.id when no images provided', async () => {
      const mockAdapterItem = {
        id: 'img-456',
        amb: {
          type: 'LearningResource',
          name: 'Image resource',
          id: 'https://example.com/image.jpg',
        },
        extensions: {
          images: null,
          foreignLandingUrl: null,
          attribution: null,
        },
        source: 'nostr-amb-relay',
      };

      adapterSearchService.searchBySource.mockResolvedValue({
        items: [mockAdapterItem],
        total: 1,
      });

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr-amb-relay',
      });

      expect(assetUrlService.resolveAssetUrls).toHaveBeenCalledWith(
        null,
        'https://example.com/image.jpg',
      );
      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });
  });
});
