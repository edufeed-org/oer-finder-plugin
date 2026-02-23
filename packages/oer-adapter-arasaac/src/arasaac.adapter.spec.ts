import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArasaacAdapter } from './arasaac.adapter.js';

function makeQuery(overrides?: Record<string, unknown>) {
  return { keywords: 'sun', page: 1, pageSize: 10, ...overrides };
}

function makePictogram(id: number) {
  return {
    _id: id,
    schematic: false,
    sex: false,
    violence: false,
    aac: true,
    aacColor: true,
    skin: false,
    hair: false,
    categories: [],
    synsets: [],
    tags: ['test'],
    keywords: [{ keyword: `pictogram-${id}`, type: 1 }],
  };
}

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  });
}

describe('ArasaacAdapter', () => {
  let adapter: ArasaacAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new ArasaacAdapter();
  });

  it('returns empty result for empty keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('returns empty result for whitespace-only keywords', async () => {
    const result = await adapter.search(makeQuery({ keywords: '   ' }));

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('constructs correct API URL with language and encoded keywords', async () => {
    const mockFetch = mockFetchResponse([makePictogram(1)]);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery({ keywords: 'hello world', language: 'de' }));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.arasaac.org/api/pictograms/de/search/hello%20world',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('defaults language to en when not specified', async () => {
    const mockFetch = mockFetchResponse([makePictogram(1)]);
    vi.stubGlobal('fetch', mockFetch);

    await adapter.search(makeQuery());

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/pictograms/en/search/'),
      expect.any(Object),
    );
  });

  it('returns empty result on 404 response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(null, 404));

    const result = await adapter.search(makeQuery());

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('throws on non-404 error responses', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(null, 500));

    await expect(adapter.search(makeQuery())).rejects.toThrow(
      'ARASAAC API error: 500',
    );
  });

  it('reports total count from full API response', async () => {
    const pictograms = Array.from({ length: 5 }, (_, i) => makePictogram(i));
    vi.stubGlobal('fetch', mockFetchResponse(pictograms));

    const result = await adapter.search(makeQuery({ page: 2, pageSize: 2 }));

    expect(result.total).toBe(5);
  });

  it('returns correct number of items for requested page size', async () => {
    const pictograms = Array.from({ length: 5 }, (_, i) => makePictogram(i));
    vi.stubGlobal('fetch', mockFetchResponse(pictograms));

    const result = await adapter.search(makeQuery({ page: 2, pageSize: 2 }));

    expect(result.items).toHaveLength(2);
  });

  it('returns items offset by page number', async () => {
    const pictograms = Array.from({ length: 5 }, (_, i) => makePictogram(i));
    vi.stubGlobal('fetch', mockFetchResponse(pictograms));

    const result = await adapter.search(makeQuery({ page: 2, pageSize: 2 }));

    expect(result.items.map((item) => item.id)).toEqual(['arasaac-2', 'arasaac-3']);
  });

  it('passes AbortSignal to fetch', async () => {
    const mockFetch = mockFetchResponse([makePictogram(1)]);
    vi.stubGlobal('fetch', mockFetch);
    const controller = new AbortController();

    await adapter.search(makeQuery(), { signal: controller.signal });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
