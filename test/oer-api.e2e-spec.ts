import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OpenEducationalResource, OerSource } from '@edufeed-org/oer-entities';
import { NostrClientService } from '@edufeed-org/oer-nostr';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OerFactory, testDataGenerators } from './fixtures';

describe('OER API (e2e)', () => {
  let app: INestApplication;
  let oerRepository: Repository<OpenEducationalResource>;
  let oerSourceRepository: Repository<OerSource>;

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
    oerSourceRepository = moduleFixture.get<Repository<OerSource>>(
      getRepositoryToken(OerSource),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear existing test data using query builder (TRUNCATE doesn't work with FK constraints)
    await oerSourceRepository.createQueryBuilder().delete().execute();
    await oerRepository.createQueryBuilder().delete().execute();
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
      // File MIME type should be in AMB encoding field
      // For now we don't have it there, so fileMetadata is null since no dim/alt
      expect(response.body.data[0].extensions.fileMetadata).toBeNull();
    });

    it('should filter by type using OR logic (AMB metadata type)', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource1.png',
            metadata: { type: 'ImageObject' },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource2.mp4',
            metadata: { type: 'VideoObject' },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=image')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amb.id).toContain('resource1');
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

    it('should filter by searchTerm searching in description', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/photo1.png',
            description: 'Photosynthesis diagram for biology',
            metadata: {
              description: 'Photosynthesis diagram for biology',
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/chem1.png',
            description: 'Chemistry molecular structure',
            metadata: {
              description: 'Chemistry molecular structure',
            },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?searchTerm=photo')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amb.description).toContain('Photosynthesis');
    });

    it('should filter by searchTerm searching in AMB metadata name', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/bio.png',
            metadata: { name: 'Biology Textbook' },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/math.png',
            metadata: { name: 'Math Workbook' },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?searchTerm=biology')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by searchTerm searching in keywords array', async () => {
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
        .get('/api/v1/oer?searchTerm=bio')
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
            metadata: {
              license: { id: ccLicense },
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/proprietary.png',
            license_uri: 'https://example.com/license',
            metadata: {
              license: { id: 'https://example.com/license' },
            },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get(`/api/v1/oer?license=${encodeURIComponent(ccLicense)}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      // License is stored in AMB format as an object or can be accessed via database field
      const license = response.body.data[0].amb.license;
      expect(license?.id || license).toBe(ccLicense);
    });

    it('should filter by free_for_use', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/free.png',
            free_to_use: true,
            metadata: {
              isAccessibleForFree: true,
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/paid.png',
            free_to_use: false,
            metadata: {
              isAccessibleForFree: false,
            },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?free_for_use=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amb.isAccessibleForFree).toBe(true);
    });

    it('should filter by educational_level', async () => {
      const middleSchoolLevel =
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool';
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/middle.png',
            metadata: {
              educationalLevel: { id: middleSchoolLevel },
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/high.png',
            metadata: {
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
            metadata: { inLanguage: ['en'] },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/french.png',
            metadata: { inLanguage: ['fr'] },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/multi.png',
            metadata: { inLanguage: ['en', 'fr', 'de'] },
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
            metadata: {
              description: 'Educational photo',
              isAccessibleForFree: true,
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/no-match-type.png',
            file_mime_type: 'video/mp4',
            free_to_use: true,
            description: 'Educational photo',
            metadata: {
              description: 'Educational photo',
              isAccessibleForFree: true,
            },
          }),
        ),
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/no-match-free.png',
            file_mime_type: 'image/png',
            free_to_use: false,
            description: 'Educational photo',
            metadata: {
              description: 'Educational photo',
              isAccessibleForFree: false,
            },
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer?type=image&free_for_use=true&searchTerm=photo')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amb.id).toContain('match');
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

    it('should include source in system extensions', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/resource.png',
          }),
        ),
      ]);

      const response = await request(app.getHttpServer() as never)
        .get('/api/v1/oer')
        .expect(200);

      expect(response.body.data[0].extensions).toHaveProperty('system');
      expect(response.body.data[0].extensions.system).toHaveProperty('source');
      expect(response.body.data[0].extensions.system.source).toBe('nostr');
    });

    it('should include extended fields in API response', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/extended-fields.png',
            metadata: {
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

      // Verify AMB metadata is present
      expect(oer).toHaveProperty('amb');
      expect(oer.amb).toMatchObject({
        type: 'ImageObject',
        learningResourceType: 'diagram',
      });
      // Verify file metadata extensions
      expect(oer.extensions).toHaveProperty('fileMetadata');
      expect(oer.extensions.fileMetadata.fileDim).toBe('1920x1080');
      expect(oer.extensions.fileMetadata.fileAlt).toBe(
        'Educational diagram showing photosynthesis',
      );
      // Note: file_size and file_mime_type should be in AMB encoding field
      // Note: audience and educational_level would be in AMB metadata if set
      // These are stored in the database but mapped to AMB fields
    });

    it('should handle null values for extended fields', async () => {
      await oerRepository.save([
        oerRepository.create(
          OerFactory.create({
            url: 'https://example.edu/null-fields.png',
            metadata: null,
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

      // Verify AMB and extensions structure exists even with null metadata
      expect(oer).toHaveProperty('amb');
      expect(oer).toHaveProperty('extensions');
      // File metadata should be null when no dimensions or alt text exists
      expect(oer.extensions.fileMetadata).toBeNull();
    });
  });
});
