import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import {
  EventDeletionService,
  OER_REPOSITORY,
} from '../src/services/event-deletion.service';
import { OER_SOURCE_REPOSITORY } from '../src/services/nostr-event-database.service';
import type {
  OerSourceEntity,
  OpenEducationalResourceEntity,
} from '../src/types/entities.types';
import type { Event } from 'nostr-tools/core';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../src/constants/event-kinds.constants';
import { EventFactory } from '../src/testing';
import { SOURCE_NAME_NOSTR } from '../src/constants/source.constants';

/**
 * Represents a Nostr event stored in source_data.
 */
interface NostrEventData {
  id: string;
  kind: number;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig: string;
}

// Type for accessing private methods in tests
interface EventDeletionServiceWithPrivate {
  extractEventReferences(deleteEvent: Event): string[];
  validateDeletionRequest(
    deleteEvent: Event,
    referencedEventData: NostrEventData,
  ): boolean;
}

/**
 * Creates a mock OerSource with embedded Nostr event data.
 */
function createMockOerSource(
  eventId: string,
  kind: number,
  pubkey: string,
  overrides: Partial<OerSourceEntity> = {},
): OerSourceEntity {
  const eventData: NostrEventData = {
    id: eventId,
    kind,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    content: 'test content',
    tags: [],
    sig: 'test-sig',
  };

  return {
    id: `source-${eventId}`,
    oer_id: null,
    oer: null,
    source_name: SOURCE_NAME_NOSTR,
    source_identifier: `event:${eventId}`,
    source_data: eventData as unknown as Record<string, unknown>,
    status: 'pending',
    source_uri: 'wss://relay.example.com',
    source_timestamp: eventData.created_at,
    source_record_type: String(kind),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('EventDeletionService', () => {
  let service: EventDeletionService;
  let oerRepository: Repository<OpenEducationalResourceEntity>;
  let oerSourceRepository: Repository<OerSourceEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventDeletionService,
        {
          provide: OER_REPOSITORY,
          useValue: {
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              whereInIds: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            })),
          },
        },
        {
          provide: OER_SOURCE_REPOSITORY,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            delete: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    })
      .setLogger({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        fatal: jest.fn(),
      })
      .compile();

    service = module.get<EventDeletionService>(EventDeletionService);
    oerRepository =
      module.get<Repository<OpenEducationalResourceEntity>>(OER_REPOSITORY);
    oerSourceRepository = module.get<Repository<OerSourceEntity>>(
      OER_SOURCE_REPOSITORY,
    );
  });

  describe('extractEventReferences', () => {
    it('should extract event IDs from e tags', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        tags: [
          ['e', 'event1'],
          ['e', 'event2'],
          ['p', 'pubkey1'],
        ],
      });

      const eventIds = (
        service as unknown as EventDeletionServiceWithPrivate
      ).extractEventReferences(deleteEvent);
      expect(eventIds).toEqual(['event1', 'event2']);
    });

    it('should handle empty tags', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        tags: [],
      });

      const eventIds = (
        service as unknown as EventDeletionServiceWithPrivate
      ).extractEventReferences(deleteEvent);
      expect(eventIds).toEqual([]);
    });
  });

  describe('validateDeletionRequest', () => {
    it('should validate when pubkeys match', () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        pubkey: 'pubkey1',
        tags: [['e', 'event1']],
      });

      const eventData: NostrEventData = {
        id: 'event1',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        content: '',
        tags: [],
        sig: 'test-sig',
      };

      const isValid = (
        service as unknown as EventDeletionServiceWithPrivate
      ).validateDeletionRequest(deleteEvent, eventData);
      expect(isValid).toBe(true);
    });

    it('should reject when pubkeys do not match', () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        pubkey: 'pubkey1',
        tags: [['e', 'event1']],
      });

      const eventData: NostrEventData = {
        id: 'event1',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey2',
        created_at: Math.floor(Date.now() / 1000),
        content: '',
        tags: [],
        sig: 'test-sig',
      };

      const isValid = (
        service as unknown as EventDeletionServiceWithPrivate
      ).validateDeletionRequest(deleteEvent, eventData);
      expect(isValid).toBe(false);
    });
  });

  describe('processDeleteEvent', () => {
    it('should skip processing when no e tags present', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        tags: [],
      });

      await service.processDeleteEvent(deleteEvent);

      expect(oerSourceRepository.findOne).not.toHaveBeenCalled();
    });

    it('should skip deletion when referenced event not found', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        tags: [['e', 'event1']],
      });

      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(null);

      await service.processDeleteEvent(deleteEvent);

      expect(oerSourceRepository.findOne).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:event1',
        },
      });
      expect(oerSourceRepository.delete).not.toHaveBeenCalled();
    });

    it('should skip deletion when pubkeys do not match', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        pubkey: 'pubkey1',
        tags: [['e', 'event1']],
      });

      const mockSource = createMockOerSource(
        'event1',
        EVENT_AMB_KIND,
        'pubkey2',
      );

      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(mockSource);

      await service.processDeleteEvent(deleteEvent);

      expect(oerSourceRepository.findOne).toHaveBeenCalled();
      expect(oerSourceRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteEventAndCascade', () => {
    it('should delete event source for AMB events', async () => {
      const mockSource = createMockOerSource(
        'event1',
        EVENT_AMB_KIND,
        'pubkey1',
        {
          oer_id: 'oer1',
        },
      );

      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(mockSource);
      jest
        .spyOn(oerSourceRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });
      // Mock count for cascade check - return 0 remaining sources to trigger OER deletion
      jest.spyOn(oerSourceRepository, 'count').mockResolvedValue(0);
      (oerRepository as unknown as { delete: jest.Mock }).delete = jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('event1', EVENT_AMB_KIND);

      expect(oerSourceRepository.delete).toHaveBeenCalledWith({
        id: mockSource.id,
      });
    });

    it('should nullify file metadata and delete File event source', async () => {
      const mockFileSource = createMockOerSource(
        'file1',
        EVENT_FILE_KIND,
        'pubkey1',
        {
          oer_id: 'oer1',
        },
      );

      // Mock OerSource repository to return sources for this file event (for nullifyFileMetadataForEvent)
      jest.spyOn(oerSourceRepository, 'find').mockResolvedValue([
        createMockOerSource('file1', EVENT_FILE_KIND, 'pubkey1', {
          oer_id: 'oer1',
        }),
        createMockOerSource('file1', EVENT_FILE_KIND, 'pubkey1', {
          oer_id: 'oer2',
        }),
      ]);

      // Mock findOne for deleteEventAndCascade
      jest
        .spyOn(oerSourceRepository, 'findOne')
        .mockResolvedValue(mockFileSource);

      jest
        .spyOn(oerSourceRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('file1', EVENT_FILE_KIND);

      // Verify OerSource find was called with correct filter (for file metadata nullification)
      expect(oerSourceRepository.find).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:file1',
        },
      });

      // Verify query builder was used to update OER records
      expect(oerRepository.createQueryBuilder).toHaveBeenCalled();

      expect(oerSourceRepository.delete).toHaveBeenCalledWith({
        id: mockFileSource.id,
      });
    });

    it('should delete event source for other event kinds', async () => {
      const mockSource = createMockOerSource('event1', 1, 'pubkey1'); // Kind 1 (text note)

      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(mockSource);
      jest
        .spyOn(oerSourceRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('event1', 1);

      expect(oerSourceRepository.delete).toHaveBeenCalledWith({
        id: mockSource.id,
      });
    });

    it('should handle deletion of non-existent event', async () => {
      // Mock findOne to return null (source doesn't exist)
      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(null);

      await service.deleteEventAndCascade('nonexistent', EVENT_AMB_KIND);

      // Should call findOne to look for the source
      expect(oerSourceRepository.findOne).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:nonexistent',
        },
      });
      // Should NOT call delete since source wasn't found
      expect(oerSourceRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      const mockSource = createMockOerSource(
        'event1',
        EVENT_AMB_KIND,
        'pubkey1',
      );

      jest.spyOn(oerSourceRepository, 'findOne').mockResolvedValue(mockSource);
      jest
        .spyOn(oerSourceRepository, 'delete')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.deleteEventAndCascade('event1', EVENT_AMB_KIND),
      ).rejects.toThrow('Database error');
    });
  });
});
