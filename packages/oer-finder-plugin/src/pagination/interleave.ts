/**
 * Result of interleaving multiple arrays.
 */
export interface InterleaveResult<T> {
  readonly items: readonly T[];
  readonly consumed: readonly number[];
}

/**
 * Interleave items from multiple sources in round-robin order,
 * taking up to `limit` total items.
 *
 * Returns the interleaved items and the count consumed from each source.
 * Pure function. Does not mutate inputs.
 *
 * Example: interleave([[A1,A2,A3], [B1,B2]], 4) =>
 *   { items: [A1, B1, A2, B2], consumed: [2, 2] }
 */
export function interleave<T>(
  arrays: readonly (readonly T[])[],
  limit: number,
): InterleaveResult<T> {
  const items: T[] = [];
  const consumed = new Array<number>(arrays.length).fill(0);
  const maxLen = arrays.reduce((max, a) => Math.max(max, a.length), 0);

  for (let i = 0; i < maxLen && items.length < limit; i++) {
    for (let s = 0; s < arrays.length && items.length < limit; s++) {
      if (i < arrays[s].length) {
        items.push(arrays[s][i]);
        consumed[s]++;
      }
    }
  }

  return { items, consumed };
}
