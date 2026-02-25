import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { OerController } from './oer.controller';
import { OerQueryService } from '../services/oer-query.service';
import { OerItem } from '../dto/oer-response.dto';

// Mock ThrottlerGuard
class MockThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const createMockOerItem = (overrides?: Partial<OerItem>): OerItem => ({
  amb: {
    type: 'LearningResource',
    name: 'Test resource',
    id: 'https://example.com/resource',
    ...overrides?.amb,
  },
  extensions: {
    fileMetadata: null,
    images: null,
    system: {
      source: 'nostr-amb-relay',
      foreignLandingUrl: null,
      attribution: null,
    },
    ...overrides?.extensions,
  },
});

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
        data: [createMockOerItem()],
        total: 1,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({
        page: '1',
        pageSize: '20',
        source: 'nostr-amb-relay',
      });

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
        source: 'nostr-amb-relay',
      });
    });

    it('should calculate totalPages correctly', async () => {
      const mockResult = {
        data: [],
        total: 45,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({
        page: '1',
        pageSize: '20',
        source: 'nostr-amb-relay',
      });

      expect(result.meta.totalPages).toBe(3); // Math.ceil(45 / 20)
    });

    it('should handle zero results', async () => {
      const mockResult = {
        data: [],
        total: 0,
      };

      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.getOer({
        page: '1',
        pageSize: '20',
        source: 'nostr-amb-relay',
      });

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

      await controller.getOer({
        page: '5',
        pageSize: '10',
        source: 'nostr-amb-relay',
      });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 5,
          pageSize: 10,
        }),
      );
    });

    it('should pass filter parameters to query service', async () => {
      const mockResult = { data: [], total: 0 };
      jest.spyOn(queryService, 'findAll').mockResolvedValue(mockResult);

      await controller.getOer({
        page: '1',
        pageSize: '20',
        source: 'nostr-amb-relay',
        type: 'image',
        searchTerm: 'science',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        educational_level:
          'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        language: 'en',
      });

      expect(queryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'image',
          searchTerm: 'science',
          license: 'https://creativecommons.org/licenses/by/4.0/',
          educational_level:
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
          language: 'en',
        }),
      );
    });

    it('should throw 400 for invalid page number', async () => {
      await expect(
        controller.getOer({
          page: 'invalid',
          pageSize: '20',
          source: 'nostr-amb-relay',
        }),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.getOer({
          page: 'invalid',
          pageSize: '20',
          source: 'nostr-amb-relay',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }) as Error,
      );
    });

    it('should throw 400 for pageSize exceeding maximum', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '200',
          source: 'nostr-amb-relay',
        }),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.getOer({
          page: '1',
          pageSize: '200',
          source: 'nostr-amb-relay',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }) as Error,
      );
    });

    it('should throw 400 for page less than 1', async () => {
      await expect(
        controller.getOer({
          page: '0',
          pageSize: '20',
          source: 'nostr-amb-relay',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 400 for invalid language code format', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '20',
          source: 'nostr-amb-relay',
          language: 'english',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw 400 for missing source parameter', async () => {
      await expect(
        controller.getOer({
          page: '1',
          pageSize: '20',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should include validation error messages in response', async () => {
      try {
        await controller.getOer({
          page: '1',
          pageSize: '200', // Exceeds max
          source: 'nostr-amb-relay',
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

    it('should handle valibot validation errors correctly', async () => {
      const rawQuery = {
        page: 'abc', // Invalid number
        pageSize: '20',
        source: 'nostr-amb-relay',
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
