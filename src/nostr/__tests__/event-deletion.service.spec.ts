import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventDeletionService } from '../services/event-deletion.service';
import { NostrEvent } from '../entities/nostr-event.entity';
import { OpenEducationalResource } from '../../oer/entities/open-educational-resource.entity';
import type { Event } from 'nostr-tools/core';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
} from '../constants/event-kinds.constants';
import { EventFactory, NostrEventFactory } from '../../../test/fixtures';

// Type for accessing private methods in tests
interface EventDeletionServiceWithPrivate {
  extractEventReferences(deleteEvent: Event): string[];
  validateDeletionRequest(
    deleteEvent: Event,
    referencedEvent: NostrEvent,
  ): boolean;
}

describe('EventDeletionService', () => {
  let service: EventDeletionService;
  let nostrEventRepository: Repository<NostrEvent>;
  let oerRepository: Repository<OpenEducationalResource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventDeletionService,
        {
          provide: getRepositoryToken(NostrEvent),
          useValue: {
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OpenEducationalResource),
          useValue: {
            update: jest.fn(),
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
    nostrEventRepository = module.get<Repository<NostrEvent>>(
      getRepositoryToken(NostrEvent),
    );
    oerRepository = module.get<Repository<OpenEducationalResource>>(
      getRepositoryToken(OpenEducationalResource),
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

      const referencedEvent = NostrEventFactory.create({
        id: 'event1',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey1',
      });

      const isValid = (
        service as unknown as EventDeletionServiceWithPrivate
      ).validateDeletionRequest(deleteEvent, referencedEvent);
      expect(isValid).toBe(true);
    });

    it('should reject when pubkeys do not match', () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        pubkey: 'pubkey1',
        tags: [['e', 'event1']],
      });

      const referencedEvent = NostrEventFactory.create({
        id: 'event1',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey2',
      });

      const isValid = (
        service as unknown as EventDeletionServiceWithPrivate
      ).validateDeletionRequest(deleteEvent, referencedEvent);
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

      expect(nostrEventRepository.findOne).not.toHaveBeenCalled();
    });

    it('should skip deletion when referenced event not found', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        tags: [['e', 'event1']],
      });

      jest.spyOn(nostrEventRepository, 'findOne').mockResolvedValue(null);

      await service.processDeleteEvent(deleteEvent);

      expect(nostrEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event1' },
      });
      expect(nostrEventRepository.delete).not.toHaveBeenCalled();
    });

    it('should skip deletion when pubkeys do not match', async () => {
      const deleteEvent = EventFactory.create({
        id: 'delete1',
        kind: 5,
        pubkey: 'pubkey1',
        tags: [['e', 'event1']],
      });

      const referencedEvent = NostrEventFactory.create({
        id: 'event1',
        kind: EVENT_AMB_KIND,
        pubkey: 'pubkey2',
      });

      jest
        .spyOn(nostrEventRepository, 'findOne')
        .mockResolvedValue(referencedEvent);

      await service.processDeleteEvent(deleteEvent);

      expect(nostrEventRepository.findOne).toHaveBeenCalled();
      expect(nostrEventRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteEventAndCascade', () => {
    it('should delete event and rely on database CASCADE for AMB events', async () => {
      jest
        .spyOn(nostrEventRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('event1', EVENT_AMB_KIND);

      expect(nostrEventRepository.delete).toHaveBeenCalledWith({
        id: 'event1',
      });
    });

    it('should nullify file metadata and delete File event', async () => {
      jest
        .spyOn(oerRepository, 'update')
        .mockResolvedValue({ affected: 2, raw: {}, generatedMaps: [] });
      jest
        .spyOn(nostrEventRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('file1', EVENT_FILE_KIND);

      expect(oerRepository.update).toHaveBeenCalledWith(
        { event_file_id: 'file1' },
        {
          file_mime_type: null,
          file_size: null,
          file_dim: null,
          file_alt: null,
        },
      );
      expect(nostrEventRepository.delete).toHaveBeenCalledWith({
        id: 'file1',
      });
    });

    it('should delete event for other event kinds', async () => {
      jest
        .spyOn(nostrEventRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteEventAndCascade('event1', 1); // Kind 1 (text note)

      expect(nostrEventRepository.delete).toHaveBeenCalledWith({
        id: 'event1',
      });
    });

    it('should handle deletion of non-existent event', async () => {
      jest
        .spyOn(nostrEventRepository, 'delete')
        .mockResolvedValue({ affected: 0, raw: {} });

      await service.deleteEventAndCascade('nonexistent', EVENT_AMB_KIND);

      expect(nostrEventRepository.delete).toHaveBeenCalledWith({
        id: 'nonexistent',
      });
    });

    it('should throw error on database failure', async () => {
      jest
        .spyOn(nostrEventRepository, 'delete')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.deleteEventAndCascade('event1', EVENT_AMB_KIND),
      ).rejects.toThrow('Database error');
    });
  });
});
