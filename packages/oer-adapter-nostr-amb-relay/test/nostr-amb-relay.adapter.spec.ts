import { NostrAmbRelayAdapter } from '../src/nostr-amb-relay.adapter.js';
import { Relay } from 'nostr-tools';

jest.mock('nostr-tools', () => ({
  Relay: {
    connect: jest.fn(),
  },
}));

const RELAY_URL = 'wss://amb-relay.edufeed.org';
const RELAY_URL_2 = 'wss://amb-relay-2.edufeed.org';

function createAdapter(
  relayUrls: string[] = [RELAY_URL],
): NostrAmbRelayAdapter {
  return new NostrAmbRelayAdapter({ relayUrls });
}

const baseQuery = { keywords: 'test', page: 1, pageSize: 10 };

function makeEvent(id: string) {
  return {
    id,
    pubkey: 'pubkey',
    created_at: 1000,
    kind: 30142,
    tags: [['d', `https://example.com/${id}`]],
    content: '',
    sig: 'sig',
  };
}

/**
 * Captures the filter passed to relay.subscribe() during a search call.
 * Resolves the subscription immediately with an empty result set.
 */
function mockRelayWithFilterCapture(): {
  getCapturedFilter: () => Record<string, unknown>;
} {
  let capturedFilter: Record<string, unknown> | null = null;

  const sub = { close: jest.fn() };

  const mockRelay = {
    subscribe: jest.fn(
      (
        filters: Record<string, unknown>[],
        params: { onevent?: (e: unknown) => void; oneose?: () => void },
      ) => {
        capturedFilter = filters[0];
        // Call oneose asynchronously so `sub` is assigned before the callback runs
        queueMicrotask(() => params.oneose?.());
        return sub;
      },
    ),
    close: jest.fn(),
  };

  (Relay.connect as jest.Mock).mockResolvedValue(mockRelay);

  return {
    getCapturedFilter: () => {
      if (!capturedFilter) {
        throw new Error('No filter was captured — search was not called');
      }
      return capturedFilter;
    },
  };
}

/**
 * Creates a mock relay that emits the given events then closes.
 */
function makeMockRelay(events: ReturnType<typeof makeEvent>[]) {
  return {
    subscribe: jest.fn(
      (
        _filters: unknown[],
        params: {
          onevent?: (e: unknown) => void;
          oneose?: () => void;
        },
      ) => {
        queueMicrotask(() => {
          for (const event of events) {
            params.onevent?.(event);
          }
          params.oneose?.();
        });
        return { close: jest.fn() };
      },
    ),
    close: jest.fn(),
  };
}

const TYPE_FILTER_CASES: [string, string, string][] = [
  ['image', 'https://w3id.org/kim/hcrt/image', 'Image'],
  ['video', 'https://w3id.org/kim/hcrt/video', 'Video'],
  ['audio', 'https://w3id.org/kim/hcrt/audio', 'Audio'],
  ['text', 'https://w3id.org/kim/hcrt/text', 'Text'],
  ['application/pdf', 'https://w3id.org/kim/hcrt/text', 'Text'],
];

describe('NostrAmbRelayAdapter buildFilter type mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(TYPE_FILTER_CASES)(
    'should not use type: prefix in search filter for %s',
    async (type) => {
      const { getCapturedFilter } = mockRelayWithFilterCapture();
      const adapter = createAdapter();

      await adapter.search({ ...baseQuery, type });

      const search = getCapturedFilter().search as string;
      expect(search).not.toContain('type:');
    },
  );

  it.each(TYPE_FILTER_CASES)(
    'should use learningResourceType filters for %s',
    async (type, expectedId, expectedLabel) => {
      const { getCapturedFilter } = mockRelayWithFilterCapture();
      const adapter = createAdapter();

      await adapter.search({ ...baseQuery, type });

      const search = getCapturedFilter().search as string;
      expect(search).toContain(`learningResourceType.id:${expectedId}`);
      expect(search).toContain(
        `learningResourceType.prefLabel.en:${expectedLabel}`,
      );
    },
  );

  it('should not append learningResourceType filters when no type is set', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search(baseQuery);

    const search = getCapturedFilter().search as string;
    expect(search).not.toContain('type:');
    expect(search).not.toContain('learningResourceType');
  });
});

