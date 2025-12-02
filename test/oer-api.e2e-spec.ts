import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OpenEducationalResource } from '../src/oer/entities/open-educational-resource.entity';
import { NostrClientService } from '../src/nostr/services/nostr-client.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OerFactory, testDataGenerators } from './fixtures';

describe('OER API (e2e)', () => {
  let app: INestApplication;
  let oerRepository: Repository<OpenEducationalResource>;

  // Mock NostrClientService to prevent real relay connections
  const mockNostrClientService = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribeToOerEvents: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue({ connected: false }),
  };

  // Mock ThrottlerGuard to bypass rate limiting in most tests
  class MockThrottlerGuard {
    canActivate(): boolean {
      return true; // Always allow requests
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NostrClientService)
      .useValue(mockNostrClientService)
      .overrideGuard(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    oerRepository = moduleFixture.get<Repository<OpenEducationalResource>>(
      getRepositoryToken(OpenEducationalResource),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear existing test data
    await oerRepository.clear();
  });

  describe('GET /api/v1/oer', () => {
    it('should return empty list when no OER exists', async () => {
      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      });
    });

    it('should return paginated OER list with default page size', async () => {
      // Create 25 test OER using factory
      const oers = testDataGenerators
        .generateOers(25)
        .map((oer) => oerRepository.create(oer));
      await oerRepository.save(oers);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body.data).toHaveLength(20);
      expect(response.body.meta).toEqual({
        total: 25,
        page: 1,
        pageSize: 20,
        totalPages: 2,
      });
    });

    it('should support custom page size', async () => {
      // Create 15 test OER using factory
      const oers = testDataGenerators
        .generateOers(15)
        .map((oer) => oerRepository.create(oer));
      await oerRepository.save(oers);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?pageSize=10')
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta.pageSize).toBe(10);
    });

    it('should reject pageSize exceeding maximum', async () => {
      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?pageSize=200')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should filter by type using OR logic (MIME type)', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/image.png',
            file_mime_type: 'image/png',
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/video.mp4',
            file_mime_type: 'video/mp4',
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/doc.pdf',
            file_mime_type: 'application/pdf',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=image')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].file_mime_type).toBe('image/png');
    });

    it('should filter by type using OR logic (AMB metadata type)', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource1.png',
            amb_metadata: { type: 'ImageObject' },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource2.mp4',
            amb_metadata: { type: 'VideoObject' },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=image')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].url).toContain('resource1');
    });

    it('should filter by type case-insensitively', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/image.png',
            file_mime_type: 'image/png',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=IMAGE')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by keywords searching in description', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/photo1.png',
            description: 'Photosynthesis diagram for biology',
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/chem1.png',
            description: 'Chemistry molecular structure',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?keywords=photo')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toContain('Photosynthesis');
    });

    it('should filter by keywords searching in AMB metadata name', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/bio.png',
            amb_metadata: { name: 'Biology Textbook' },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/math.png',
            amb_metadata: { name: 'Math Workbook' },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?keywords=biology')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by keywords', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/science1.png',
            keywords: ['biology', 'science', 'education'],
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/math1.png',
            keywords: ['mathematics', 'education'],
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?keywords=bio')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by license', async () => {
      const ccLicense = 'https://creativecommons.org/licenses/by-sa/4.0/';
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/free.png',
            license_uri: ccLicense,
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/proprietary.png',
            license_uri: 'https://example.com/license',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get(`/api/v1/oer?license=${encodeURIComponent(ccLicense)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].license_uri).toBe(ccLicense);
    });

    it('should filter by free_for_use', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/free.png',
            free_to_use: true,
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/paid.png',
            free_to_use: false,
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?free_for_use=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].free_to_use).toBe(true);
    });

    it('should filter by educational_level', async () => {
      const middleSchoolLevel =
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool';
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/middle.png',
            amb_metadata: {
              educationalLevel: { id: middleSchoolLevel },
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/high.png',
            amb_metadata: {
              educationalLevel: {
                id: 'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
              },
            },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get(
          `/api/v1/oer?educational_level=${encodeURIComponent(middleSchoolLevel)}`,
        )
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by language', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/english.png',
            amb_metadata: { inLanguage: ['en'] },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/french.png',
            amb_metadata: { inLanguage: ['fr'] },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/multi.png',
            amb_metadata: { inLanguage: ['en', 'fr', 'de'] },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?language=en')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should reject invalid language code format', async () => {
      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?language=english')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should combine multiple filters', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/match.png',
            file_mime_type: 'image/png',
            free_to_use: true,
            description: 'Educational photo',
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/no-match-type.png',
            file_mime_type: 'video/mp4',
            free_to_use: true,
            description: 'Educational photo',
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/no-match-free.png',
            file_mime_type: 'image/png',
            free_to_use: false,
            description: 'Educational photo',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=image&free_for_use=true&keywords=photo')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].url).toContain('match');
    });

    it('should enforce rate limiting', async () => {
      // Create a separate app instance with actual ThrottlerGuard for this test
      const rateLimitModuleFixture: TestingModule =
        await Test.createTestingModule({
          imports: [AppModule],
        })
          .overrideProvider(NostrClientService)
          .useValue(mockNostrClientService)
          // Don't override the guard - use the real ThrottlerGuard
          .compile();

      const rateLimitApp = rateLimitModuleFixture.createNestApplication();
      await rateLimitApp.init();

      try {
        // Make 10 requests (at the limit)
        for (let i = 0; i < 10; i++) {
          await request(rateLimitApp.getHttpServer() as never)
            .get('/api/v1/oer')
            .expect(200);
        }

        // 11th request should be rate limited
        const response = await request(rateLimitApp.getHttpServer() as never)
          .get('/api/v1/oer')
          .expect(429);

        expect(response.body.message).toContain('ThrottlerException');
      } finally {
        await rateLimitApp.close();
      }
    });

    it('should reject invalid boolean value', async () => {
      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?free_for_use=maybe')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should include event IDs in response', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource.png',
            event_amb_id: null,
            event_file_id: null,
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('event_amb_id');
      expect(response.body.data[0]).toHaveProperty('event_file_id');
    });

    it('should include extended fields in API response', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/extended-fields.png',
            amb_metadata: {
              type: 'ImageObject',
              learningResourceType: 'diagram',
            },
            file_dim: '1920x1080',
            file_size: 245680,
            file_alt: 'Educational diagram showing photosynthesis',
            audience_uri:
              'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
            educational_level_uri:
              'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      const oer = response.body.data[0];

      // Verify extended fields are present
      expect(oer).toHaveProperty('amb_metadata');
      expect(oer.amb_metadata).toEqual({
        type: 'ImageObject',
        learningResourceType: 'diagram',
      });
      expect(oer).toHaveProperty('file_dim');
      expect(oer.file_dim).toBe('1920x1080');
      expect(oer).toHaveProperty('file_size');
      // Note: bigint columns are returned as strings to prevent precision loss
      expect(oer.file_size).toBe('245680');
      expect(oer).toHaveProperty('file_alt');
      expect(oer.file_alt).toBe('Educational diagram showing photosynthesis');
      expect(oer).toHaveProperty('audience_uri');
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );
      expect(oer).toHaveProperty('educational_level_uri');
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      );
    });

    it('should handle null values for extended fields', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/null-fields.png',
            amb_metadata: null,
            file_dim: null,
            file_size: null,
            file_alt: null,
            audience_uri: null,
            educational_level_uri: null,
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      const oer = response.body.data[0];

      // Verify null values are properly returned
      expect(oer.amb_metadata).toBeNull();
      expect(oer.file_dim).toBeNull();
      expect(oer.file_size).toBeNull();
      expect(oer.file_alt).toBeNull();
      expect(oer.audience_uri).toBeNull();
      expect(oer.educational_level_uri).toBeNull();
    });
  });
});
