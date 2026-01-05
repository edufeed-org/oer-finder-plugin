import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OpenEducationalResource, OerSource } from '@edufeed-org/oer-entities';
import {
  OerExtractionService,
  NostrEventDatabaseService,
  NostrClientService,
} from '@edufeed-org/oer-nostr';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Event } from 'nostr-tools/core';
import { nostrEventFixtures, NostrEventData } from './fixtures';

describe('OER Extraction Integration Tests (e2e)', () => {
  let app: INestApplication;
  let oerExtractionService: OerExtractionService;
  let nostrEventDatabaseService: NostrEventDatabaseService;
  let oerRepository: Repository<OpenEducationalResource>;
  let oerSourceRepository: Repository<OerSource>;

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
    nostrEventDatabaseService = moduleFixture.get<NostrEventDatabaseService>(
      NostrEventDatabaseService,
    );
    oerRepository = moduleFixture.get<Repository<OpenEducationalResource>>(
      getRepositoryToken(OpenEducationalResource),
    );
    oerSourceRepository = moduleFixture.get<Repository<OerSource>>(
      getRepositoryToken(OerSource),
    );
  });

  /**
   * Helper to convert NostrEventData to nostr-tools Event format
   */
  const toNostrEvent = (data: NostrEventData): Event => ({
    id: data.id,
    kind: data.kind,
    pubkey: data.pubkey,
    created_at: data.created_at,
    content: data.content,
    tags: data.tags,
    sig: 'test-signature',
  });

  /**
   * Helper to save an event and return its OerSource
   */
  const saveEvent = async (
    data: NostrEventData,
    relayUrl = 'wss://relay.example.com',
  ): Promise<OerSource> => {
    const event = toNostrEvent(data);
    const result = await nostrEventDatabaseService.saveEvent(event, relayUrl);
    if (!result.success) {
      throw new Error(`Failed to save event: ${result.reason}`);
    }
    return result.source;
  };

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear existing test data using query builder (TRUNCATE doesn't work with FK constraints)
    await oerSourceRepository.createQueryBuilder().delete().execute();
    await oerRepository.createQueryBuilder().delete().execute();
  });

  it('should create OER record from kind 30142 (AMB) event with complete data', async () => {
    // Use pre-configured fixtures - they already reference each other correctly
    const fileEventData = nostrEventFixtures.fileComplete();
    await saveEvent(fileEventData);

    const ambEventData = nostrEventFixtures.ambComplete();
    const ambSource = await saveEvent(ambEventData);

    // Extract OER
    const oer = await oerExtractionService.extractOerFromSource(ambSource);

    // Verify OER record was created with complete data from fixtures
    expect(oer).toBeDefined();
    expect(oer.id).toBeDefined();
    expect(oer.url).toBe('https://example.edu/diagram.png');
    expect(oer.license_uri).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
    expect(oer.free_to_use).toBe(true);
    expect(oer.file_mime_type).toBe('image/png');
    expect(oer.file_dim).toBe('1920x1080');
    expect(oer.file_size).toBe(245680);
    expect(oer.file_alt).toContain('diagram');
    expect(oer.description).toContain('diagram');

    expect(oer.keywords).toEqual(['photosynthesis', 'biology']);
    expect(oer.metadata).toBeDefined();
    expect(oer.metadata).toHaveProperty('learningResourceType');

    // Verify it was persisted to database
    const savedOer = await oerRepository.findOne({ where: { id: oer.id } });
    expect(savedOer).toBeDefined();
    expect(savedOer?.url).toBe('https://example.edu/diagram.png');
  });

  it('should create OER record with minimal data when fields are missing', async () => {
    const ambEventData = nostrEventFixtures.ambMinimal({
      id: 'amb-event-minimal',
    });
    const ambSource = await saveEvent(ambEventData);

    const oer = await oerExtractionService.extractOerFromSource(ambSource);

    expect(oer).toBeDefined();
    expect(oer.url).toBe('https://example.edu/resource.pdf');
    expect(oer.license_uri).toBeNull();
    expect(oer.free_to_use).toBeNull();
    expect(oer.file_mime_type).toBeNull();
    expect(oer.file_dim).toBeNull();
    expect(oer.file_size).toBeNull();
    expect(oer.file_alt).toBeNull();
    expect(oer.description).toBeNull();

    expect(oer.keywords).toBeNull();
    expect(oer.metadata).toBeDefined();
  });

  it('should handle missing file event gracefully', async () => {
    const ambEventData = nostrEventFixtures.ambMinimal({
      id: 'amb-event-missing-file',
      tags: [
        ['d', 'https://example.edu/resource.png'],
        ['type', 'LearningResource'],
        ['e', 'non-existent-file-event', 'wss://relay.example.com', 'file'],
      ],
    });
    const ambSource = await saveEvent(ambEventData);

    const oer = await oerExtractionService.extractOerFromSource(ambSource);

    expect(oer).toBeDefined();

    expect(oer.file_mime_type).toBeNull();
    expect(oer.file_dim).toBeNull();
    expect(oer.file_size).toBeNull();
    expect(oer.file_alt).toBeNull();
  });

  it('should verify foreign key relationships work correctly', async () => {
    const fileEventData = nostrEventFixtures.fileComplete({
      id: 'file-event-fk',
    });
    await saveEvent(fileEventData);

    const ambEventData = nostrEventFixtures.ambMinimal({
      id: 'amb-event-fk',
      tags: [
        ['d', 'https://example.edu/image.jpg'],
        ['type', 'LearningResource'],
        ['e', 'file-event-fk', 'wss://relay.example.com', 'file'],
      ],
    });
    const ambSource = await saveEvent(ambEventData);

    const oer = await oerExtractionService.extractOerFromSource(ambSource);

    // Load with relations to verify foreign keys
    const savedOer = await oerRepository.findOne({
      where: { id: oer.id },
      relations: ['sources'],
    });

    expect(savedOer).toBeDefined();
  });

  it('should not extract OER for non-30142 events', async () => {
    const kind1EventData = nostrEventFixtures.ambMinimal({
      id: 'kind-1-event',
      kind: 1,
      content: 'Just a regular note',
      tags: [],
    });
    await saveEvent(kind1EventData);

    expect(oerExtractionService.shouldExtractOer(1)).toBe(false);

    const count = await oerRepository.count();
    expect(count).toBe(0);
  });

  it('should parse nested JSON metadata from colon-separated tags', async () => {
    const ambEventData = nostrEventFixtures.ambMinimal({
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
    });
    const ambSource = await saveEvent(ambEventData);

    const oer = await oerExtractionService.extractOerFromSource(ambSource);

    expect(oer.metadata).toBeDefined();
    expect(oer.metadata).toHaveProperty('learningResourceType');
    expect(oer.metadata?.['learningResourceType']).toEqual({
      id: 'http://w3id.org/kim/hcrt/video',
      prefLabel: {
        en: 'Video',
        de: 'Video',
      },
    });
    expect(oer.metadata?.['about']).toEqual({
      id: 'http://example.org/topics/math',
      prefLabel: {
        en: 'Mathematics',
      },
    });
    expect(oer.metadata?.['type']).toBe('LearningResource');
  });

  describe('URL uniqueness and upsert behavior', () => {
    it('should create new OER when URL is unique', async () => {
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'unique-event',
        tags: [
          ['d', 'https://example.edu/unique-resource.png'],
          ['type', 'Image'],
        ],
      });
      const ambSource = await saveEvent(ambEventData);

      const oer = await oerExtractionService.extractOerFromSource(ambSource);

      expect(oer).toBeDefined();
      expect(oer.url).toBe('https://example.edu/unique-resource.png');

      const count = await oerRepository.count({
        where: { url: 'https://example.edu/unique-resource.png' },
      });
      expect(count).toBe(1);
    });

    it('should update existing OER when new event is newer', async () => {
      // Create older event first
      const olderEventData = nostrEventFixtures.ambMinimal({
        id: 'older-event',
        created_at: 1000000000,
        tags: [
          ['d', 'https://example.edu/same-url.png'],
          ['license:id', 'https://old-license.org'],
          ['type', 'OldType'],
          ['dateCreated', '2024-01-10T10:00:00Z'],
        ],
      });
      const olderSource = await saveEvent(olderEventData);

      const oer1 = await oerExtractionService.extractOerFromSource(olderSource);

      expect(oer1.url).toBe('https://example.edu/same-url.png');
      expect(oer1.license_uri).toBe('https://old-license.org');
      const oer1Id = oer1.id;

      // Create newer event with same URL
      const newerEventData = nostrEventFixtures.ambMinimal({
        id: 'newer-event',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/same-url.png'],
          ['license:id', 'https://new-license.org'],
          ['type', 'NewType'],
          ['dateCreated', '2024-02-20T10:00:00Z'],
        ],
      });
      const newerSource = await saveEvent(newerEventData);

      const oer2 = await oerExtractionService.extractOerFromSource(newerSource);

      // Should be the same OER record (updated)
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.url).toBe('https://example.edu/same-url.png');
      expect(oer2.license_uri).toBe('https://new-license.org');

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/same-url.png' },
      });
      expect(count).toBe(1);
    });

    it('should not update existing OER when new event is older', async () => {
      // Create newer event first
      const newerEventData = nostrEventFixtures.ambMinimal({
        id: 'newer-event-first',
        created_at: 2000000000,
        tags: [
          ['d', 'https://example.edu/another-url.png'],
          ['license:id', 'https://newer-license.org'],
          ['type', 'NewerType'],
        ],
      });
      const newerSource = await saveEvent(newerEventData);

      const oer1 = await oerExtractionService.extractOerFromSource(newerSource);

      expect(oer1.url).toBe('https://example.edu/another-url.png');
      expect(oer1.license_uri).toBe('https://newer-license.org');
      const oer1Id = oer1.id;

      // Try to insert older event with same URL
      const olderEventData = nostrEventFixtures.ambMinimal({
        id: 'older-event-after',
        created_at: 1000000000,
        tags: [
          ['d', 'https://example.edu/another-url.png'],
          ['license:id', 'https://older-license.org'],
          ['type', 'OlderType'],
        ],
      });
      const olderSource = await saveEvent(olderEventData);

      const oer2 = await oerExtractionService.extractOerFromSource(olderSource);

      // Should return the same OER without updating
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.url).toBe('https://example.edu/another-url.png');
      expect(oer2.license_uri).toBe('https://newer-license.org'); // Still the newer value

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/another-url.png' },
      });
      expect(count).toBe(1);
    });

    it('should not update when events have same timestamp', async () => {
      const sameTimestamp = 1500000000;

      // Create first event
      const firstEventData = nostrEventFixtures.ambMinimal({
        id: 'first-event-same-time',
        created_at: sameTimestamp,
        tags: [
          ['d', 'https://example.edu/same-time.png'],
          ['license:id', 'https://first-license.org'],
          ['type', 'FirstType'],
        ],
      });
      const firstSource = await saveEvent(firstEventData);

      const oer1 = await oerExtractionService.extractOerFromSource(firstSource);

      expect(oer1.license_uri).toBe('https://first-license.org');
      const oer1Id = oer1.id;

      // Create second event with same timestamp
      const secondEventData = nostrEventFixtures.ambMinimal({
        id: 'second-event-same-time',
        created_at: sameTimestamp,
        tags: [
          ['d', 'https://example.edu/same-time.png'],
          ['license:id', 'https://second-license.org'],
          ['type', 'SecondType'],
        ],
      });
      const secondSource = await saveEvent(secondEventData);

      const oer2 =
        await oerExtractionService.extractOerFromSource(secondSource);

      // Should not update (keeps first event's data)
      expect(oer2.id).toBe(oer1Id);
      expect(oer2.license_uri).toBe('https://first-license.org');

      // Verify only one record exists
      const count = await oerRepository.count({
        where: { url: 'https://example.edu/same-time.png' },
      });
      expect(count).toBe(1);
    });
  });

  describe('URI field extraction', () => {
    it('should extract educational_level_uri and audience_uri from AMB metadata', async () => {
      const ambEventData = nostrEventFixtures.ambWithUris({
        id: 'amb-event-with-uris',
      });
      const ambSource = await saveEvent(ambEventData);

      const oer = await oerExtractionService.extractOerFromSource(ambSource);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
      );
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
      );

      // Verify the full metadata structure is also preserved
      expect(oer.metadata).toBeDefined();
      expect(oer.metadata?.['educationalLevel']).toEqual({
        id: 'http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool',
        prefLabel: {
          en: 'Middle School',
        },
      });
      expect(oer.metadata?.['audience']).toEqual({
        id: 'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student',
        prefLabel: {
          en: 'Student',
        },
      });
    });

    it('should set URI fields to null when not present in metadata', async () => {
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-no-uris',
      });
      const ambSource = await saveEvent(ambEventData);

      const oer = await oerExtractionService.extractOerFromSource(ambSource);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBeNull();
      expect(oer.audience_uri).toBeNull();
    });

    it('should handle partial URI fields (only educational_level_uri)', async () => {
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-partial-uri-1',
        tags: [
          ['d', 'https://example.edu/resource-partial-1.pdf'],
          [
            'educationalLevel:id',
            'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
          ],
          ['type', 'LearningResource'],
        ],
      });
      const ambSource = await saveEvent(ambEventData);

      const oer = await oerExtractionService.extractOerFromSource(ambSource);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalLevel/highSchool',
      );
      expect(oer.audience_uri).toBeNull();
    });

    it('should handle partial URI fields (only audience_uri)', async () => {
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-partial-uri-2',
        tags: [
          ['d', 'https://example.edu/resource-partial-2.pdf'],
          [
            'audience:id',
            'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher',
          ],
          ['type', 'LearningResource'],
        ],
      });
      const ambSource = await saveEvent(ambEventData);

      const oer = await oerExtractionService.extractOerFromSource(ambSource);

      expect(oer).toBeDefined();
      expect(oer.educational_level_uri).toBeNull();
      expect(oer.audience_uri).toBe(
        'http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/teacher',
      );
    });
  });
});
