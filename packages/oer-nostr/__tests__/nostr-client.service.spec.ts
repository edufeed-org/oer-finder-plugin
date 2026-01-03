import { Test, TestingModule } from '@nestjs/testing';
import {
  NostrClientService,
  CONFIG_SERVICE,
} from '../src/services/nostr-client.service';
import { NOSTR_EVENT_DATABASE_SERVICE } from '../src/services/nostr-event-database.service';
import { EVENT_DELETION_SERVICE } from '../src/services/event-deletion.service';
import { OER_EXTRACTION_SERVICE } from '../src/services/oer-extraction.service';
import { verifyEvent } from 'nostr-tools/pure';

// Mock the Relay module to prevent actual connections
jest.mock('nostr-tools/relay', () => ({
  Relay: {
    connect: jest.fn().mockResolvedValue({
      onclose: null,
      onnotice: jest.fn(),
      subscribe: jest.fn().mockReturnValue({
        close: jest.fn(),
      }),
      close: jest.fn(),
    }),
  },
  Subscription: jest.fn(),
}));

// Mock the verifyEvent function
jest.mock('nostr-tools/pure', () => ({
  verifyEvent: jest.fn().mockReturnValue(true), // Default to valid signatures
}));

describe('NostrClientService', () => {
  let service: NostrClientService;

  const mockDatabaseService = {
    saveEvent: jest.fn(),
    findEventById: jest.fn(),
    findEvents: jest.fn(),
    findUnprocessedOerEvents: jest.fn().mockResolvedValue([]),
    countEvents: jest.fn(),
    countEventsByRecordType: jest.fn(),
    getLatestTimestamp: jest.fn().mockResolvedValue(null),
    getLatestTimestampsByRelay: jest
      .fn()
      .mockResolvedValue(new Map([['ws://localhost:10547', null]])),
  };

  const mockOerService = {
    shouldExtractOer: jest.fn().mockReturnValue(false),
    extractOerFromEvent: jest.fn(),
    findOersWithMissingFileMetadata: jest.fn().mockResolvedValue([]),
    updateFileMetadata: jest.fn(),
  };

  const mockEventDeletionService = {
    processDeleteEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        'nostr.relayUrls': '',
        'nostr.relayUrl': 'ws://localhost:10547',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NostrClientService,
        {
          provide: NOSTR_EVENT_DATABASE_SERVICE,
          useValue: mockDatabaseService,
        },
        {
          provide: OER_EXTRACTION_SERVICE,
          useValue: mockOerService,
        },
        {
          provide: EVENT_DELETION_SERVICE,
          useValue: mockEventDeletionService,
        },
        {
          provide: CONFIG_SERVICE,
          useValue: mockConfigService,
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

    service = module.get<NostrClientService>(NostrClientService);
  });

  afterEach(() => {
    // Clean up any running timers
    service.onModuleDestroy();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration parsing', () => {
    // Configuration parsing is now handled by RelayConfigParser utility
    // These tests are moved to relay-config.parser.spec.ts
  });

  describe('event persistence', () => {
    it('should create and save a Nostr event', async () => {
      const mockEvent = {
        id: 'test-event-id',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [['test', 'tag']],
        sig: 'test-signature',
      };

      const mockNostrEvent = {
        id: mockEvent.id,
        kind: mockEvent.kind,
        pubkey: mockEvent.pubkey,
        created_at: mockEvent.created_at,
        content: mockEvent.content,
        tags: mockEvent.tags,
        raw_event: mockEvent,
        ingested_at: new Date(),
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: mockNostrEvent,
      });

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };
      await serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com');

      expect(mockDatabaseService.saveEvent).toHaveBeenCalledWith(
        mockEvent,
        'wss://test-relay.com',
      );
    });

    it('should handle duplicate event IDs gracefully', async () => {
      const mockEvent = {
        id: 'duplicate-event-id',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [],
        sig: 'test-signature',
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: false,
        reason: 'duplicate',
      });

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      // Should not throw
      await expect(
        serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com'),
      ).resolves.not.toThrow();
    });

    it('should log errors for persistence failures', async () => {
      const mockEvent = {
        id: 'error-event-id',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [],
        sig: 'test-signature',
      };

      const mockError = new Error('Database connection failed');
      mockDatabaseService.saveEvent.mockResolvedValue({
        success: false,
        reason: 'error',
        error: mockError,
      });

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
        logger: { error: jest.Mock };
      };
      const loggerSpy = jest.spyOn(serviceWithPrivates.logger, 'error');

      await serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com');

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should reject events with invalid signatures', async () => {
      const mockVerifyEvent = jest.mocked(verifyEvent);
      mockVerifyEvent.mockReturnValueOnce(false); // Mock invalid signature

      const mockEvent = {
        id: 'invalid-sig-event-id',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [],
        sig: 'invalid-signature',
      };

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
        logger: { warn: jest.Mock };
      };
      const loggerSpy = jest.spyOn(serviceWithPrivates.logger, 'warn');

      await serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com');

      // Verify the event was rejected (using new error message format)
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid cryptographic signature'),
      );
      expect(mockDatabaseService.saveEvent).not.toHaveBeenCalled();
    });

    it('should accept events with valid signatures', async () => {
      const mockVerifyEvent = jest.mocked(verifyEvent);
      mockVerifyEvent.mockReturnValueOnce(true); // Mock valid signature

      const mockEvent = {
        id: 'valid-sig-event-id',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [],
        sig: 'valid-signature',
      };

      const mockNostrEvent = {
        ...mockEvent,
        raw_event: mockEvent,
        ingested_at: new Date(),
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: mockNostrEvent,
      });

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      await serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com');

      // Verify the event was accepted and saved
      expect(mockDatabaseService.saveEvent).toHaveBeenCalledWith(
        mockEvent,
        'wss://test-relay.com',
      );
    });
  });

  describe('multi-relay lifecycle', () => {
    it('should clean up all relay connections on module destroy', () => {
      type RelayConnection = {
        relay: { close: jest.Mock } | null;
        subscription: { close: jest.Mock } | null;
        reconnectTimeout: ReturnType<typeof setTimeout> | null;
        url: string;
      };

      type ServiceWithPrivates = {
        connections: Map<string, RelayConnection>;
        isShuttingDown: boolean;
      };

      const serviceWithPrivates = service as unknown as ServiceWithPrivates;

      // Set up multiple relay connections
      const relay1CloseMock = jest.fn();
      const subscription1CloseMock = jest.fn();
      const relay2CloseMock = jest.fn();
      const subscription2CloseMock = jest.fn();

      const relay1 = {
        relay: { close: relay1CloseMock },
        subscription: { close: subscription1CloseMock },
        reconnectTimeout: setTimeout(() => {}, 1000),
        url: 'wss://relay1.com',
      };

      const relay2 = {
        relay: { close: relay2CloseMock },
        subscription: { close: subscription2CloseMock },
        reconnectTimeout: setTimeout(() => {}, 1000),
        url: 'wss://relay2.com',
      };

      serviceWithPrivates.connections.set('wss://relay1.com', relay1);
      serviceWithPrivates.connections.set('wss://relay2.com', relay2);

      service.onModuleDestroy();

      expect(serviceWithPrivates.isShuttingDown).toBe(true);
      expect(subscription1CloseMock).toHaveBeenCalled();
      expect(relay1CloseMock).toHaveBeenCalled();
      expect(subscription2CloseMock).toHaveBeenCalled();
      expect(relay2CloseMock).toHaveBeenCalled();
      expect(serviceWithPrivates.connections.size).toBe(0);
    });
  });

  describe('multi-relay deduplication', () => {
    it('should handle duplicate events from different relays', async () => {
      const mockEvent = {
        id: 'duplicate-from-multi-relay',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'test content',
        tags: [],
        sig: 'test-signature',
      };

      const mockNostrEvent = {
        ...mockEvent,
        raw_event: mockEvent,
        ingested_at: new Date(),
      };

      // First save succeeds, second fails with duplicate error
      mockDatabaseService.saveEvent
        .mockResolvedValueOnce({ success: true, event: mockNostrEvent })
        .mockResolvedValueOnce({ success: false, reason: 'duplicate' });

      const serviceWithPrivates = service as unknown as {
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      // Receive same event from two different relays
      await serviceWithPrivates.handleEvent(mockEvent, 'wss://relay1.com');
      await serviceWithPrivates.handleEvent(mockEvent, 'wss://relay2.com');

      // Should be saved once, second attempt should be gracefully handled
      expect(mockDatabaseService.saveEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('timestamp persistence across restarts', () => {
    it('should query database for per-relay timestamps on startup', async () => {
      // Clear previous calls and mock the database
      jest.clearAllMocks();
      mockDatabaseService.getLatestTimestampsByRelay.mockResolvedValueOnce(
        new Map([['ws://localhost:10547', null]]),
      );

      // Manually trigger initialization
      await service.onModuleInit();

      // Verify that the database was queried for the latest timestamp per relay
      expect(
        mockDatabaseService.getLatestTimestampsByRelay,
      ).toHaveBeenCalledWith(['ws://localhost:10547'], ['30142', '1063', '5']);
    });

    it('should initialize connections with per-relay database timestamps on startup', async () => {
      // Mock database to return a specific timestamp for a relay
      const mockTimestamp = 1234567890;
      mockDatabaseService.getLatestTimestampsByRelay.mockResolvedValueOnce(
        new Map([['ws://localhost:10547', mockTimestamp]]),
      );

      type ServiceWithPrivates = {
        connections: Map<
          string,
          {
            relay: unknown;
            subscription: unknown;
            reconnectTimeout: unknown;
            url: string;
            lastEventTimestamp: number | null;
          }
        >;
        connectToAllRelays: () => Promise<void>;
      };

      const serviceWithPrivates = service as unknown as ServiceWithPrivates;

      // Manually call connectToAllRelays to initialize connections
      await serviceWithPrivates.connectToAllRelays();

      // Check that connections were initialized with the database timestamp
      const connections = Array.from(serviceWithPrivates.connections.values());
      if (connections.length > 0) {
        // At least one connection should have the timestamp from the database
        expect(connections[0].lastEventTimestamp).toBe(mockTimestamp);
      }
    });
  });

  describe('timestamp tracking for incremental sync', () => {
    it('should track the latest event timestamp per relay', async () => {
      type RelayConnection = {
        relay: unknown;
        subscription: unknown;
        reconnectTimeout: unknown;
        url: string;
        lastEventTimestamp: number | null;
      };

      type ServiceWithPrivates = {
        connections: Map<string, RelayConnection>;
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      const serviceWithPrivates = service as unknown as ServiceWithPrivates;

      // Set up a connection entry
      serviceWithPrivates.connections.set('wss://test-relay.com', {
        relay: null,
        subscription: null,
        reconnectTimeout: null,
        url: 'wss://test-relay.com',
        lastEventTimestamp: null,
      });

      const mockEvent1 = {
        id: 'event-1',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'first event',
        tags: [],
        sig: 'test-signature-1',
      };

      const mockEvent2 = {
        id: 'event-2',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567900,
        content: 'second event',
        tags: [],
        sig: 'test-signature-2',
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: {
          ...mockEvent1,
          raw_event: mockEvent1,
          ingested_at: new Date(),
        },
      });

      // Handle first event
      await serviceWithPrivates.handleEvent(mockEvent1, 'wss://test-relay.com');

      const connection = serviceWithPrivates.connections.get(
        'wss://test-relay.com',
      );
      expect(connection?.lastEventTimestamp).toBe(1234567890);

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: {
          ...mockEvent2,
          raw_event: mockEvent2,
          ingested_at: new Date(),
        },
      });

      // Handle second event with later timestamp
      await serviceWithPrivates.handleEvent(mockEvent2, 'wss://test-relay.com');

      expect(connection?.lastEventTimestamp).toBe(1234567900);
    });

    it('should track timestamps independently per relay', async () => {
      type RelayConnection = {
        relay: unknown;
        subscription: unknown;
        reconnectTimeout: unknown;
        url: string;
        lastEventTimestamp: number | null;
      };

      type ServiceWithPrivates = {
        connections: Map<string, RelayConnection>;
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      const serviceWithPrivates = service as unknown as ServiceWithPrivates;

      // Set up two connection entries
      serviceWithPrivates.connections.set('wss://relay1.com', {
        relay: null,
        subscription: null,
        reconnectTimeout: null,
        url: 'wss://relay1.com',
        lastEventTimestamp: null,
      });

      serviceWithPrivates.connections.set('wss://relay2.com', {
        relay: null,
        subscription: null,
        reconnectTimeout: null,
        url: 'wss://relay2.com',
        lastEventTimestamp: null,
      });

      const mockEvent1 = {
        id: 'event-1',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'event from relay 1',
        tags: [],
        sig: 'test-signature-1',
      };

      const mockEvent2 = {
        id: 'event-2',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567800, // Earlier timestamp
        content: 'event from relay 2',
        tags: [],
        sig: 'test-signature-2',
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: {
          ...mockEvent1,
          raw_event: mockEvent1,
          ingested_at: new Date(),
        },
      });

      await serviceWithPrivates.handleEvent(mockEvent1, 'wss://relay1.com');

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: true,
        event: {
          ...mockEvent2,
          raw_event: mockEvent2,
          ingested_at: new Date(),
        },
      });

      await serviceWithPrivates.handleEvent(mockEvent2, 'wss://relay2.com');

      // Each relay should track its own timestamp
      const connection1 =
        serviceWithPrivates.connections.get('wss://relay1.com');
      const connection2 =
        serviceWithPrivates.connections.get('wss://relay2.com');

      expect(connection1?.lastEventTimestamp).toBe(1234567890);
      expect(connection2?.lastEventTimestamp).toBe(1234567800);
    });

    it('should update timestamp even for duplicate events', async () => {
      type RelayConnection = {
        relay: unknown;
        subscription: unknown;
        reconnectTimeout: unknown;
        url: string;
        lastEventTimestamp: number | null;
      };

      type ServiceWithPrivates = {
        connections: Map<string, RelayConnection>;
        handleEvent: (event: unknown, relayUrl: string) => Promise<void>;
      };

      const serviceWithPrivates = service as unknown as ServiceWithPrivates;

      serviceWithPrivates.connections.set('wss://test-relay.com', {
        relay: null,
        subscription: null,
        reconnectTimeout: null,
        url: 'wss://test-relay.com',
        lastEventTimestamp: null,
      });

      const mockEvent = {
        id: 'duplicate-event',
        kind: 1,
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'duplicate event',
        tags: [],
        sig: 'test-signature',
      };

      mockDatabaseService.saveEvent.mockResolvedValue({
        success: false,
        reason: 'duplicate',
      });

      await serviceWithPrivates.handleEvent(mockEvent, 'wss://test-relay.com');

      // Timestamp should be updated even though the event was a duplicate
      const connection = serviceWithPrivates.connections.get(
        'wss://test-relay.com',
      );
      expect(connection?.lastEventTimestamp).toBe(1234567890);
    });
  });
});
