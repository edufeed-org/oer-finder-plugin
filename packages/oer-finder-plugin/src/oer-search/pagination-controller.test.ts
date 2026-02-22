import { describe, it, expect } from 'vitest';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { PaginationController } from './pagination-controller.js';
import type { FetchPageFn } from '../pagination/types.js';

type OerItem = components['schemas']['OerItemSchema'];

function mockItem(name: string): OerItem {
  return {
    amb: { name, description: `Desc ${name}` },
    extensions: {
      fileMetadata: null,
      images: null,
      system: { source: 'test', foreignLandingUrl: null, attribution: null },
    },
  };
}

function createTestFetchPage(itemsPerSource = 20, totalPerSource = 100): FetchPageFn {
  return async (sourceId: string, page: number) => {
    const count = Math.min(itemsPerSource, 20);
    const items = Array.from({ length: count }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
    const totalPages = Math.ceil(totalPerSource / count);
    return { items, total: totalPerSource, totalPages, page };
  };
}

describe('PaginationController', () => {
  it('throws if loadFirst called before configure', async () => {
    const controller = new PaginationController();
    await expect(controller.loadFirst()).rejects.toThrow('not configured');
  });

  it('throws if loadNext called before configure', async () => {
    const controller = new PaginationController();
    await expect(controller.loadNext()).rejects.toThrow('not configured');
  });

  it('loads first page successfully', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A', 'B'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    const result = await controller.loadFirst();

    expect(result.items).toHaveLength(10);
    expect(result.meta.shown).toBe(10);
    expect(result.meta.hasMore).toBe(true);
    expect(result.meta.total).toBe(200);
  });

  it('loads subsequent pages without re-fetching', async () => {
    const calls: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push(sourceId);
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const controller = new PaginationController();
    controller.configure({ sourceIds: ['A', 'B'], fetchPage, pageSize: 10 });

    await controller.loadFirst();
    expect(calls).toEqual(['A', 'B']);

    calls.length = 0;
    const second = await controller.loadNext();
    expect(calls).toEqual([]); // No fetches, used buffer
    expect(second.items).toHaveLength(10);
    expect(second.meta.shown).toBe(20);
  });

  it('provides oerMeta for backward compatibility', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 20,
    });

    const result = await controller.loadFirst();

    expect(result.oerMeta).toHaveProperty('total');
    expect(result.oerMeta).toHaveProperty('page');
    expect(result.oerMeta).toHaveProperty('pageSize');
    expect(result.oerMeta).toHaveProperty('totalPages');
    expect(result.oerMeta.pageSize).toBe(20);
    // hasMore=true means page=1, totalPages=2
    expect(result.oerMeta.page).toBe(1);
    expect(result.oerMeta.totalPages).toBe(2);
  });

  it('hasMore reflects available items', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: async (sourceId) => ({
        items: [mockItem(`${sourceId}-only`)],
        total: 1,
        totalPages: 1,
        page: 1,
      }),
      pageSize: 10,
    });

    // After configure but before load, hasMore is true (sources are fresh)
    expect(controller.hasMore).toBe(true);

    const first = await controller.loadFirst();
    expect(first.meta.hasMore).toBe(false);
    expect(controller.hasMore).toBe(false);
  });

  it('reset restores initial state', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    await controller.loadFirst();
    expect(controller.hasMore).toBe(true);

    controller.reset();
    // After reset, hasMore should reflect fresh state (no data loaded)
    expect(controller.hasMore).toBe(true); // sources are active with hasMorePages=true
  });

  it('configure resets state for new search session', async () => {
    const fetchPage = createTestFetchPage();
    const controller = new PaginationController();

    controller.configure({ sourceIds: ['A'], fetchPage, pageSize: 10 });
    await controller.loadFirst();
    await controller.loadNext();

    // Reconfigure with different sources
    controller.configure({ sourceIds: ['B', 'C'], fetchPage, pageSize: 10 });
    const result = await controller.loadFirst();

    expect(result.items).toHaveLength(10);
    expect(result.meta.shown).toBe(10); // Fresh count
  });
});