describe('NostrAmbRelayAdapter constructor validation', () => {
  it('should throw when relayUrls is empty', () => {
    expect(() => createAdapter([])).toThrow(
      'At least one relay URL must be provided',
    );
  });

  it('should throw when a relay URL has an invalid scheme', () => {
    expect(() => createAdapter(['https://not-a-websocket.com'])).toThrow(
      'Invalid relay URL scheme',
    );
  });

  it('should throw when too many relay URLs are provided', () => {
    const urls = Array.from(
      { length: 11 },
      (_, i) => `wss://relay-${i}.example.com`,
    );
    expect(() => createAdapter(urls)).toThrow('Too many relay URLs');
  });

  it('should accept valid ws:// and wss:// URLs', () => {
    expect(
      () => createAdapter(['ws://local.relay', 'wss://secure.relay']),
    ).not.toThrow();
  });
});

describe('NostrAmbRelayAdapter multi-relay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return events from a single relay', async () => {
    const event = makeEvent('event-1');
    const mockRelay = makeMockRelay([event]);
    (Relay.connect as jest.Mock).mockResolvedValue(mockRelay);

    const adapter = createAdapter([RELAY_URL]);
    const result = await adapter.search(baseQuery);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('should merge events from two relays', async () => {
    const relay1Event = makeEvent('event-1');
    const relay2Event = makeEvent('event-2');

    (Relay.connect as jest.Mock)
      .mockResolvedValueOnce(makeMockRelay([relay1Event]))
      .mockResolvedValueOnce(makeMockRelay([relay2Event]));

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);
    const result = await adapter.search(baseQuery);

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('should deduplicate events with the same id from multiple relays', async () => {
    const sharedEvent = makeEvent('shared-event');

    (Relay.connect as jest.Mock)
      .mockResolvedValueOnce(makeMockRelay([sharedEvent]))
      .mockResolvedValueOnce(makeMockRelay([sharedEvent]));

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);
    const result = await adapter.search(baseQuery);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('should return results from successful relay when one relay fails', async () => {
    const event = makeEvent('event-1');

    (Relay.connect as jest.Mock)
      .mockResolvedValueOnce(makeMockRelay([event]))
      .mockRejectedValueOnce(new Error('Connection refused'));

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);
    const result = await adapter.search(baseQuery);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('should throw when all relays fail', async () => {
    (Relay.connect as jest.Mock).mockRejectedValue(
      new Error('Connection refused'),
    );

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);

    await expect(adapter.search(baseQuery)).rejects.toThrow(
      'Nostr AMB Relay error',
    );
  });

  it('should connect to the correct number of relays', async () => {
    (Relay.connect as jest.Mock)
      .mockResolvedValueOnce(makeMockRelay([]))
      .mockResolvedValueOnce(makeMockRelay([]));

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);
    await adapter.search(baseQuery);

    expect(Relay.connect).toHaveBeenCalledTimes(2);
  });

  it('should connect to each configured relay URL', async () => {
    (Relay.connect as jest.Mock)
      .mockResolvedValueOnce(makeMockRelay([]))
      .mockResolvedValueOnce(makeMockRelay([]));

    const adapter = createAdapter([RELAY_URL, RELAY_URL_2]);
    await adapter.search(baseQuery);

    expect(Relay.connect).toHaveBeenCalledWith(RELAY_URL);
    expect(Relay.connect).toHaveBeenCalledWith(RELAY_URL_2);
  });

  it('should propagate AbortSignal to all relay queries', async () => {
    const controller = new AbortController();

    let capturedParams: {
      onevent?: (e: unknown) => void;
      oneose?: () => void;
    } | null = null;

    const hangingRelay = {
      subscribe: jest.fn(
        (
          _filters: unknown[],
          params: { onevent?: (e: unknown) => void; oneose?: () => void },
        ) => {
          capturedParams = params;
          // Never resolves on its own — waits for abort
          return { close: jest.fn() };
        },
      ),
      close: jest.fn(),
    };

    (Relay.connect as jest.Mock).mockResolvedValue(hangingRelay);

    const adapter = createAdapter([RELAY_URL]);
    const searchPromise = adapter.search(baseQuery, {
      signal: controller.signal,
    });

    // Let the relay connect and subscribe
    await Promise.resolve();
    await Promise.resolve();

    controller.abort();

    await expect(searchPromise).rejects.toThrow('aborted');
    expect(capturedParams).not.toBeNull();
  });
});
