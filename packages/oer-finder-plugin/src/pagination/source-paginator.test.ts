import { describe, it, expect } from 'vitest';
import type { components } from '@edufeed-org/oer-finder-api-client';
import {
  createSourceState,
  isSourceAvailable,
  isBufferEmpty,
  canFetchMore,
  takeItems,
  applyFetchSuccess,
  applyFetchFailure,
  markExhausted,
  resetSource,
} from './source-paginator.js';
import type { FetchPageResult } from './types.js';

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

describe('createSourceState', () => {
  it('creates initial state with correct defaults', () => {
    const state = createSourceState('openverse');
    expect(state).toEqual({
      sourceId: 'openverse',
      nextPage: 1,
      buffer: [],
      hasMorePages: true,
      active: true,
      serverTotal: 0,
    });
  });
});

describe('isSourceAvailable', () => {
  it('returns true for fresh source', () => {
    expect(isSourceAvailable(createSourceState('a'))).toBe(true);
  });

  it('returns true when buffer has items', () => {
    const state = { ...createSourceState('a'), buffer: [mockItem('x')], hasMorePages: false };
    expect(isSourceAvailable(state)).toBe(true);
  });

  it('returns false when inactive', () => {
    const state = { ...createSourceState('a'), active: false };
    expect(isSourceAvailable(state)).toBe(false);
  });

  it('returns false when inactive with empty buffer and no more pages', () => {
    const state = { ...createSourceState('a'), active: false, hasMorePages: false };
    expect(isSourceAvailable(state)).toBe(false);
  });
});

describe('isBufferEmpty', () => {
  it('returns true for fresh source', () => {
    expect(isBufferEmpty(createSourceState('a'))).toBe(true);
  });

  it('returns false when buffer has items', () => {
    const state = { ...createSourceState('a'), buffer: [mockItem('x')] };
    expect(isBufferEmpty(state)).toBe(false);
  });

  it('returns false when no more pages even if buffer is empty', () => {
    const state = { ...createSourceState('a'), hasMorePages: false };
    expect(isBufferEmpty(state)).toBe(false);
  });
});

describe('canFetchMore', () => {
  it('returns true for fresh source', () => {
    expect(canFetchMore(createSourceState('a'))).toBe(true);
  });

  it('returns false when inactive', () => {
    const state = { ...createSourceState('a'), active: false };
    expect(canFetchMore(state)).toBe(false);
  });

  it('returns false when no more pages', () => {
    const state = { ...createSourceState('a'), hasMorePages: false };
    expect(canFetchMore(state)).toBe(false);
  });
});

describe('takeItems', () => {
  it('takes requested count and returns remaining buffer', () => {
    const items = [mockItem('a'), mockItem('b'), mockItem('c')];
    const state = { ...createSourceState('x'), buffer: items };
    const { items: taken, nextState } = takeItems(state, 2);

    expect(taken).toEqual([items[0], items[1]]);
    expect(nextState.buffer).toEqual([items[2]]);
  });

  it('returns all items when requesting more than available', () => {
    const items = [mockItem('a')];
    const state = { ...createSourceState('x'), buffer: items };
    const { items: taken, nextState } = takeItems(state, 5);

    expect(taken).toEqual(items);
    expect(nextState.buffer).toEqual([]);
  });

  it('returns empty array when buffer is empty', () => {
    const state = createSourceState('x');
    const { items: taken, nextState } = takeItems(state, 3);

    expect(taken).toEqual([]);
    expect(nextState.buffer).toEqual([]);
  });

  it('does not mutate original state', () => {
    const items = [mockItem('a'), mockItem('b')];
    const state = { ...createSourceState('x'), buffer: items };
    takeItems(state, 1);

    expect(state.buffer).toHaveLength(2);
  });
});

describe('applyFetchSuccess', () => {
  it('appends items to buffer and advances page', () => {
    const state = createSourceState('a');
    const fetchResult: FetchPageResult = {
      items: [mockItem('x'), mockItem('y')],
      total: 50,
      totalPages: 3,
      page: 1,
    };

    const newState = applyFetchSuccess(state, fetchResult);

    expect(newState).toEqual({
      sourceId: 'a',
      nextPage: 2,
      buffer: fetchResult.items,
      hasMorePages: true,
      active: true,
      serverTotal: 50,
    });
  });

  it('marks hasMorePages false when on last page', () => {
    const state = { ...createSourceState('a'), nextPage: 3 };
    const fetchResult: FetchPageResult = {
      items: [mockItem('z')],
      total: 5,
      totalPages: 3,
      page: 3,
    };

    const newState = applyFetchSuccess(state, fetchResult);

    expect(newState.hasMorePages).toBe(false);
    expect(newState.nextPage).toBe(4);
  });

  it('appends to existing buffer', () => {
    const existing = [mockItem('existing')];
    const state = { ...createSourceState('a'), buffer: existing, nextPage: 2 };
    const fetchResult: FetchPageResult = {
      items: [mockItem('new')],
      total: 10,
      totalPages: 5,
      page: 2,
    };

    const newState = applyFetchSuccess(state, fetchResult);

    expect(newState.buffer.map((i) => i.amb.name)).toEqual(['existing', 'new']);
  });
});

describe('applyFetchFailure', () => {
  it('permanently marks source as inactive', () => {
    const state = createSourceState('a');
    const result = applyFetchFailure(state);

    expect(result.active).toBe(false);
    expect(result.hasMorePages).toBe(false);
  });

  it('preserves buffer contents', () => {
    const state = { ...createSourceState('a'), buffer: [mockItem('x')] };
    const result = applyFetchFailure(state);

    expect(result.buffer).toEqual([mockItem('x')]);
  });
});

describe('markExhausted', () => {
  it('sets hasMorePages to false', () => {
    const state = createSourceState('a');
    const result = markExhausted(state);

    expect(result.hasMorePages).toBe(false);
    expect(result.active).toBe(true);
  });
});

describe('resetSource', () => {
  it('returns fresh initial state', () => {
    const state = resetSource('a');
    expect(state).toEqual(createSourceState('a'));
  });
});
