import { NostrAmbRelayAdapter } from '../src/nostr-amb-relay.adapter.js';
import { Relay } from 'nostr-tools';

jest.mock('nostr-tools', () => ({
  Relay: {
    connect: jest.fn(),
  },
}));

const RELAY_URL = 'wss://amb-relay.edufeed.org';

function createAdapter(): NostrAmbRelayAdapter {
  return new NostrAmbRelayAdapter({ relayUrl: RELAY_URL });
}

const baseQuery = { keywords: 'test', page: 1, pageSize: 10 };

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

describe('NostrAmbRelayAdapter buildFilter type mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should convert image type to type:ImageObject in the search string', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search({ ...baseQuery, type: 'image' });

    const filter = getCapturedFilter();
    expect(filter.search).toContain('type:ImageObject');
  });

  it('should convert video type to type:VideoObject in the search string', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search({ ...baseQuery, type: 'video' });

    const filter = getCapturedFilter();
    expect(filter.search).toContain('type:VideoObject');
  });

  it('should convert audio type to type:AudioObject in the search string', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search({ ...baseQuery, type: 'audio' });

    const filter = getCapturedFilter();
    expect(filter.search).toContain('type:AudioObject');
  });

  it('should convert text type to type:TextDigitalDocument in the search string', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search({ ...baseQuery, type: 'text' });

    const filter = getCapturedFilter();
    expect(filter.search).toContain('type:TextDigitalDocument');
  });

  it('should convert application/pdf type to type:TextDigitalDocument in the search string', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search({ ...baseQuery, type: 'application/pdf' });

    const filter = getCapturedFilter();
    expect(filter.search).toContain('type:TextDigitalDocument');
  });

  it('should not append type filter when no type is set', async () => {
    const { getCapturedFilter } = mockRelayWithFilterCapture();
    const adapter = createAdapter();

    await adapter.search(baseQuery);

    const filter = getCapturedFilter();
    expect(filter.search).not.toContain('type:');
  });
});
