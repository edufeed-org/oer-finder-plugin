import { describe, it, expect } from 'vitest';
import {
  isEmptySearch,
  EMPTY_RESULT,
  paginateItems,
  buildExternalOerId,
  AMB_CONTEXT_URL,
} from './adapter-utils';

describe('EMPTY_RESULT', () => {
  it('has zero items and zero total', () => {
    expect(EMPTY_RESULT).toEqual({ items: [], total: 0 });
  });

  it('is frozen and cannot be mutated', () => {
    expect(Object.isFrozen(EMPTY_RESULT)).toBe(true);
  });
});

describe('AMB_CONTEXT_URL', () => {
  it('is the standard AMB JSON-LD context URL', () => {
    expect(AMB_CONTEXT_URL).toBe('https://w3id.org/kim/amb/context.jsonld');
  });
});

describe('isEmptySearch', () => {
  it('returns true for undefined keywords', () => {
    expect(isEmptySearch({ keywords: undefined })).toBe(true);
  });

  it('returns true for empty string keywords', () => {
    expect(isEmptySearch({ keywords: '' })).toBe(true);
  });

  it('returns true for whitespace-only keywords', () => {
    expect(isEmptySearch({ keywords: '   ' })).toBe(true);
  });

  it('returns false for non-empty keywords', () => {
    expect(isEmptySearch({ keywords: 'math' })).toBe(false);
  });
});

describe('paginateItems', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  it('returns the first page of items', () => {
    expect(paginateItems(items, 1, 3)).toEqual(['a', 'b', 'c']);
  });

  it('returns a middle page of items', () => {
    expect(paginateItems(items, 2, 3)).toEqual(['d', 'e', 'f']);
  });

  it('returns a partial last page', () => {
    expect(paginateItems(items, 4, 3)).toEqual(['j']);
  });

  it('returns empty array for page beyond available items', () => {
    expect(paginateItems(items, 5, 3)).toEqual([]);
  });
});

describe('buildExternalOerId', () => {
  it('prefixes numeric id with source id', () => {
    expect(buildExternalOerId('arasaac', 123)).toBe('arasaac-123');
  });

  it('prefixes string id with source id', () => {
    expect(buildExternalOerId('openverse', 'abc-def')).toBe(
      'openverse-abc-def',
    );
  });
});
