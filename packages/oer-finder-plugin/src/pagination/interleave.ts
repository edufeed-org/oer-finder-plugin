/**
 * Result of interleaving multiple arrays.
 */
export interface InterleaveResult<T> {
  readonly items: readonly T[];
  readonly consumed: readonly number[];
}

// Find next non-exhausted source starting from nextSourceId. consumed[source] is the cursor.
function nextAvailableSource<T>(
  arrays: readonly (readonly T[])[],
  consumed: readonly number[],
  nextSourceId: number,
): number | null {
  for (let i = 0; i < arrays.length; i++) {
    const source = (nextSourceId + i) % arrays.length;
    if (consumed[source] < arrays[source].length) return source;
  }
  return null;
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
  const effectiveLimit = Math.max(0, limit);

  // Reduce over `limit` slots. Each slot picks arrays[source][consumed[source]]
  // round-robin, skipping exhausted sources.
  const { items, consumed } = Array.from({ length: effectiveLimit }).reduce<
    InterleaveResult<T> & { readonly nextSourceId: number }
  >(
    (acc) => {
      const source = nextAvailableSource(arrays, acc.consumed, acc.nextSourceId);
      if (source === null) return acc;
      return {
        items: [...acc.items, arrays[source][acc.consumed[source]]],
        consumed: acc.consumed.map((c, i) => (i === source ? c + 1 : c)),
        nextSourceId: (source + 1) % arrays.length,
      };
    },
    { items: [], consumed: arrays.map(() => 0), nextSourceId: 0 },
  );

  return { items, consumed };
}
