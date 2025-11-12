import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NostrEventDatabaseService } from '../services/nostr-event-database.service';
import { NostrEvent } from '../entities/nostr-event.entity';
import type { Event } from 'nostr-tools/core';
import { EVENT_AMB_KIND } from '../constants/event-kinds.constants';
import { EventFactory, NostrEventFactory } from '../../../test/fixtures';

type MockQueryBuilder = Pick<
  SelectQueryBuilder<NostrEvent>,
  'leftJoin' | 'where' | 'andWhere' | 'getMany' | 'select' | 'getRawOne'
>;

describe('NostrEventDatabaseService', () => {
  let service: NostrEventDatabaseService;
  let mockRepository: jest.Mocked<Repository<NostrEvent>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      insert: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<NostrEvent>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NostrEventDatabaseService,
        {
          provide: getRepositoryToken(NostrEvent),
          useValue: mockRepository,
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

    service = module.get<NostrEventDatabaseService>(NostrEventDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveEvent', () => {
    it('should successfully save a valid event', async () => {
      const mockEvent = EventFactory.create();
      const mockNostrEvent = NostrEventFactory.create();

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockResolvedValue(mockNostrEvent);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event).toEqual(mockNostrEvent);
      }

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockNostrEvent);
    });

    it('should return duplicate result when event ID already exists', async () => {
      const mockEvent = EventFactory.create();
      const mockNostrEvent = NostrEventFactory.create();

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockRejectedValue({ code: '23505' });

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('duplicate');
      }

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return error result when database operation fails', async () => {
      const mockEvent = EventFactory.create();
      const mockNostrEvent = NostrEventFactory.create();
      const mockError = new Error('Database connection failed');

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockRejectedValue(mockError);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(false);
      if (!result.success && result.reason === 'error') {
        expect(result.reason).toBe('error');
        expect(result.error).toBe(mockError);
      }
    });

    it('should handle events with different kinds', async () => {
      const mockEvent = EventFactory.create({ kind: EVENT_AMB_KIND });
      const mockNostrEvent = NostrEventFactory.create({ kind: EVENT_AMB_KIND });

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockResolvedValue(mockNostrEvent);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.kind).toBe(EVENT_AMB_KIND);
      }
    });

    it('should handle events with complex tag arrays', async () => {
      const complexTags = [
        ['e', 'referenced-event-id'],
        ['p', 'referenced-pubkey'],
        ['description', 'Multi-word description'],
      ];
      const mockEvent = EventFactory.create({ tags: complexTags });
      const mockNostrEvent = NostrEventFactory.create({ tags: complexTags });

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockResolvedValue(mockNostrEvent);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.tags).toEqual(complexTags);
      }
    });
  });

  describe('findEventById', () => {
    it('should find an event by ID', async () => {
      const mockNostrEvent = NostrEventFactory.create();
      mockRepository.findOne.mockResolvedValue(mockNostrEvent);

      const result = await service.findEventById('test-event-id');

      expect(result).toEqual(mockNostrEvent);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-event-id' },
      });
    });

    it('should return null when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findEventById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findEvents', () => {
    it('should find events by kind', async () => {
      const mockEvents = [
        NostrEventFactory.create({ id: 'event-1', kind: 1 }),
        NostrEventFactory.create({ id: 'event-2', kind: 1 }),
      ];
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findEvents({ kind: 1 });

      expect(result).toEqual(mockEvents);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { kind: 1 },
      });
    });

    it('should find events by pubkey', async () => {
      const mockEvents = [NostrEventFactory.create({ pubkey: 'test-pubkey' })];
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findEvents({ pubkey: 'test-pubkey' });

      expect(result).toEqual(mockEvents);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { pubkey: 'test-pubkey' },
      });
    });

    it('should find events by multiple criteria', async () => {
      const mockEvents = [
        NostrEventFactory.create({
          kind: EVENT_AMB_KIND,
          pubkey: 'test-pubkey',
        }),
      ];
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findEvents({
        kind: EVENT_AMB_KIND,
        pubkey: 'test-pubkey',
      });

      expect(result).toEqual(mockEvents);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { kind: EVENT_AMB_KIND, pubkey: 'test-pubkey' },
      });
    });

    it('should return empty array when no events match', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findEvents({ kind: 999 });

      expect(result).toEqual([]);
    });
  });

  describe('findUnprocessedOerEvents', () => {
    it('should find kind 30142 (AMB) events without OER records', async () => {
      const mockEvents = [
        NostrEventFactory.create({ id: 'oer-event-1', kind: EVENT_AMB_KIND }),
        NostrEventFactory.create({ id: 'oer-event-2', kind: EVENT_AMB_KIND }),
      ];

      const mockQueryBuilder: MockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEvents),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<NostrEvent>,
      );

      const result = await service.findUnprocessedOerEvents();

      expect(result).toEqual(mockEvents);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('event');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'open_educational_resources',
        'oer',
        'oer.event_amb_id = event.id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'event.kind = :kind',
        {
          kind: EVENT_AMB_KIND,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('oer.id IS NULL');
    });

    it('should return empty array when all OER events are processed', async () => {
      const mockQueryBuilder: MockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<NostrEvent>,
      );

      const result = await service.findUnprocessedOerEvents();

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed');
      const mockQueryBuilder: MockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(mockError),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<NostrEvent>,
      );

      await expect(service.findUnprocessedOerEvents()).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('countEvents', () => {
    it('should return total event count', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.countEvents();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalledWith();
    });

    it('should return 0 when no events exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countEvents();

      expect(result).toBe(0);
    });
  });

  describe('countEventsByKind', () => {
    it('should count events by specific kind', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.countEventsByKind(1);

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { kind: 1 } });
    });

    it('should return 0 for kind with no events', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countEventsByKind(999);

      expect(result).toBe(0);
    });

    it('should count OER events (kind 30142 AMB)', async () => {
      mockRepository.count.mockResolvedValue(25);

      const result = await service.countEventsByKind(EVENT_AMB_KIND);

      expect(result).toBe(25);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { kind: EVENT_AMB_KIND },
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockEvent = EventFactory.create();
      const mockNostrEvent = NostrEventFactory.create();
      const networkError = new Error('ECONNREFUSED');

      mockRepository.create.mockReturnValue(mockNostrEvent);
      mockRepository.save.mockRejectedValue(networkError);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('error');
      }
    });

    it('should distinguish between duplicate and other errors', async () => {
      const mockEvent1 = EventFactory.create({ id: 'event-1' });
      const mockEvent2 = EventFactory.create({ id: 'event-2' });
      const mockNostrEvent1 = NostrEventFactory.create({ id: 'event-1' });
      const mockNostrEvent2 = NostrEventFactory.create({ id: 'event-2' });

      // First call - simulate duplicate key error
      mockRepository.create.mockReturnValueOnce(mockNostrEvent1);
      mockRepository.save.mockRejectedValueOnce({ code: '23505' });

      const duplicateResult = await service.saveEvent(
        mockEvent1,
        'wss://relay.example.com',
      );
      expect(duplicateResult.success).toBe(false);
      if (!duplicateResult.success) {
        expect(duplicateResult.reason).toBe('duplicate');
      }

      // Second call - simulate generic error
      mockRepository.create.mockReturnValueOnce(mockNostrEvent2);
      mockRepository.save.mockRejectedValueOnce(new Error('Generic error'));

      const errorResult = await service.saveEvent(
        mockEvent2,
        'wss://relay.example.com',
      );
      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect(errorResult.reason).toBe('error');
      }
    });
  });
});
