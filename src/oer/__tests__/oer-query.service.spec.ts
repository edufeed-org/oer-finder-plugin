import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { OerQueryService } from '../services/oer-query.service';
import { ImgproxyService } from '../services/imgproxy.service';
import { OpenEducationalResource } from '@edufeed-org/oer-entities';
import { OerQueryDto } from '../dto/oer-query.dto';
import { AdapterSearchService } from '../../adapter';
import {
  oerFactoryHelpers,
  createQueryBuilderMock,
  createImgproxyServiceMock,
  mockImgproxyUrls,
} from '../../../test/fixtures';

const createAdapterSearchServiceMock = () => ({
  searchAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  searchBySource: jest.fn().mockResolvedValue({ items: [], total: 0 }),
});

describe('OerQueryService', () => {
  let service: OerQueryService;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<OpenEducationalResource>>;
  let imgproxyService: jest.Mocked<ImgproxyService>;
  let adapterSearchService: jest.Mocked<AdapterSearchService>;

  beforeEach(async () => {
    queryBuilder = createQueryBuilderMock<OpenEducationalResource>();
    imgproxyService = createImgproxyServiceMock();
    adapterSearchService =
      createAdapterSearchServiceMock() as unknown as jest.Mocked<AdapterSearchService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerQueryService,
        {
          provide: getRepositoryToken(OpenEducationalResource),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
        {
          provide: ImgproxyService,
          useValue: imgproxyService,
        },
        {
          provide: AdapterSearchService,
          useValue: adapterSearchService,
        },
      ],
    }).compile();

    service = module.get<OerQueryService>(OerQueryService);
    imgproxyService = module.get(ImgproxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should apply pagination with default values', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
      };

      await service.findAll(query);

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should apply pagination with custom page', async () => {
      const query: OerQueryDto = {
        page: 3,
        pageSize: 10,
      };

      await service.findAll(query);

      expect(queryBuilder.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply type filter with OR logic (MIME type and AMB type)', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        type: 'image',
      };

      await service.findAll(query);

      // Should be called with a Brackets function for OR logic
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      const callArgs = (queryBuilder.andWhere as jest.Mock).mock.calls[0];
      // First argument should be a Brackets instance (function gets wrapped)
      expect(typeof callArgs[0]).toBe('object');
    });

    it('should apply searchTerm filter with OR logic (keywords array, name, and description)', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        searchTerm: 'science',
      };

      await service.findAll(query);

      // Should be called with a Brackets function for OR logic
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      const callArgs = (queryBuilder.andWhere as jest.Mock).mock.calls[0];
      // First argument should be a Brackets instance (function gets wrapped)
      expect(typeof callArgs[0]).toBe('object');
    });

    it('should apply license filter with exact match', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.license_uri = :license',
        { license: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      );
    });

    it('should apply free_for_use filter', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        free_for_use: true,
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.free_to_use = :free_for_use',
        { free_for_use: true },
      );
    });

    it('should apply educational_level filter with exact match', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "oer.metadata->'educationalLevel'->>'id' = :educational_level",
        {
          educational_level:
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        },
      );
    });

    it('should apply language filter with JSON contains', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        language: 'en',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `oer.metadata->'inLanguage' @> :language::jsonb`,
        { language: '["en"]' },
      );
    });

    it('should apply multiple filters together', async () => {
      const query: OerQueryDto = {
        page: 2,
        pageSize: 50,
        type: 'video',
        free_for_use: true,
        language: 'fr',
      };

      await service.findAll(query);

      // Should call andWhere multiple times
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(queryBuilder.skip).toHaveBeenCalledWith(50); // (2-1) * 50
      expect(queryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should return correct result structure', async () => {
      const mockOer = oerFactoryHelpers.createOerForApiResponse();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([mockOer]);

      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
      };

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [
          expect.objectContaining({
            amb: expect.objectContaining({
              id: 'https://example.com/resource',
            }),
            extensions: expect.objectContaining({
              system: expect.objectContaining({
                source: 'nostr',
              }),
            }),
          }),
        ],
        total: 1,
      });

      // Verify AMB structure is present
      expect(result.data[0]).toHaveProperty('amb');
      expect(result.data[0]).toHaveProperty('extensions');

      // Verify AMB has id field (resource URL)
      expect(result.data[0].amb).toHaveProperty('id');
      expect(result.data[0].amb.id).toBe('https://example.com/resource');

      // Verify extensions structure
      expect(result.data[0].extensions).toHaveProperty('system');
      expect(result.data[0].extensions).toHaveProperty('fileMetadata');
      expect(result.data[0].extensions).toHaveProperty('images');

      // Verify system extensions have correct fields
      expect(result.data[0].extensions.system).toHaveProperty('source');
      expect(result.data[0].extensions.system).not.toHaveProperty('url');

      // Verify internal fields are no longer exposed
      expect(result.data[0].extensions.system).not.toHaveProperty('id');
      expect(result.data[0].extensions.system).not.toHaveProperty('created_at');
      expect(result.data[0].extensions.system).not.toHaveProperty('updated_at');

      // Verify old flattened fields are no longer present
      expect(result.data[0]).not.toHaveProperty('source_name');
      expect(result.data[0]).not.toHaveProperty('sources');
      expect(result.data[0]).not.toHaveProperty('creators');
      expect(result.data[0]).not.toHaveProperty('eventAmb');
      expect(result.data[0]).not.toHaveProperty('eventFile');
    });

    it('should include images URLs when resource is an image (by file_mime_type)', async () => {
      jest
        .spyOn(imgproxyService, 'generateUrls')
        .mockReturnValue(mockImgproxyUrls);

      const mockOer = oerFactoryHelpers.createImageOer();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(imgproxyService.generateUrls).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
      );
      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });

    it('should include images URLs when resource is an image (by metadata.type)', async () => {
      jest
        .spyOn(imgproxyService, 'generateUrls')
        .mockReturnValue(mockImgproxyUrls);

      const mockOer = oerFactoryHelpers.createImageOerByMetadataType();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(imgproxyService.generateUrls).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
      );
      expect(result.data[0].extensions.images).toEqual(mockImgproxyUrls);
    });

    it('should return null images when resource is not an image (video)', async () => {
      const mockOer = oerFactoryHelpers.createVideoOer();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

      const generateUrlsSpy = jest.spyOn(imgproxyService, 'generateUrls');

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.data[0].extensions.images).toBeNull();
      expect(generateUrlsSpy).not.toHaveBeenCalled();
    });

    it('should return null images when resource is not an image (pdf)', async () => {
      const mockOer = oerFactoryHelpers.createPdfOer();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

      const generateUrlsSpy = jest.spyOn(imgproxyService, 'generateUrls');

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.data[0].extensions.images).toBeNull();
      expect(generateUrlsSpy).not.toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(0);
      jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([]);

      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
      };

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [],
        total: 0,
      });
    });

    describe('source routing', () => {
      it('should query Nostr database when source is not specified', async () => {
        jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(0);
        jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([]);

        await service.findAll({ page: 1, pageSize: 20 });

        expect(queryBuilder.getMany).toHaveBeenCalled();
        expect(adapterSearchService.searchBySource).not.toHaveBeenCalled();
      });

      it('should query Nostr database when source is "nostr"', async () => {
        jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(0);
        jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([]);

        await service.findAll({ page: 1, pageSize: 20, source: 'nostr' });

        expect(queryBuilder.getMany).toHaveBeenCalled();
        expect(adapterSearchService.searchBySource).not.toHaveBeenCalled();
      });

      it('should query external adapter when source is specified', async () => {
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
            foreign_landing_url: null,
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
        expect(queryBuilder.getMany).not.toHaveBeenCalled();
        expect(result.total).toBe(1);
        expect(result.data[0].extensions.system.source).toBe('arasaac');
        expect(result.data[0].amb.name).toBe('External resource');
      });
    });
  });
});
