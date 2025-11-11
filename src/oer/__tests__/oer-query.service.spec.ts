import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { OerQueryService } from '../services/oer-query.service';
import { OpenEducationalResource } from '../entities/open-educational-resource.entity';
import { OerQueryDto } from '../dto/oer-query.dto';

describe('OerQueryService', () => {
  let service: OerQueryService;
  let queryBuilder: SelectQueryBuilder<OpenEducationalResource>;

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    } as unknown as SelectQueryBuilder<OpenEducationalResource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OerQueryService,
        {
          provide: getRepositoryToken(OpenEducationalResource),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<OerQueryService>(OerQueryService);
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

    it('should apply description filter with LIKE', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        description: 'biology',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(oer.amb_description) LIKE LOWER(:description)',
        { description: '%biology%' },
      );
    });

    it('should apply name filter with LIKE', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        name: 'textbook',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "LOWER(oer.amb_metadata->>'name') LIKE LOWER(:name)",
        { name: '%textbook%' },
      );
    });

    it('should apply keywords filter with EXISTS query', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        keywords: 'science',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        { keywords: '%science%' },
      );
    });

    it('should apply license filter with exact match', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_license_uri = :license',
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
        'oer.amb_free_to_use = :free_for_use',
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
        "oer.amb_metadata->'educationalLevel'->>'id' = :educational_level",
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
        `oer.amb_metadata->'inLanguage' @> :language::jsonb`,
        { language: '["en"]' },
      );
    });

    it('should apply date_created_from filter', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_created_from: '2024-01-01',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_created >= :date_created_from',
        { date_created_from: '2024-01-01' },
      );
    });

    it('should apply date_created_to filter with end of day', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_created_to: '2024-12-31',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_created <= :date_created_to',
        expect.objectContaining({
          date_created_to: expect.stringContaining('2024-12-31T23:59:59'),
        }),
      );
    });

    it('should apply date_published_from filter', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_published_from: '2024-06-01',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_published >= :date_published_from',
        { date_published_from: '2024-06-01' },
      );
    });

    it('should apply date_published_to filter with end of day', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_published_to: '2024-06-30',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_published <= :date_published_to',
        expect.objectContaining({
          date_published_to: expect.stringContaining('2024-06-30T23:59:59'),
        }),
      );
    });

    it('should apply date_modified_from filter', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_modified_from: '2024-03-01',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_modified >= :date_modified_from',
        { date_modified_from: '2024-03-01' },
      );
    });

    it('should apply date_modified_to filter with end of day', async () => {
      const query: OerQueryDto = {
        page: 1,
        pageSize: 20,
        date_modified_to: '2024-03-31',
      };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'oer.amb_date_modified <= :date_modified_to',
        expect.objectContaining({
          date_modified_to: expect.stringContaining('2024-03-31T23:59:59'),
        }),
      );
    });

    it('should apply multiple filters together', async () => {
      const query: OerQueryDto = {
        page: 2,
        pageSize: 50,
        type: 'video',
        description: 'chemistry',
        free_for_use: true,
        language: 'fr',
        date_created_from: '2024-01-01',
        date_created_to: '2024-12-31',
      };

      await service.findAll(query);

      // Should call andWhere multiple times
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(6);
      expect(queryBuilder.skip).toHaveBeenCalledWith(50); // (2-1) * 50
      expect(queryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should return correct result structure', async () => {
      const mockOer = {
        id: '123',
        url: 'https://example.com/resource',
        file_mime_type: 'image/png',
        amb_license_uri: 'https://creativecommons.org/licenses/by/4.0/',
        amb_free_to_use: true,
        amb_description: 'Test resource',
        amb_keywords: ['test', 'education'],
        amb_date_created: new Date('2024-01-01'),
        amb_date_published: new Date('2024-01-01'),
        amb_date_modified: new Date('2024-01-01'),
        event_amb_id: 'event123',
        event_file_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        // Internal relation fields that should be omitted
        eventAmb: null,
        eventFile: null,
        // Extended metadata fields that are now included in API response
        amb_metadata: {},
        file_dim: null,
        file_size: null,
        file_alt: null,
        audience_uri: null,
        educational_level_uri: null,
      };

      jest.spyOn(queryBuilder, 'getCount').mockResolvedValue(1);
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValue([mockOer as OpenEducationalResource]);

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
          }),
        ],
        total: 1,
      });

      // Verify internal relation fields are omitted
      expect(result.data[0]).not.toHaveProperty('eventAmb');
      expect(result.data[0]).not.toHaveProperty('eventFile');

      // Verify extended metadata fields are included (per expand-oer-api-response change)
      expect(result.data[0]).toHaveProperty('amb_metadata');
      expect(result.data[0]).toHaveProperty('file_dim');
      expect(result.data[0]).toHaveProperty('file_size');
      expect(result.data[0]).toHaveProperty('file_alt');
      expect(result.data[0]).toHaveProperty('audience_uri');
      expect(result.data[0]).toHaveProperty('educational_level_uri');
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
  });
});
