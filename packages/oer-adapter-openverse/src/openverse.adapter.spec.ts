import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenverseAdapter } from './openverse.adapter.js';

function makeQuery(overrides?: Record<string, unknown>) {
  return { keywords: 'nature', page: 1, pageSize: 10, ...overrides };
}

function makeOpenverseResponse(
  results: Array<Record<string, unknown>> = [],
  resultCount?: number,
) {
  return {
    result_count: resultCount ?? results.length,
    page_count: 1,
    results,
  };
}

function makeImage(id: string) {
  return {
    id,
    title: `Image ${id}`,
    foreign_landing_url: `https://flickr.com/${id}`,
    url: `https://example.com/${id}.jpg`,
    license: 'by',
    license_version: '4.0',
  };
}

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(''),
  });
}

function mockFetchError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('error body'),
  });
}

describe('OpenverseAdapter', () => {
  let adapter: OpenverseAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new OpenverseAdapter();
  });

  it('returns empty result for empty keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('returns empty result for whitespace-only keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '   ' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('sets search query parameter from keywords', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery({ keywords: 'cats', page: 2, pageSize: 5 }));

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('q')).toBe('cats');
  });

  it('sets page and page_size parameters', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery({ keywords: 'cats', page: 2, pageSize: 5 }));

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('sets safe search defaults', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery({ keywords: 'cats' }));

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('mature')).toBe('false');
  });

  it('enables dead link filtering', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery({ keywords: 'cats' }));

    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('filter_dead')).toBe('true');
  });

  it('maps license URI to Openverse code', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(
      makeQuery({
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      }),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get('license')).toBe('by-sa');
  });

  it('does not set license param for unrecognized URI', async () => {
    const body = makeOpenverseResponse([makeImage('1')]);
    const mockFetch = mockFetchOk(body);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(
      makeQuery({ license: 'https://example.com/custom-license' }),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.has('license')).toBe(false);
  });

  it('returns correct total from API response', async () => {
    const body = makeOpenverseResponse(
      [makeImage('a'), makeImage('b')],
      42,
    );
    vi.stubGlobal('fetch', mockFetchOk(body));

    const result = await adapter.search(makeQuery());

    expect(result.total).toBe(42);
  });

  it('returns correct number of mapped items', async () => {
    const body = makeOpenverseResponse(
      [makeImage('a'), makeImage('b')],
      42,
    );
    vi.stubGlobal('fetch', mockFetchOk(body));

    const result = await adapter.search(makeQuery());

    expect(result.items).toHaveLength(2);
  });

  it('prefixes item ids with openverse source id', async () => {
    const body = makeOpenverseResponse(
      [makeImage('a'), makeImage('b')],
      42,
    );
    vi.stubGlobal('fetch', mockFetchOk(body));

    const result = await adapter.search(makeQuery());

    expect(result.items.map((item) => item.id)).toEqual(['openverse-a', 'openverse-b']);
  });

  it('returns empty result on 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      }),
    );

    const result = await adapter.search(makeQuery());

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('throws on non-retryable error', async () => {
    vi.stubGlobal('fetch', mockFetchError(400));

    await expect(adapter.search(makeQuery())).rejects.toThrow(
      'Openverse API error: 400',
    );
  });

  it('passes AbortSignal to fetch', async () => {
    const mockFetch = mockFetchOk(makeOpenverseResponse([makeImage('1')]));
    vi.stubGlobal('fetch', mockFetch);
    const controller = new AbortController();

    await adapter.search(makeQuery(), { signal: controller.signal });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
