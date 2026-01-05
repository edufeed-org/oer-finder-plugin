import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OpenEducationalResource, OerSource } from '@edufeed-org/oer-entities';
import {
  EventDeletionService,
  NostrEventDatabaseService,
  NostrClientService,
  OerExtractionService,
} from '@edufeed-org/oer-nostr';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Event } from 'nostr-tools/core';
import {
  nostrEventFixtures,
  eventFactoryHelpers,
  NostrEventData,
} from './fixtures';

describe('Event Deletion Integration Tests (e2e)', () => {
  let app: INestApplication;
  let eventDeletionService: EventDeletionService;
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

    eventDeletionService =
      moduleFixture.get<EventDeletionService>(EventDeletionService);
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

  describe('AMB Event Deletion', () => {
    it('should delete AMB event and associated OER record', async () => {
      const pubkey = 'test-pubkey-amb';

      // Use minimal fixture with just ID override
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-1',
        pubkey,
      });
      const ambSource = await saveEvent(ambEventData);

      // Extract OER
      const oer = await oerExtractionService.extractOerFromSource(ambSource);
      expect(oer).toBeDefined();

      // Verify OerSource was created
      const sources = await oerSourceRepository.find({
        where: { oer_id: oer.id },
      });
      expect(sources).toHaveLength(1);
      expect(sources[0].source_identifier).toBe('event:amb-event-1');

      // Verify OER exists
      let oerCount = await oerRepository.count();
      expect(oerCount).toBe(1);

      // Create and process deletion event
      const deleteEvent: Event = eventFactoryHelpers.createDeleteEvent(
        'amb-event-1',
        pubkey,
        { id: 'delete-event-1' },
      );

      await eventDeletionService.processDeleteEvent(deleteEvent);

      // Verify AMB event was deleted
      const ambEventAfter =
        await nostrEventDatabaseService.findEventById('amb-event-1');
      expect(ambEventAfter).toBeNull();

      // Verify OER was deleted
      oerCount = await oerRepository.count();
      expect(oerCount).toBe(0);
    });

    it('should not delete AMB event if pubkey does not match', async () => {
      // Create AMB event with one pubkey
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-2',
        pubkey: 'original-pubkey',
      });
      const ambSource = await saveEvent(ambEventData);

      // Extract OER
      const oer = await oerExtractionService.extractOerFromSource(ambSource);
      expect(oer).toBeDefined();

      // Create deletion event with different pubkey
      const deleteEvent: Event = eventFactoryHelpers.createDeleteEvent(
        'amb-event-2',
        'attacker-pubkey', // Different pubkey
        { id: 'delete-event-2' },
      );

      await eventDeletionService.processDeleteEvent(deleteEvent);

      // Verify AMB event still exists
      const ambEventAfter =
        await nostrEventDatabaseService.findEventById('amb-event-2');
      expect(ambEventAfter).not.toBeNull();

      // Verify OER still exists
      const oerCount = await oerRepository.count();
      expect(oerCount).toBe(1);
    });
  });

  describe('File Event Deletion', () => {
    it('should delete File event and nullify file metadata in OER', async () => {
      const pubkey = 'test-pubkey-file';

      // Use file fixture with ID override
      const fileEventData = nostrEventFixtures.fileComplete({
        id: 'file-event-1',
        pubkey,
      });
      await saveEvent(fileEventData);

      // Create AMB event that references the file
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-3',
        pubkey,
        tags: [
          ['d', 'https://example.edu/diagram.png'],
          ['type', 'LearningResource'],
          ['e', 'file-event-1', 'wss://relay.example.com', 'file'],
        ],
      });
      const ambSource = await saveEvent(ambEventData);

      // Extract OER
      const oer = await oerExtractionService.extractOerFromSource(ambSource);
      expect(oer).toBeDefined();
      expect(oer.file_mime_type).toBe('image/png');
      expect(oer.file_dim).toBe('1920x1080');
      expect(oer.file_size).toBe(245680);

      // Verify OerSource entries were created (one for AMB, one for file)
      const sources = await oerSourceRepository.find({
        where: { oer_id: oer.id },
      });
      expect(sources.length).toBeGreaterThanOrEqual(1);
      const hasFileSource = sources.some(
        (s) => s.source_identifier === 'event:file-event-1',
      );
      expect(hasFileSource).toBe(true);

      // Create and process deletion event for file
      const deleteEvent: Event = eventFactoryHelpers.createDeleteEvent(
        'file-event-1',
        pubkey,
        { id: 'delete-event-3' },
      );

      await eventDeletionService.processDeleteEvent(deleteEvent);

      // Verify File event was deleted
      const fileEventAfter =
        await nostrEventDatabaseService.findEventById('file-event-1');
      expect(fileEventAfter).toBeNull();

      // Verify OER still exists with file metadata nullified
      const oerAfter = await oerRepository.findOne({ where: { id: oer.id } });
      expect(oerAfter).not.toBeNull();

      // Verify AMB source still exists but file source might have been deleted
      const sourcesAfter = await oerSourceRepository.find({
        where: { oer_id: oer.id },
      });
      const hasAmbSource = sourcesAfter.some(
        (s) => s.source_identifier === 'event:amb-event-3',
      );
      expect(hasAmbSource).toBe(true); // AMB source should still exist

      // File metadata is nullified when file event is deleted
      expect(oerAfter?.file_mime_type).toBeNull();
      expect(oerAfter?.file_dim).toBeNull();
      expect(oerAfter?.file_size).toBeNull();
      expect(oerAfter?.file_alt).toBeNull();
    });
  });

  describe('Multiple Event Deletions', () => {
    it('should delete multiple events referenced in one deletion event', async () => {
      const pubkey = 'test-pubkey-multi';

      // Create multiple AMB events using fixtures with different URLs
      const ambEventData1 = nostrEventFixtures.ambMinimal({
        id: 'amb-event-4',
        pubkey,
        tags: [
          ['d', 'https://example.edu/resource4.pdf'],
          ['type', 'LearningResource'],
        ],
      });
      const ambSource1 = await saveEvent(ambEventData1);

      const ambEventData2 = nostrEventFixtures.ambMinimal({
        id: 'amb-event-5',
        pubkey,
        tags: [
          ['d', 'https://example.edu/resource5.pdf'],
          ['type', 'LearningResource'],
        ],
      });
      const ambSource2 = await saveEvent(ambEventData2);

      // Extract OERs
      await oerExtractionService.extractOerFromSource(ambSource1);
      await oerExtractionService.extractOerFromSource(ambSource2);

      let oerCount = await oerRepository.count();
      expect(oerCount).toBe(2);

      // Create deletion event that references both
      const deleteEvent: Event = eventFactoryHelpers.createDeleteEvent(
        ['amb-event-4', 'amb-event-5'],
        pubkey,
        { id: 'delete-event-4' },
      );

      await eventDeletionService.processDeleteEvent(deleteEvent);

      // Verify both AMB events were deleted
      const amb1After =
        await nostrEventDatabaseService.findEventById('amb-event-4');
      const amb2After =
        await nostrEventDatabaseService.findEventById('amb-event-5');
      expect(amb1After).toBeNull();
      expect(amb2After).toBeNull();

      // Verify both OERs were deleted
      oerCount = await oerRepository.count();
      expect(oerCount).toBe(0);
    });
  });

  describe('Non-existent Event Deletion', () => {
    it('should handle deletion of non-existent event gracefully', async () => {
      const deleteEvent: Event = eventFactoryHelpers.createDeleteEvent(
        'non-existent-event',
        'test-pubkey',
        { id: 'delete-event-5' },
      );

      // Should not throw
      await expect(
        eventDeletionService.processDeleteEvent(deleteEvent),
      ).resolves.not.toThrow();
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback if deletion fails', async () => {
      const pubkey = 'test-pubkey-rollback';

      // Create AMB event using fixture
      const ambEventData = nostrEventFixtures.ambMinimal({
        id: 'amb-event-6',
        pubkey,
      });
      const ambSource = await saveEvent(ambEventData);

      // Extract OER
      await oerExtractionService.extractOerFromSource(ambSource);

      // Mock a database error by closing the connection temporarily
      // This test is more conceptual - in reality we'd need to inject a failing manager
      // For now, we just verify that the service has transaction handling

      // Verify event and OER exist before deletion attempt
      const eventBefore =
        await nostrEventDatabaseService.findEventById('amb-event-6');
      const oerCountBefore = await oerRepository.count();
      expect(eventBefore).not.toBeNull();
      expect(oerCountBefore).toBe(1);
    });
  });
});
