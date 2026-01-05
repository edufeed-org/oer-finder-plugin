import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import {
  NostrEventDatabaseService,
  OER_SOURCE_REPOSITORY,
} from '../src/services/nostr-event-database.service';
import type { OerSource } from '@edufeed-org/oer-entities';
import { EVENT_AMB_KIND } from '../src/constants/event-kinds.constants';
import { EventFactory } from './fixtures';
import { SOURCE_NAME_NOSTR } from '../src/constants/source.constants';

/**
 * Creates a mock OerSource for testing.
 */
function createMockOerSource(overrides: Partial<OerSource> = {}): OerSource {
  const defaults: OerSource = {
    id: 'test-source-id',
    oer_id: null,
    oer: null,
    source_name: SOURCE_NAME_NOSTR,
    source_identifier: 'event:test-event-id',
    source_data: {
      id: 'test-event-id',
      kind: 1,
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      content: 'test content',
      tags: [],
      sig: 'test-sig',
    },
    status: 'pending',
    source_uri: 'wss://relay.example.com',
    source_timestamp: Math.floor(Date.now() / 1000),
    source_record_type: '1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  return { ...defaults, ...overrides };
}

describe('NostrEventDatabaseService', () => {
  let service: NostrEventDatabaseService;
  let mockRepository: jest.Mocked<Repository<OerSource>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      insert: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<OerSource>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NostrEventDatabaseService,
        {
          provide: OER_SOURCE_REPOSITORY,
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
      const mockOerSource = createMockOerSource({
        source_identifier: `event:${mockEvent.id}`,
        source_data: mockEvent as unknown as Record<string, unknown>,
        source_record_type: String(mockEvent.kind),
        source_timestamp: mockEvent.created_at,
      });

      mockRepository.findOne.mockResolvedValue(null); // No existing source
      mockRepository.create.mockReturnValue(mockOerSource);
      mockRepository.save.mockResolvedValue(mockOerSource);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.source).toEqual(mockOerSource);
      }

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockOerSource);
    });

    it('should return duplicate result when event already exists', async () => {
      const mockEvent = EventFactory.create();
      const existingSource = createMockOerSource({
        source_identifier: `event:${mockEvent.id}`,
      });

      mockRepository.findOne.mockResolvedValue(existingSource);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('duplicate');
      }

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should return duplicate result when duplicate key error occurs', async () => {
      const mockEvent = EventFactory.create();
      const mockOerSource = createMockOerSource();

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOerSource);
      mockRepository.save.mockRejectedValue({ code: '23505' });

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('duplicate');
      }
    });

    it('should return error result when database operation fails', async () => {
      const mockEvent = EventFactory.create();
      const mockOerSource = createMockOerSource();
      const mockError = new Error('Database connection failed');

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOerSource);
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
      const mockOerSource = createMockOerSource({
        source_record_type: String(EVENT_AMB_KIND),
      });

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOerSource);
      mockRepository.save.mockResolvedValue(mockOerSource);

      const result = await service.saveEvent(
        mockEvent,
        'wss://relay.example.com',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.source.source_record_type).toBe(String(EVENT_AMB_KIND));
      }
    });
  });

  describe('findEventById', () => {
    it('should find an event source by event ID', async () => {
      const mockOerSource = createMockOerSource();
      mockRepository.findOne.mockResolvedValue(mockOerSource);

      const result = await service.findEventById('test-event-id');

      expect(result).toEqual(mockOerSource);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:test-event-id',
        },
      });
    });

    it('should return null when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findEventById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findEvents', () => {
    it('should find events by source_record_type', async () => {
      const mockSources = [
        createMockOerSource({ id: 'source-1', source_record_type: '1' }),
        createMockOerSource({ id: 'source-2', source_record_type: '1' }),
      ];
      mockRepository.find.mockResolvedValue(mockSources);

      const result = await service.findEvents({ source_record_type: '1' });

      expect(result).toEqual(mockSources);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { source_name: SOURCE_NAME_NOSTR, source_record_type: '1' },
      });
    });

    it('should find events by source_uri', async () => {
      const mockSources = [
        createMockOerSource({ source_uri: 'wss://relay.example.com' }),
      ];
      mockRepository.find.mockResolvedValue(mockSources);

      const result = await service.findEvents({
        source_uri: 'wss://relay.example.com',
      });

      expect(result).toEqual(mockSources);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_uri: 'wss://relay.example.com',
        },
      });
    });

    it('should find events by multiple criteria', async () => {
      const mockSources = [
        createMockOerSource({
          source_record_type: String(EVENT_AMB_KIND),
          source_uri: 'wss://relay.example.com',
        }),
      ];
      mockRepository.find.mockResolvedValue(mockSources);

      const result = await service.findEvents({
        source_record_type: String(EVENT_AMB_KIND),
        source_uri: 'wss://relay.example.com',
      });

      expect(result).toEqual(mockSources);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_record_type: String(EVENT_AMB_KIND),
          source_uri: 'wss://relay.example.com',
        },
      });
    });

    it('should return empty array when no events match', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findEvents({ source_record_type: '999' });

      expect(result).toEqual([]);
    });
  });

  describe('findUnprocessedOerEvents', () => {
    it('should find pending kind 30142 (AMB) events', async () => {
      const mockSources = [
        createMockOerSource({
          id: 'source-1',
          source_record_type: String(EVENT_AMB_KIND),
          status: 'pending',
        }),
        createMockOerSource({
          id: 'source-2',
          source_record_type: String(EVENT_AMB_KIND),
          status: 'pending',
        }),
      ];

      mockRepository.find.mockResolvedValue(mockSources);

      const result = await service.findUnprocessedOerEvents();

      expect(result).toEqual(mockSources);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_record_type: String(EVENT_AMB_KIND),
          status: 'pending',
        },
      });
    });

    it('should return empty array when all OER events are processed', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findUnprocessedOerEvents();

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed');
      mockRepository.find.mockRejectedValue(mockError);

      await expect(service.findUnprocessedOerEvents()).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('countEvents', () => {
    it('should return total event count for nostr sources', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.countEvents();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { source_name: SOURCE_NAME_NOSTR },
      });
    });

    it('should return 0 when no events exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countEvents();

      expect(result).toBe(0);
    });
  });

  describe('countEventsByRecordType', () => {
    it('should count events by specific record type', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.countEventsByRecordType('1');

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { source_name: SOURCE_NAME_NOSTR, source_record_type: '1' },
      });
    });

    it('should return 0 for record type with no events', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.countEventsByRecordType('999');

      expect(result).toBe(0);
    });

    it('should count OER events (kind 30142 AMB)', async () => {
      mockRepository.count.mockResolvedValue(25);

      const result = await service.countEventsByRecordType(
        String(EVENT_AMB_KIND),
      );

      expect(result).toBe(25);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: {
          source_name: SOURCE_NAME_NOSTR,
          source_record_type: String(EVENT_AMB_KIND),
        },
      });
    });
  });

  describe('markEventProcessed', () => {
    it('should update event status to processed with OER ID', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as never);

      await service.markEventProcessed('event-123', 'oer-456');

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:event-123',
        },
        {
          status: 'processed',
          oer_id: 'oer-456',
        },
      );
    });
  });

  describe('markEventFailed', () => {
    it('should update event status to failed', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as never);

      await service.markEventFailed('event-123');

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          source_name: SOURCE_NAME_NOSTR,
          source_identifier: 'event:event-123',
        },
        {
          status: 'failed',
        },
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockEvent = EventFactory.create();
      const mockOerSource = createMockOerSource();
      const networkError = new Error('ECONNREFUSED');

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOerSource);
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
      const mockOerSource1 = createMockOerSource({ id: 'source-1' });
      const mockOerSource2 = createMockOerSource({ id: 'source-2' });

      // First call - simulate duplicate key error
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce(mockOerSource1);
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
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce(mockOerSource2);
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
