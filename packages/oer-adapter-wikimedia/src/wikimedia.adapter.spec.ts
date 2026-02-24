import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WikimediaAdapter } from './wikimedia.adapter.js';
import type { WikimediaSearchResponse } from './wikimedia.types.js';

type WikimediaPages = NonNullable<
  NonNullable<WikimediaSearchResponse['query']>['pages']
>;

function makeQuery(overrides?: Record<string, unknown>) {
  return { keywords: 'sunset', page: 1, pageSize: 10, ...overrides };
}

function makePage(pageid: number, index: number): WikimediaPages {
  return {
    [pageid.toString()]: {
      pageid,
      ns: 6,
      title: `File:Test-${pageid}.jpg`,
      index,
      imageinfo: [
        {
          url: `https://upload.wikimedia.org/commons/${pageid}.jpg`,
          descriptionurl: `https://commons.wikimedia.org/wiki/File:Test-${pageid}.jpg`,
          width: 1000,
          height: 800,
          size: 500000,
          mime: 'image/jpeg',
          thumburl: `https://upload.wikimedia.org/commons/thumb/${pageid}.jpg`,
          thumbwidth: 400,
          thumbheight: 320,
          extmetadata: {
            LicenseUrl: {
              value: 'https://creativecommons.org/licenses/by-sa/4.0',
            },
            LicenseShortName: { value: 'CC BY-SA 4.0' },
            Artist: { value: 'Test Author' },
            ImageDescription: { value: 'Test description' },
          },
        },
      ],
    },
  };
}

function makeResponse(
  pages: WikimediaPages,
  hasContinue = false,
): WikimediaSearchResponse {
  return {
    batchcomplete: '',
    ...(hasContinue
      ? { continue: { gsroffset: 10, continue: 'gsroffset||' } }
      : {}),
    query: { pages },
  };
}

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  });
}

function getFetchUrl(): URL {
  const fetchCall = vi.mocked(fetch).mock.calls[0];
  return new URL(fetchCall[0] as string);
}

describe('WikimediaAdapter', () => {
  let adapter: WikimediaAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new WikimediaAdapter();
  });

  it('exposes correct sourceId', () => {
    expect(adapter.sourceId).toBe('wikimedia');
  });

  it('exposes correct sourceName', () => {
    expect(adapter.sourceName).toBe('Wikimedia Commons');
  });

  it('declares image-only capabilities without license filter', () => {
    expect(adapter.capabilities).toEqual({
      supportedTypes: ['image'],
      supportsLicenseFilter: false,
      supportsEducationalLevelFilter: false,
    });
  });

  it('returns empty result for empty keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('returns empty result for whitespace-only keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '   ' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('sends search term as gsrsearch parameter', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery({ keywords: 'hello world' }));

    expect(getFetchUrl().searchParams.get('gsrsearch')).toBe('hello world');
  });

  it('targets Wikimedia Commons API endpoint', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery());

    const url = getFetchUrl();
    expect(url.origin + url.pathname).toBe(
      'https://commons.wikimedia.org/w/api.php',
    );
  });

  it('searches in file namespace only', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery());

    expect(getFetchUrl().searchParams.get('gsrnamespace')).toBe('6');
  });

  it('sets gsroffset to 0 for page 1', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery({ page: 1, pageSize: 10 }));

    expect(getFetchUrl().searchParams.get('gsroffset')).toBe('0');
  });

  it('computes correct gsroffset for page 2', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery({ page: 2, pageSize: 10 }));

    expect(getFetchUrl().searchParams.get('gsroffset')).toBe('10');
  });

  it('caps gsrlimit at 50', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery({ pageSize: 100 }));

    expect(getFetchUrl().searchParams.get('gsrlimit')).toBe('50');
  });

  it('enables CORS with origin=* parameter', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(1, 1))));

    await adapter.search(makeQuery());

    expect(getFetchUrl().searchParams.get('origin')).toBe('*');
  });

  it('returns correct number of mapped items', async () => {
    const pages = { ...makePage(1, 1), ...makePage(2, 2) };
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(pages)));

    const result = await adapter.search(makeQuery());

    expect(result.items).toHaveLength(2);
  });

  it('prefixes item ids with wikimedia-', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(makePage(42, 1))));

    const result = await adapter.search(makeQuery());

    expect(result.items[0].id).toBe('wikimedia-42');
  });

  it('estimates total greater than items when continue is present', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(makeResponse(makePage(1, 1), true)),
    );

    const result = await adapter.search(makeQuery());

    expect(result.total).toBeGreaterThan(result.items.length);
  });

  it('returns exact item count as total when no continue present', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(makeResponse(makePage(1, 1), false)),
    );

    const result = await adapter.search(makeQuery());

    expect(result.total).toBe(1);
  });

  it('returns empty result when API returns no query object', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ batchcomplete: '' }));

    const result = await adapter.search(makeQuery());

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('returns empty result on 404 response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(null, 404));

    const result = await adapter.search(makeQuery());

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('throws on 500 error response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(null, 500));

    await expect(adapter.search(makeQuery())).rejects.toThrow(
      'Wikimedia Commons API error: 500',
    );
  });

  it('passes AbortSignal to fetch', async () => {
    const mockFetch = mockFetchResponse(makeResponse(makePage(1, 1)));
    vi.stubGlobal('fetch', mockFetch);
    const controller = new AbortController();

    await adapter.search(makeQuery(), { signal: controller.signal });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('sends Api-User-Agent header', async () => {
    const mockFetch = mockFetchResponse(makeResponse(makePage(1, 1)));
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery());

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Api-User-Agent': expect.stringContaining(
            'edufeed-oer-finder-plugin',
          ),
        }),
      }),
    );
  });

  it('filters out pages without imageinfo', async () => {
    const pages: WikimediaPages = {
      ...makePage(1, 1),
      '999': { pageid: 999, ns: 6, title: 'File:NoImage.jpg', index: 2 },
    };
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(pages)));

    const result = await adapter.search(makeQuery());

    expect(result.items).toHaveLength(1);
  });

  it('sorts pages by index for search relevance', async () => {
    const pages = { ...makePage(100, 2), ...makePage(200, 1) };
    vi.stubGlobal('fetch', mockFetchResponse(makeResponse(pages)));

    const result = await adapter.search(makeQuery());

    expect(result.items.map((item) => item.id)).toEqual([
      'wikimedia-200',
      'wikimedia-100',
    ]);
  });
});
