import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NostrEvent } from '../src/nostr/entities/nostr-event.entity';
import { OpenEducationalResource } from '../src/oer/entities/open-educational-resource.entity';
import { OerExtractionService } from '../src/oer/services/oer-extraction.service';
import { NostrClientService } from '../src/nostr/services/nostr-client.service';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { nostrEventFixtures } from './fixtures';

describe('OER Extraction Integration Tests (e2e)', () => {
  let app: INestApplication;
  let oerExtractionService: OerExtractionService;
  let nostrEventRepository: Repository<NostrEvent>;
  let oerRepository: Repository<OpenEducationalResource>;

  // Mock NostrClientService to prevent real relay connections
  const mockNostrClientService = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribeToOerEvents: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue({ connected: false }),
  };

  // Mock ThrottlerGuard to bypass rate limiting
  class MockThrottlerGuard {
    canActivate(): boolean {
      return true;
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

    oerExtractionService =
      moduleFixture.get<OerExtractionService>(OerExtractionService);
    nostrEventRepository = moduleFixture.get<Repository<NostrEvent>>(
      getRepositoryToken(NostrEvent),
    );
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

  it('should create OER record from kind 30142 (AMB) event with complete data', async () => {
    // Use pre-configured fixtures - they already reference each other correctly
    const fileEvent = nostrEventRepository.create(
      nostrEventFixtures.fileComplete(),
    );
    await nostrEventRepository.save(fileEvent);

    const ambEvent = nostrEventRepository.create(
      nostrEventFixtures.ambComplete(),
    );
    await nostrEventRepository.save(ambEvent);

    // Extract OER
    const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

    // Verify OER record was created with complete data from fixtures
    expect(oer).toBeDefined();
    expect(oer.id).toBeDefined();
    expect(oer.url).toBe('https://example.edu/diagram.png');
    expect(oer.amb_license_uri).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
    expect(oer.amb_free_to_use).toBe(true);
    expect(oer.file_mime_type).toBe('image/png');
    expect(oer.file_dim).toBe('1920x1080');
    expect(oer.file_size).toBe(245680);
    expect(oer.file_alt).toContain('diagram');
    expect(oer.amb_description).toContain('diagram');
    expect(oer.event_amb_id).toBe('amb-event-complete-fixture');
    expect(oer.event_file_id).toBe('file-event-complete-fixture');
    expect(oer.amb_keywords).toEqual(['photosynthesis', 'biology']);
    expect(oer.amb_metadata).toBeDefined();
    expect(oer.amb_metadata).toHaveProperty('learningResourceType');

    // Verify it was persisted to database
    const savedOer = await oerRepository.findOne({ where: { id: oer.id } });
    expect(savedOer).toBeDefined();
    expect(savedOer?.url).toBe('https://example.edu/diagram.png');
  });

  it('should create OER record with minimal data when fields are missing', async () => {
    const ambEvent = nostrEventRepository.create(
      nostrEventFixtures.ambMinimal({ id: 'amb-event-minimal' }),
    );
    await nostrEventRepository.save(ambEvent);

    const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

    expect(oer).toBeDefined();
    expect(oer.url).toBe('https://example.edu/resource.pdf');
    expect(oer.amb_license_uri).toBeNull();
    expect(oer.amb_free_to_use).toBeNull();
    expect(oer.file_mime_type).toBeNull();
    expect(oer.file_dim).toBeNull();
    expect(oer.file_size).toBeNull();
    expect(oer.file_alt).toBeNull();
    expect(oer.amb_description).toBeNull();
    expect(oer.event_amb_id).toBe('amb-event-minimal');
    expect(oer.event_file_id).toBeNull();
    expect(oer.amb_keywords).toBeNull();
    expect(oer.amb_metadata).toBeDefined();
  });

  it('should handle missing file event gracefully', async () => {
    const ambEvent = nostrEventRepository.create(
      nostrEventFixtures.ambMinimal({
        id: 'amb-event-missing-file',
        tags: [
          ['d', 'https://example.edu/resource.png'],
          ['type', 'LearningResource'],
          ['e', 'non-existent-file-event', 'wss://relay.example.com', 'file'],
        ],
      }),
    );
    await nostrEventRepository.save(ambEvent);

    const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

    expect(oer).toBeDefined();
    expect(oer.event_file_id).toBeNull(); // Should be null when file event doesn't exist
    expect(oer.file_mime_type).toBeNull();
    expect(oer.file_dim).toBeNull();
    expect(oer.file_size).toBeNull();
    expect(oer.file_alt).toBeNull();
  });

  it('should verify foreign key relationships work correctly', async () => {
    const fileEvent = nostrEventRepository.create(
      nostrEventFixtures.fileComplete({ id: 'file-event-fk' }),
    );
    await nostrEventRepository.save(fileEvent);

    const ambEvent = nostrEventRepository.create(
      nostrEventFixtures.ambMinimal({
        id: 'amb-event-fk',
        tags: [
          ['d', 'https://example.edu/image.jpg'],
          ['type', 'LearningResource'],
          ['e', 'file-event-fk', 'wss://relay.example.com', 'file'],
        ],
      }),
    );
    await nostrEventRepository.save(ambEvent);

    const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

    // Load with relations to verify foreign keys
    const savedOer = await oerRepository.findOne({
      where: { id: oer.id },
      relations: ['eventAmb', 'eventFile'],
    });

    expect(savedOer).toBeDefined();
    expect(savedOer?.eventAmb?.id).toBe('amb-event-fk');
    expect(savedOer?.eventFile?.id).toBe('file-event-fk');
  });

  it('should not extract OER for non-30142 events', async () => {
    const kind1Event = nostrEventRepository.create(
      nostrEventFixtures.ambMinimal({
        id: 'kind-1-event',
        kind: 1,
        content: 'Just a regular note',
        tags: [],
      }),
    );
    await nostrEventRepository.save(kind1Event);

    expect(oerExtractionService.shouldExtractOer(1)).toBe(false);

    const count = await oerRepository.count();
    expect(count).toBe(0);
  });

  it('should parse nested JSON metadata from colon-separated tags', async () => {
    const ambEvent = nostrEventRepository.create(
      nostrEventFixtures.ambMinimal({
        id: 'amb-event-nested',
        tags: [
          ['d', 'https://example.edu/resource'],
          ['learningResourceType:id', 'http://w3id.org/kim/hcrt/video'],
          ['learningResourceType:prefLabel:en', 'Video'],
          ['learningResourceType:prefLabel:de', 'Video'],
          ['about:id', 'http://example.org/topics/math'],
          ['about:prefLabel:en', 'Mathematics'],
          ['type', 'LearningResource'],
        ],
      }),
    );
    await nostrEventRepository.save(ambEvent);

    const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

    expect(oer.amb_metadata).toBeDefined();
    expect(oer.amb_metadata).toHaveProperty('learningResourceType');
    expect(oer.amb_metadata?.['learningResourceType']).toEqual({
      id: 'http://w3id.org/kim/hcrt/video',
      prefLabel: {
        en: 'Video',
        de: 'Video',
      },
    });
    expect(oer.amb_metadata?.['about']).toEqual({
      id: 'http://example.org/topics/math',
      prefLabel: {
        en: 'Mathematics',
      },
    });
    expect(oer.amb_metadata?.['type']).toBe('LearningResource');
  });

  describe('URL uniqueness and upsert behavior', () => {
    it('should create new OER when URL is unique', async () => {
      const ambEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'unique-event',
          tags: [
            ['d', 'https://example.edu/unique-resource.png'],
            ['type', 'Image'],
          ],
        }),
      );
      await nostrEventRepository.save(ambEvent);

      const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

      expect(oer).toBeDefined();
      expect(oer.url).toBe('https://example.edu/unique-resource.png');
      expect(oer.event_amb_id).toBe('unique-event');

      const count = await oerRepository.count({
        where: { url: 'https://example.edu/unique-resource.png' },
      });
      expect(count).toBe(1);
    });

    it('should update existing OER when new event is newer', async () => {
      // Create older event first
      const olderEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'older-event',
          created_at: 1000000000,
          tags: [
            ['d', 'https://example.edu/same-url.png'],
            ['license:id', 'https://old-license.org'],
            ['type', 'OldType'],
            ['dateCreated', '2024-01-10T10:00:00Z'],
          ],
        }),
      );
      await nostrEventRepository.save(olderEvent);

      const oer1 = await oerExtractionService.extractOerFromEvent(olderEvent);

      expect(oer1.url).toBe('https://example.edu/same-url.png');
      expect(oer1.amb_license_uri).toBe('https://old-license.org');
      expect(oer1.event_amb_id).toBe('older-event');
      const oer1Id = oer1.id;

      // Create newer event with same URL
      const newerEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'newer-event',
          created_at: 2000000000,
          tags: [
            ['d', 'https://example.edu/same-url.png'],
            ['license:id', 'https://new-license.org'],
            ['type', 'NewType'],
            ['dateCreated', '2024-02-20T10:00:00Z'],
          ],
        }),
      );
      await nostrEventRepository.save(newerEvent);

      const oer2 = await oerExtractionService.extractOerFromEvent(newerEvent);

      // Should be the same OER record (updated)
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.url).toBe('https://example.edu/same-url.png');
      expect(oer2.amb_license_uri).toBe('https://new-license.org');
      expect(oer2.event_amb_id).toBe('newer-event');

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/same-url.png' },
      });
      expect(count).toBe(1);
    });

    it('should not update existing OER when new event is older', async () => {
      // Create newer event first
      const newerEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'newer-event-first',
          created_at: 2000000000,
          tags: [
            ['d', 'https://example.edu/another-url.png'],
            ['license:id', 'https://newer-license.org'],
            ['type', 'NewerType'],
          ],
        }),
      );
      await nostrEventRepository.save(newerEvent);

      const oer1 = await oerExtractionService.extractOerFromEvent(newerEvent);

      expect(oer1.url).toBe('https://example.edu/another-url.png');
      expect(oer1.amb_license_uri).toBe('https://newer-license.org');
      expect(oer1.event_amb_id).toBe('newer-event-first');
      const oer1Id = oer1.id;

      // Try to insert older event with same URL
      const olderEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'older-event-after',
          created_at: 1000000000,
          tags: [
            ['d', 'https://example.edu/another-url.png'],
            ['license:id', 'https://older-license.org'],
            ['type', 'OlderType'],
          ],
        }),
      );
      await nostrEventRepository.save(olderEvent);

      const oer2 = await oerExtractionService.extractOerFromEvent(olderEvent);

      // Should return the same OER without updating
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.url).toBe('https://example.edu/another-url.png');
      expect(oer2.amb_license_uri).toBe('https://newer-license.org'); // Still the newer value
      expect(oer2.event_amb_id).toBe('newer-event-first'); // Still references newer event

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/another-url.png' },
      });
      expect(count).toBe(1);
    });

    it('should not update when events have same timestamp', async () => {
      const sameTimestamp = 1500000000;

      // Create first event
      const firstEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'first-event-same-time',
          created_at: sameTimestamp,
          tags: [
            ['d', 'https://example.edu/same-time.png'],
            ['license:id', 'https://first-license.org'],
            ['type', 'FirstType'],
          ],
        }),
      );
      await nostrEventRepository.save(firstEvent);

      const oer1 = await oerExtractionService.extractOerFromEvent(firstEvent);

      expect(oer1.amb_license_uri).toBe('https://first-license.org');
      const oer1Id = oer1.id;

      // Create second event with same timestamp
      const secondEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'second-event-same-time',
          created_at: sameTimestamp,
          tags: [
            ['d', 'https://example.edu/same-time.png'],
            ['license:id', 'https://second-license.org'],
            ['type', 'SecondType'],
          ],
        }),
      );
      await nostrEventRepository.save(secondEvent);

      const oer2 = await oerExtractionService.extractOerFromEvent(secondEvent);

      // Should not update (keeps first event's data)
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.amb_license_uri).toBe('https://first-license.org');
      expect(oer2.event_amb_id).toBe('first-event-same-time');

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/same-time.png' },
      });
      expect(count).toBe(1);
    });
  });

  describe('URI field extraction', () => {
    it('should extract educational_level_uri and audience_uri from AMB metadata', async () => {
      const ambEvent = nostrEventRepository.create(
        nostrEventFixtures.ambWithUris({ id: 'amb-event-with-uris' }),
      );
      await nostrEventRepository.save(ambEvent);

      const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      );
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );

      // Verify the full metadata structure is also preserved
      expect(oer.amb_metadata).toBeDefined();
      expect(oer.amb_metadata?.['educationalLevel']).toEqual({
        id: 'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        prefLabel: {
          en: 'Middle School',
        },
      });
      expect(oer.amb_metadata?.['audience']).toEqual({
        id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
        prefLabel: {
          en: 'Student',
        },
      });
    });

    it('should set URI fields to null when not present in metadata', async () => {
      const ambEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({ id: 'amb-event-no-uris' }),
      );
      await nostrEventRepository.save(ambEvent);

      const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBeNull();
      expect(oer.audience_uri).toBeNull();
    });

    it('should handle partial URI fields (only educational_level_uri)', async () => {
      const ambEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'amb-event-partial-uri-1',
          tags: [
            ['d', 'https://example.edu/resource-partial-1.pdf'],
            [
              'educationalLevel:id',
              'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
            ],
            ['type', 'LearningResource'],
          ],
        }),
      );
      await nostrEventRepository.save(ambEvent);

      const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
      );
      expect(oer.audience_uri).toBeNull();
    });

    it('should handle partial URI fields (only audience_uri)', async () => {
      const ambEvent = nostrEventRepository.create(
        nostrEventFixtures.ambMinimal({
          id: 'amb-event-partial-uri-2',
          tags: [
            ['d', 'https://example.edu/resource-partial-2.pdf'],
            [
              'audience:id',
              'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher',
            ],
            ['type', 'LearningResource'],
          ],
        }),
      );
      await nostrEventRepository.save(ambEvent);

      const oer = await oerExtractionService.extractOerFromEvent(ambEvent);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBeNull();
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher',
      );
    });
  });
});
