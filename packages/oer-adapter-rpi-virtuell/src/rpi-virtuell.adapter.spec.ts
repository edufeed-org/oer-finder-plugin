import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMaterialsQuery,
  TYPE_TO_MEDIENTYP_SLUGS,
  EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS,
  LICENSE_TO_LIZENZEN_SLUGS,
  RpiVirtuellAdapter,
} from './rpi-virtuell.adapter.js';

describe('buildMaterialsQuery', () => {
  it('produces query without taxQuery when no filters provided', () => {
    const query = buildMaterialsQuery();

    expect(query).toContain('search: $search');
    expect(query).not.toContain('taxQuery');
    expect(query).not.toContain('MEDIENTYP');
  });

  it('includes MEDIENTYP taxQuery when medientypSlugs provided', () => {
    const query = buildMaterialsQuery({ medientypSlugs: ['picture'] });

    expect(query).toContain('taxQuery');
    expect(query).toContain('taxonomy: MEDIENTYP');
    expect(query).toContain('field: SLUG');
    expect(query).toContain('terms: ["picture"]');
    expect(query).toContain('operator: IN');
  });

  it('includes multiple terms when multiple medientyp slugs provided', () => {
    const query = buildMaterialsQuery({ medientypSlugs: ['audio', 'podcast'] });

    expect(query).toContain('terms: ["audio", "podcast"]');
  });

  it('includes BILDUNGSSTUFE taxQuery when bildungsstufeSlugs provided', () => {
    const query = buildMaterialsQuery({ bildungsstufeSlugs: ['primary'] });

    expect(query).toContain('taxQuery');
    expect(query).toContain('taxonomy: BILDUNGSSTUFE');
    expect(query).toContain('terms: ["primary"]');
  });

  it('includes both taxonomy filters when both provided', () => {
    const query = buildMaterialsQuery({
      medientypSlugs: ['video'],
      bildungsstufeSlugs: ['secondary'],
    });

    expect(query).toContain('taxonomy: MEDIENTYP');
    expect(query).toContain('taxonomy: BILDUNGSSTUFE');
    expect(query).toContain('relation: AND');
  });

  it('includes LIZENZEN taxQuery when lizenzenSlugs provided', () => {
    const query = buildMaterialsQuery({ lizenzenSlugs: ['remixable'] });

    expect(query).toContain('taxQuery');
    expect(query).toContain('taxonomy: LIZENZEN');
    expect(query).toContain('terms: ["remixable"]');
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

describe('EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS', () => {
  it('maps known AMB educational level URIs to slugs', () => {
    const knownLevels = [
      'https://w3id.org/kim/educationalLevel/level_0',
      'https://w3id.org/kim/educationalLevel/level_1',
      'https://w3id.org/kim/educationalLevel/level_2',
      'https://w3id.org/kim/educationalLevel/level_3',
      'https://w3id.org/kim/educationalLevel/level_A',
    ];

    for (const level of knownLevels) {
      expect(EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS[level]).toBeDefined();
      expect(EDUCATIONALLEVEL_TO_BILDUNGSSTUFE_SLUGS[level].length).toBeGreaterThan(0);
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

  it('includes BILDUNGSSTUFE taxQuery when educationalLevel is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({
      keywords: 'test',
      educationalLevel: 'https://w3id.org/kim/educationalLevel/level_1',
      page: 1,
      pageSize: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).toContain('taxonomy: BILDUNGSSTUFE');
    expect(body.query).toContain('terms: ["primary"]');
  });

  it('includes LIZENZEN taxQuery when license is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({
      keywords: 'test',
      license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      page: 1,
      pageSize: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).toContain('taxonomy: LIZENZEN');
    expect(body.query).toContain('terms: ["remixable"]');
  });

  it('omits BILDUNGSSTUFE taxQuery for unknown educational level URIs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new RpiVirtuellAdapter();
    await adapter.search({
      keywords: 'test',
      educationalLevel: 'https://example.com/unknown-level',
      page: 1,
      pageSize: 10,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      query: string;
    };
    expect(body.query).not.toContain('BILDUNGSSTUFE');
  });
});
