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
            id: '123',
            url: 'https://example.com/resource',
            source_name: 'nostr',
            sources: [],
            creators: [],
          }),
        ],
        total: 1,
      });

      // Verify internal relation fields are omitted
      expect(result.data[0]).not.toHaveProperty('eventAmb');
      expect(result.data[0]).not.toHaveProperty('eventFile');

      // Verify extended metadata fields are included (per expand-oer-api-response change)
      expect(result.data[0]).toHaveProperty('metadata');
      expect(result.data[0]).toHaveProperty('file_dim');
      expect(result.data[0]).toHaveProperty('file_size');
      expect(result.data[0]).toHaveProperty('file_alt');
      expect(result.data[0]).toHaveProperty('audience_uri');
      expect(result.data[0]).toHaveProperty('educational_level_uri');

      // Verify images, sources, and creators are included
      expect(result.data[0]).toHaveProperty('images');
      expect(result.data[0]).toHaveProperty('sources');
      expect(result.data[0]).toHaveProperty('source_name');
      expect(result.data[0]).toHaveProperty('creators');
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
      expect(result.data[0].images).toEqual(mockImgproxyUrls);
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
      expect(result.data[0].images).toEqual(mockImgproxyUrls);
    });

    it('should return null images when resource is not an image (video)', async () => {
      const mockOer = oerFactoryHelpers.createVideoOer();

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

      const generateUrlsSpy = jest.spyOn(imgproxyService, 'generateUrls');

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.data[0].images).toBeNull();
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

      expect(result.data[0].images).toBeNull();
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
          url: 'https://external.com/resource',
          description: 'External resource',
          keywords: ['test'],
          license_uri: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
          free_to_use: true,
          file_mime_type: 'image/png',
          file_size: null,
          file_dim: null,
          file_alt: null,
          images: null,
          source: 'arasaac',
          creators: [],
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
        expect(result.data[0].source_name).toBe('arasaac');
        expect(result.data[0].sources).toHaveLength(1);
        expect(result.data[0].sources[0].source_name).toBe('arasaac');
      });
    });
  });
});
