import { describe, it, expect } from 'vitest';
import { interleave } from './interleave.js';

describe('interleave', () => {
  it('round-robins from two arrays', () => {
    expect(
      interleave(
        [
          ['A1', 'A2'],
          ['B1', 'B2'],
        ],
        4,
      ),
    ).toEqual({ items: ['A1', 'B1', 'A2', 'B2'], consumed: [2, 2] });
  });

  it('handles uneven arrays', () => {
    expect(interleave([['A1', 'A2', 'A3'], ['B1']], 4)).toEqual({
      items: ['A1', 'B1', 'A2', 'A3'],
      consumed: [3, 1],
    });
  });

  it('respects the limit', () => {
    expect(
      interleave(
        [
          ['A1', 'A2', 'A3'],
          ['B1', 'B2', 'B3'],
        ],
        3,
      ),
    ).toEqual({ items: ['A1', 'B1', 'A2'], consumed: [2, 1] });
  });

  it('handles empty arrays', () => {
    expect(interleave([[], []], 5)).toEqual({ items: [], consumed: [0, 0] });
  });

  it('handles single source', () => {
    expect(interleave([['A1', 'A2', 'A3']], 2)).toEqual({
      items: ['A1', 'A2'],
      consumed: [2],
    });
  });

  it('handles three sources', () => {
    expect(
      interleave(
        [
          ['A1', 'A2'],
          ['B1', 'B2'],
          ['C1', 'C2'],
        ],
        6,
      ),
    ).toEqual({
      items: ['A1', 'B1', 'C1', 'A2', 'B2', 'C2'],
      consumed: [2, 2, 2],
    });
  });

  it('handles zero limit', () => {
    expect(interleave([['A1'], ['B1']], 0)).toEqual({ items: [], consumed: [0, 0] });
  });

  it('handles no arrays', () => {
    expect(interleave([], 5)).toEqual({ items: [], consumed: [] });
  });
});
