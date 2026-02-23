import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from './api-client.js';
import type { SourceOption } from '../oer-search/OerSearch.js';
import type { components, OerClient } from '@edufeed-org/oer-finder-api-client';

type OerItem = components['schemas']['OerItemSchema'];

function createMockOerItem(name: string, source: string): OerItem {
  return {
    amb: { name, description: `Desc ${name}` },
    extensions: {
      fileMetadata: null,
      images: null,
      system: { source, foreignLandingUrl: null, attribution: null },
    },
  };
}

function createMockApiResponse(items: OerItem[], total: number, page: number, pageSize: number) {
  return {
    data: {
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    error: undefined,
    response: {} as Response,
  };
}

function createMockErrorResponse(statusCode: number, message: string) {
  return {
    data: undefined,
    error: { statusCode, message },
    response: {} as Response,
  };
}

/**
 * Create a mock OerClient with an injectable GET handler.
 * Uses `unknown` return to accommodate both success and error response shapes
 * without requiring complex union types in test code.
 */
function createMockOerClient(
  getHandler: (
    path: string,
    opts: { params: { query: Record<string, unknown> }; signal?: AbortSignal },
  ) => Promise<unknown>,
): OerClient {
  return { GET: vi.fn(getHandler) } as unknown as OerClient;
}

describe('ApiClient', () => {
  const sources: SourceOption[] = [
    { id: 'nostr', label: 'Nostr DB' },
    { id: 'openverse', label: 'Openverse' },
  ];

  describe('search', () => {
    it('returns data and meta from the API', async () => {
      const items = [createMockOerItem('item-1', 'nostr')];
      const mockClient = createMockOerClient(async () => createMockApiResponse(items, 10, 1, 20));

      const client = new ApiClient(mockClient, sources);
      const result = await client.search({
        source: 'nostr',
        searchTerm: 'test',
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({ total: 10, page: 1, pageSize: 20, totalPages: 1 });
    });

    it('passes search params as query parameters', async () => {
      const capturedQueries: Record<string, unknown>[] = [];
      const mockClient = createMockOerClient(async (_path, opts) => {
        capturedQueries.push(opts.params.query);
        return createMockApiResponse([], 0, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);
      await client.search({
        source: 'openverse',
        searchTerm: 'biology',
        type: 'image',
        license: 'CC BY 4.0',
        language: 'en',
        pageSize: 10,
      });

      expect(capturedQueries[0]).toMatchObject({
        source: 'openverse',
        searchTerm: 'biology',
        type: 'image',
        license: 'CC BY 4.0',
        language: 'en',
        pageSize: 10,
      });
    });

    it('passes abort signal to the API client', async () => {
      let capturedSignal: AbortSignal | undefined;
      const mockClient = createMockOerClient(async (_path, opts) => {
        capturedSignal = opts.signal;
        return createMockApiResponse([], 0, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);
      const controller = new AbortController();
      await client.search({ source: 'nostr', searchTerm: 'test' }, controller.signal);

      expect(capturedSignal).toBe(controller.signal);
    });

    it('throws on API error', async () => {
      const mockClient = createMockOerClient(async () =>
        createMockErrorResponse(500, 'Internal error'),
      );

      const client = new ApiClient(mockClient, sources);
      await expect(client.search({ source: 'nostr', searchTerm: 'test' })).rejects.toThrow(
        'Failed to fetch resources',
      );
    });

    it('throws when no data returned', async () => {
      const mockClient = createMockOerClient(async () => ({
        data: undefined,
        error: undefined,
        response: {} as Response,
      }));

      const client = new ApiClient(mockClient, sources);
      await expect(client.search({ source: 'nostr', searchTerm: 'test' })).rejects.toThrow(
        'No data returned from API',
      );
    });
  });

  describe('getAvailableSources', () => {
    it('returns configured sources', () => {
      const client = new ApiClient('https://api.example.com', sources);
      const available = client.getAvailableSources();

      expect(available).toEqual([
        { id: 'nostr', label: 'Nostr DB' },
        { id: 'openverse', label: 'Openverse' },
      ]);
    });

    it('returns single source', () => {
      const client = new ApiClient('https://api.example.com', [{ id: 'nostr', label: 'Nostr' }]);
      const available = client.getAvailableSources();

      expect(available).toEqual([{ id: 'nostr', label: 'Nostr' }]);
    });
  });

  describe('getDefaultSourceId', () => {
    it('returns selected source as default', () => {
      const client = new ApiClient('https://api.example.com', [
        { id: 'nostr', label: 'Nostr' },
        { id: 'openverse', label: 'OV', selected: true },
      ]);

      expect(client.getDefaultSourceId()).toBe('openverse');
    });

    it('falls back to first source when none selected', () => {
      const client = new ApiClient('https://api.example.com', sources);

      expect(client.getDefaultSourceId()).toBe('nostr');
    });
  });

  describe('getRealSourceIds', () => {
    it('returns all source IDs', () => {
      const client = new ApiClient('https://api.example.com', sources);

      expect(client.getRealSourceIds()).toEqual(['nostr', 'openverse']);
    });
  });
});
