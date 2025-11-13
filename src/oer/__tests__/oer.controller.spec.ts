import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { OerController } from '../controllers/oer.controller';
import { OerQueryService } from '../services/oer-query.service';
import { OerFactory } from '../../../test/fixtures';
import type { OerItem } from '../dto/oer-response.dto';

// Mock ThrottlerGuard
class MockThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('OerController', () => {
  let controller: OerController;
  let queryService: OerQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OerController],
      providers: [
        {
          provide: OerQueryService,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .setLogger({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        fatal: jest.fn(),
      })
      .compile();

    controller = module.get<OerController>(OerController);
    queryService = module.get<OerQueryService>(OerQueryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOer', () => {
    it('should return OER list with pagination metadata', async () => {
      const mockResult = {
        data: [
          OerFactory.create({
            id: '123',
            url: 'https://example.com/resource',
            file_mime_type: 'image/png',
            amb_license_uri: 'https://creativecommons.org/licenses/by/4.0/',
            amb_free_to_use: true,
            amb_description: 'Test resource',
            amb_metadata: { type: 'LearningResource' },
            amb_keywords: ['test'],
            file_dim: '1920x1080',
            file_size: 100000,
            file_alt: 'Test image',
            amb_date_created: new Date('2024-01-01'),
            amb_date_published: new Date('2024-01-01'),
            amb_date_modified: new Date('2024-01-01'),
            event_amb_id: 'event123',
          }) as OerItem,
        ],
        total: 1,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({ page: '1', pageSize: '20' });

      expect(result).toEqual({
        data: mockResult.data,
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });

      expect(queryService.findAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
    });

    it('should calculate totalPages correctly', async () => {
      const mockResult = {
        data: [],
        total: 45,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({ page: '1', pageSize: '20' });

      expect(result.meta.totalPages).toBe(3); // Math.ceil(45 / 20)
    });

    it('should handle zero results', async () => {
      const mockResult = {
        data: [],
        total: 0,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({ page: '1', pageSize: '20' });

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      });
    });

    it('should validate and transform string page to number', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({ page: '5', pageSize: '10' });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 5,
          pageSize: 10,
        }),
      );
    });

    it('should validate and transform string boolean to boolean', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({
        page: '1',
        pageSize: '20',
        free_for_use: 'true',
      });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          free_for_use: true,
        }),
      );
    });

    it('should pass filter parameters to query service', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({
        page: '1',
        pageSize: '20',
        type: 'image',
        description: 'biology',
        name: 'textbook',
        keywords: 'science',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        free_for_use: 'true',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        language: 'en',
      });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'image',
          description: 'biology',
          name: 'textbook',
          keywords: 'science',
          license: 'https://creativecommons.org/licenses/by/4.0/',
          free_for_use: true,
          educational_level:
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
          language: 'en',
        }),
      );
    });

    it('should pass date range filters to query service', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({
        page: '1',
        pageSize: '20',
        date_created_from: '2024-01-01',
        date_created_to: '2024-12-31',
        date_published_from: '2024-06-01',
        date_published_to: '2024-06-30',
      });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          date_created_from: '2024-01-01',
          date_created_to: '2024-12-31',
          date_published_from: '2024-06-01',
          date_published_to: '2024-06-30',
        }),
      );
    });

    it('should throw 400 for invalid page number', async () => {
      await expect(
        controller.getOer({ page: 'invalid', pageSize: '20' }),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.getOer({ page: 'invalid', pageSize: '20' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }) as Error,
      );
    });

    it('should throw 400 for pageSize exceeding maximum', async () => {
      await expect(
        controller.getOer({ page: '1', pageSize: '200' }),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.getOer({ page: '1', pageSize: '200' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }) as Error,
      );
    });

    it('should throw 400 for page less than 1', async () => {
      await expect(
        controller.getOer({ page: '0', pageSize: '20' }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 400 for invalid boolean value', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '20',
          free_for_use: 'maybe',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 400 for invalid language code format', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '20',
          language: 'english',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 400 for invalid date format', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '20',
          date_created_from: 'not-a-date',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should include validation error messages in response', async () => {
      try {
        await controller.getOer({
          page: '1',
          pageSize: '200', // Exceeds max
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getResponse()).toEqual(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_REQUEST,
            message: expect.any(Array),
            error: 'Bad Request',
          }),
        );
      }
    });

    it('should use default values for missing pagination params', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({});

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        }),
      );
    });

    it('should handle valibot validation errors correctly', async () => {
      // This tests the error handling path for ValiError
      const rawQuery = {
        page: 'abc', // Invalid number
        pageSize: '20',
      };

      try {
        await controller.getOer(rawQuery);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);

        const response = error.getResponse();
        expect(response).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('error', 'Bad Request');
        expect(Array.isArray(response.message)).toBe(true);
      }
    });
  });
});
