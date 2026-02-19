import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMaterialsQuery,
  TYPE_TO_MEDIENTYP_SLUGS,
  RpiVirtuellAdapter,
} from './rpi-virtuell.adapter.js';

describe('buildMaterialsQuery', () => {
  it('produces query without taxQuery when no slugs provided', () => {
    const query = buildMaterialsQuery();

    expect(query).toContain('search: $search');
    expect(query).not.toContain('taxQuery');
    expect(query).not.toContain('MEDIENTYP');
  });

  it('includes taxQuery with correct terms when slugs provided', () => {
    const query = buildMaterialsQuery(['picture']);

    expect(query).toContain('taxQuery');
    expect(query).toContain('taxonomy: MEDIENTYP');
    expect(query).toContain('field: SLUG');
    expect(query).toContain('terms: ["picture"]');
    expect(query).toContain('operator: IN');
  });

  it('includes multiple terms when multiple slugs provided', () => {
    const query = buildMaterialsQuery(['audio', 'podcast']);

    expect(query).toContain('terms: ["audio", "podcast"]');
  });
});

describe('TYPE_TO_MEDIENTYP_SLUGS', () => {
  it('covers all UI resource types', () => {
    const uiTypes = ['image', 'video', 'audio', 'text', 'application/pdf'];

    for (const type of uiTypes) {
      expect(TYPE_TO_MEDIENTYP_SLUGS[type]).toBeDefined();
      expect(TYPE_TO_MEDIENTYP_SLUGS[type].length).toBeGreaterThan(0);
    }
  });
});

describe('RpiVirtuellAdapter.search', () => {
  const mockGraphQLResponse = {
    data: {
      materialien: {
        posts: [
          {
            post: { title: 'Test', excerpt: null, content: null },
            learningresourcetypes: null,
            educationallevels: null,
            grades: null,
            tags: null,
            licenses: null,
            authors: null,
            organisations: null,
            origin: null,
            url: 'https://example.com/1',
            import_id: '1',
            date: null,
            image: null,
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('includes taxQuery in request body when type is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({
      keywords: 'test',
      type: 'image',
      page: 1,
      pageSize: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).toContain('taxQuery');
    expect(body.query).toContain('terms: ["picture"]');
  });

  it('omits taxQuery when no type provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({ keywords: 'test', page: 1, pageSize: 10 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).not.toContain('taxQuery');
  });

  it('omits taxQuery for unknown type values', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({
      keywords: 'test',
      type: 'unknown-type',
      page: 1,
      pageSize: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).not.toContain('taxQuery');
  });
});
