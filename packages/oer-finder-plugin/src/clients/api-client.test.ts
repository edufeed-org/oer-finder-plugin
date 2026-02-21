import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from './api-client.js';
import { SOURCE_ID_ALL } from '../constants.js';
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

  describe('searchAll', () => {
    it('fires one request per source when source is all', async () => {
      const capturedQueries: Record<string, unknown>[] = [];

      const mockClient = createMockOerClient(async (_path, opts) => {
        capturedQueries.push(opts.params.query);
        const source = opts.params.query.source as string;
        const items = Array.from({ length: 5 }, (_, i) =>
          createMockOerItem(`${source}-${i}`, source),
        );
        return createMockApiResponse(items, 50, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);

      const result = await client.search({
        source: SOURCE_ID_ALL,
        searchTerm: 'test',
        page: 1,
        pageSize: 20,
      });

      expect(capturedQueries).toHaveLength(2);
      expect(capturedQueries[0]).toMatchObject({ source: 'nostr', searchTerm: 'test' });
      expect(capturedQueries[1]).toMatchObject({ source: 'openverse', searchTerm: 'test' });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.allSourcesState).toBeDefined();
      expect(result.allSourcesState!.cursors).toHaveLength(2);
    });

    it('fills gaps when one source returns fewer results', async () => {
      const mockClient = createMockOerClient(async (_path, opts) => {
        const source = opts.params.query.source as string;
        if (source === 'nostr') {
          const items = Array.from({ length: 3 }, (_, i) =>
            createMockOerItem(`nostr-${i}`, 'nostr'),
          );
          return createMockApiResponse(items, 3, 1, 20);
        }
        const items = Array.from({ length: 20 }, (_, i) =>
          createMockOerItem(`openverse-${i}`, 'openverse'),
        );
        return createMockApiResponse(items, 100, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);

      const result = await client.search({
        source: SOURCE_ID_ALL,
        searchTerm: 'test',
        pageSize: 20,
      });

      expect(result.data).toHaveLength(20);
    });

    it('forwards all filter params to each source request', async () => {
      const capturedQueries: Record<string, unknown>[] = [];

      const mockClient = createMockOerClient(async (_path, opts) => {
        capturedQueries.push(opts.params.query);
        return createMockApiResponse([], 0, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);

      await client.search({
        source: SOURCE_ID_ALL,
        searchTerm: 'biology',
        type: 'image',
        license: 'CC BY 4.0',
        language: 'en',
        pageSize: 10,
      });

      for (const query of capturedQueries) {
        expect(query).toMatchObject({
          searchTerm: 'biology',
          type: 'image',
          license: 'CC BY 4.0',
          language: 'en',
        });
      }
    });

    it('does not send allSourcesState to the server', async () => {
      const capturedQueries: Record<string, unknown>[] = [];

      const mockClient = createMockOerClient(async (_path, opts) => {
        capturedQueries.push(opts.params.query);
        return createMockApiResponse([], 0, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);

      await client.search({
        source: SOURCE_ID_ALL,
        searchTerm: 'test',
        pageSize: 20,
        allSourcesState: {
          cursors: [
            { sourceId: 'nostr', nextPage: 2, nextSkip: 0, hasMore: true },
            { sourceId: 'openverse', nextPage: 2, nextSkip: 0, hasMore: true },
          ],
        },
      });

      for (const query of capturedQueries) {
        expect(query).not.toHaveProperty('allSourcesState');
      }
    });

    it('handles API error from one source gracefully', async () => {
      const mockClient = createMockOerClient(async (_path, opts) => {
        const source = opts.params.query.source as string;
        if (source === 'nostr') {
          return createMockErrorResponse(500, 'Internal error');
        }
        const items = Array.from({ length: 20 }, (_, i) =>
          createMockOerItem(`openverse-${i}`, 'openverse'),
        );
        return createMockApiResponse(items, 100, 1, 20);
      });

      const client = new ApiClient(mockClient, sources);

      const result = await client.search({
        source: SOURCE_ID_ALL,
        searchTerm: 'test',
        pageSize: 20,
      });

      expect(result.data).toHaveLength(20);
      expect(result.data[0].extensions.system.source).toBe('openverse');
    });
  });

  describe('getAvailableSources', () => {
    it('prepends all option when 2+ sources configured', () => {
      const client = new ApiClient('https://api.example.com', sources);
      const available = client.getAvailableSources();

      expect(available).toEqual([
        { id: SOURCE_ID_ALL, label: 'All Sources' },
        { id: 'nostr', label: 'Nostr DB' },
        { id: 'openverse', label: 'Openverse' },
      ]);
    });

    it('does not add all option with single source', () => {
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
});
