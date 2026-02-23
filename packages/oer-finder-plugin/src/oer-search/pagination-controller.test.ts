import { describe, it, expect } from 'vitest';
import { PaginationController } from './pagination-controller.js';
import type { FetchPageFn } from '../pagination/types.js';
import { mockItem } from '../pagination/test-helpers.js';

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

  it('loads first page with correct number of items', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A', 'B'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    const result = await controller.loadFirst();

    expect(result.items).toHaveLength(10);
  });

  it('loads first page with correct meta', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A', 'B'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    const result = await controller.loadFirst();

    expect(result.meta).toEqual({ shown: 10, hasMore: true, total: 200 });
  });

  it('does not re-fetch on subsequent page when buffer has items', async () => {
    const calls: string[] = [];
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      calls.push(sourceId);
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const controller = new PaginationController();
    controller.configure({ sourceIds: ['A', 'B'], fetchPage, pageSize: 10 });
    await controller.loadFirst();

    calls.length = 0;
    await controller.loadNext();

    expect(calls).toEqual([]);
  });

  it('returns correct number of items on subsequent page', async () => {
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const controller = new PaginationController();
    controller.configure({ sourceIds: ['A', 'B'], fetchPage, pageSize: 10 });
    await controller.loadFirst();

    const second = await controller.loadNext();

    expect(second.items).toHaveLength(10);
  });

  it('returns correct meta on subsequent page', async () => {
    const fetchPage: FetchPageFn = async (sourceId, page) => {
      const items = Array.from({ length: 20 }, (_, i) => mockItem(`${sourceId}-p${page}-${i}`));
      return { items, total: 100, totalPages: 5, page };
    };

    const controller = new PaginationController();
    controller.configure({ sourceIds: ['A', 'B'], fetchPage, pageSize: 10 });
    await controller.loadFirst();

    const second = await controller.loadNext();

    expect(second.meta).toEqual({ shown: 20, hasMore: true, total: 200 });
  });

  it('hasMore is true before loading', () => {
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

    expect(controller.hasMore).toBe(true);
  });

  it('meta.hasMore is false when all items consumed', async () => {
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

    const first = await controller.loadFirst();

    expect(first.meta.hasMore).toBe(false);
  });

  it('controller.hasMore is false when all items consumed', async () => {
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

    await controller.loadFirst();

    expect(controller.hasMore).toBe(false);
  });

  it('reset restores hasMore to true', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    await controller.loadFirst();
    controller.reset();

    expect(controller.hasMore).toBe(true);
  });

  it('clear sets hasMore to false', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    await controller.loadFirst();
    controller.clear();

    expect(controller.hasMore).toBe(false);
  });

  it('clear makes loadFirst throw not configured', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    await controller.loadFirst();
    controller.clear();

    await expect(controller.loadFirst()).rejects.toThrow('not configured');
  });

  it('clear makes loadNext throw not configured', async () => {
    const controller = new PaginationController();
    controller.configure({
      sourceIds: ['A'],
      fetchPage: createTestFetchPage(),
      pageSize: 10,
    });

    await controller.loadFirst();
    controller.clear();

    await expect(controller.loadNext()).rejects.toThrow('not configured');
  });

  it('configure resets item count for new search session', async () => {
    const fetchPage = createTestFetchPage();
    const controller = new PaginationController();

    controller.configure({ sourceIds: ['A'], fetchPage, pageSize: 10 });
    await controller.loadFirst();
    await controller.loadNext();

    // Reconfigure with different sources
    controller.configure({ sourceIds: ['B', 'C'], fetchPage, pageSize: 10 });
    const result = await controller.loadFirst();

    expect(result.items).toHaveLength(10);
  });

  it('configure resets shown count for new search session', async () => {
    const fetchPage = createTestFetchPage();
    const controller = new PaginationController();

    controller.configure({ sourceIds: ['A'], fetchPage, pageSize: 10 });
    await controller.loadFirst();
    await controller.loadNext();

    // Reconfigure with different sources
    controller.configure({ sourceIds: ['B', 'C'], fetchPage, pageSize: 10 });
    const result = await controller.loadFirst();

    expect(result.meta.shown).toBe(10);
  });
});
