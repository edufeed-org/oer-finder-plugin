import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OerQueryService } from './oer-query.service';
import { AssetUrlService } from './asset-url.service';
import { AdapterSearchService } from '../../adapter';
import { OpenEducationalResource } from '@edufeed-org/oer-entities';
import {
  createAssetUrlServiceMock,
  mockImgproxyUrls,
} from '../../../test/fixtures';

const createAdapterSearchServiceMock = () => ({
  searchAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  searchBySource: jest.fn().mockResolvedValue({ items: [], total: 0 }),
});

function createQueryBuilderMock(
  results: Partial<OpenEducationalResource>[] = [],
  total = 0,
) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(total),
    getMany: jest.fn().mockResolvedValue(results),
  };
  return qb;
}

const createOerRepositoryMock = (
  qbMock: ReturnType<typeof createQueryBuilderMock>,
) => ({
  createQueryBuilder: jest.fn().mockReturnValue(qbMock),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
});

function createOerEntity(
  overrides: Partial<OpenEducationalResource> = {},
): Partial<OpenEducationalResource> {
  return {
    id: 'uuid-1',
    url: 'https://example.com/image.jpg',
    source_name: 'nostr',
    license_uri: 'https://creativecommons.org/licenses/by/4.0/',
    file_mime_type: 'image/jpeg',
    metadata: { type: 'LearningResource', name: 'Test Resource' },
    metadata_type: 'Image',
    keywords: ['test', 'education'],
    name: 'Test Resource',
    description: 'A test resource',
    file_dim: '1920x1080',
    file_alt: 'Test image',
    file_size: 12345,
    attribution: 'Test Author',
    educational_level_uri:
      'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
    url_external_landing_page: 'https://example.com/landing',
    sources: [],
    ...overrides,
  };
}

describe('OerQueryService', () => {
  let service: OerQueryService;
  let assetUrlService: jest.Mocked<AssetUrlService>;
  let adapterSearchService: jest.Mocked<AdapterSearchService>;
  let queryBuilderMock: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    assetUrlService = createAssetUrlServiceMock({
      resolveResult: mockImgproxyUrls,
    });
    adapterSearchService =
      createAdapterSearchServiceMock() as unknown as jest.Mocked<AdapterSearchService>;
    queryBuilderMock = createQueryBuilderMock();

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
        {
          provide: getRepositoryToken(OpenEducationalResource),
          useValue: createOerRepositoryMock(queryBuilderMock),
        },
      ],
    }).compile();

    service = module.get<OerQueryService>(OerQueryService);
    assetUrlService = module.get(AssetUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll — adapter routing', () => {
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

    it('should route to openverse adapter when source is openverse', async () => {
      adapterSearchService.searchBySource.mockResolvedValue({
        items: [],
        total: 0,
      });

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'openverse',
      });

      expect(adapterSearchService.searchBySource).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'openverse' }),
        'openverse',
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
            source: 'arasaac',
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

      expect(assetUrlService.resolveAssetUrls).toHaveBeenCalledWith(
        null,
        'https://example.com/image.jpg',
      );
      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });
  });

  describe('findAll — nostr source (database query)', () => {
    it('should route to database query when source is nostr', async () => {
      const entity = createOerEntity();
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(adapterSearchService.searchBySource).not.toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should map entity to OerItem with correct structure', async () => {
      const entity = createOerEntity({
        url: 'https://example.com/photo.jpg',
        source_name: 'nostr',
        metadata: { type: 'LearningResource', name: 'Photo' },
        file_mime_type: 'image/jpeg',
        file_dim: '800x600',
        file_alt: 'A photo',
        attribution: 'Photographer',
        url_external_landing_page: 'https://example.com/landing',
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(result.data[0]).toEqual({
        amb: {
          type: 'LearningResource',
          name: 'Photo',
          id: 'https://example.com/photo.jpg',
        },
        extensions: {
          fileMetadata: { fileDim: '800x600', fileAlt: 'A photo' },
          images: mockImgproxyUrls,
          system: {
            source: 'nostr',
            foreignLandingUrl: 'https://example.com/landing',
            attribution: 'Photographer',
          },
        },
      });
    });

    it('should not mutate the original entity metadata', async () => {
      const metadata = { type: 'LearningResource' };
      const entity = createOerEntity({ metadata, url: 'https://example.com' });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      await service.findAll({ page: 1, pageSize: 20, source: 'nostr' });

      expect(metadata).toEqual({ type: 'LearningResource' });
      expect(metadata).not.toHaveProperty('id');
    });

    it('should apply pagination with skip and take', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(50);

      await service.findAll({ page: 3, pageSize: 10, source: 'nostr' });

      expect(queryBuilderMock.skip).toHaveBeenCalledWith(20);
      expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
    });

    it('should apply type filter using andWhere with Brackets', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
        type: 'image',
      });

      expect(queryBuilderMock.andWhere).toHaveBeenCalled();
    });

    it('should apply searchTerm filter using andWhere', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
        searchTerm: 'plants',
      });

      expect(queryBuilderMock.andWhere).toHaveBeenCalled();
    });

    it('should apply license filter with exact match', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
        license: 'https://creativecommons.org/licenses/by/4.0/',
      });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'oer.license_uri = :license',
        { license: 'https://creativecommons.org/licenses/by/4.0/' },
      );
    });

    it('should apply educational_level filter with exact match', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'oer.educational_level_uri = :educational_level',
        {
          educational_level:
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        },
      );
    });

    it('should apply language filter using JSONB containment', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      queryBuilderMock.getCount.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
        language: 'en',
      });

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        `oer.metadata->'inLanguage' @> :language::jsonb`,
        { language: '["en"]' },
      );
    });

    it('should return null images for non-image resources', async () => {
      const entity = createOerEntity({
        file_mime_type: 'application/pdf',
        metadata_type: 'Document',
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(result.data[0].extensions.images).toBeNull();
    });

    it('should resolve image URLs for image resources by MIME type', async () => {
      const entity = createOerEntity({
        file_mime_type: 'image/png',
        metadata_type: null,
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(assetUrlService.resolveAssetUrls).toHaveBeenCalled();
      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });

    it('should resolve image URLs for image resources by metadata_type', async () => {
      const entity = createOerEntity({
        file_mime_type: null,
        metadata_type: 'Image',
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });

    it('should return null fileMetadata when neither file_dim nor file_alt exists', async () => {
      const entity = createOerEntity({
        file_dim: null,
        file_alt: null,
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(result.data[0].extensions.fileMetadata).toBeNull();
    });

    it('should handle entity with null metadata gracefully', async () => {
      const entity = createOerEntity({
        metadata: null,
        url: 'https://example.com/resource',
      });
      queryBuilderMock.getMany.mockResolvedValue([entity]);
      queryBuilderMock.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        source: 'nostr',
      });

      expect(result.data[0].amb).toEqual({
        id: 'https://example.com/resource',
      });
    });
  });
});
