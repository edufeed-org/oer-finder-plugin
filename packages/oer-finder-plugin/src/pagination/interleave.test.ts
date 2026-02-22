import { describe, it, expect } from 'vitest';
import { interleave } from './interleave.js';

describe('interleave', () => {
  it('round-robins from two arrays', () => {
    const result = interleave(
      [
        ['A1', 'A2'],
        ['B1', 'B2'],
      ],
      4,
    );
    expect(result.items).toEqual(['A1', 'B1', 'A2', 'B2']);
    expect(result.consumed).toEqual([2, 2]);
  });

  it('handles uneven arrays', () => {
    const result = interleave([['A1', 'A2', 'A3'], ['B1']], 4);
    expect(result.items).toEqual(['A1', 'B1', 'A2', 'A3']);
    expect(result.consumed).toEqual([3, 1]);
  });

  it('respects the limit', () => {
    const result = interleave(
      [
        ['A1', 'A2', 'A3'],
        ['B1', 'B2', 'B3'],
      ],
      3,
    );
    expect(result.items).toEqual(['A1', 'B1', 'A2']);
    expect(result.consumed).toEqual([2, 1]);
  });

  it('handles empty arrays', () => {
    const result = interleave([[], []], 5);
    expect(result.items).toEqual([]);
    expect(result.consumed).toEqual([0, 0]);
  });

  it('handles single source', () => {
    const result = interleave([['A1', 'A2', 'A3']], 2);
    expect(result.items).toEqual(['A1', 'A2']);
    expect(result.consumed).toEqual([2]);
  });

  it('handles three sources', () => {
    const result = interleave(
      [
        ['A1', 'A2'],
        ['B1', 'B2'],
        ['C1', 'C2'],
      ],
      6,
    );
    expect(result.items).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2']);
    expect(result.consumed).toEqual([2, 2, 2]);
  });

  it('handles zero limit', () => {
    const result = interleave([['A1'], ['B1']], 0);
    expect(result.items).toEqual([]);
    expect(result.consumed).toEqual([0, 0]);
  });

  it('handles no arrays', () => {
    const result = interleave([], 5);
    expect(result.items).toEqual([]);
    expect(result.consumed).toEqual([]);
  });
});
