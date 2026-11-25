/**
 * Reduces a simulated vector to a plottable number of samples. Plain stride
 * sampling can miss a narrow inrush spike, so each bucket contributes its
 * minimum and maximum instead, which keeps the drawn envelope faithful.
 */

/** Every index of a vector of `length` samples. */
function allIndices(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

/**
 * Picks the indices of a min/max envelope of `values`, at most about
 * `maxPoints` of them, always including the first and last sample.
 */
export function envelopeIndices(
  values: Float64Array,
  maxPoints: number,
): number[] {
  const length = values.length;
  if (length === 0) {
    return [];
  }
  const limit = Number.isFinite(maxPoints) ? Math.floor(maxPoints) : length;
  if (length <= limit) {
    return allIndices(length);
  }
  if (limit < 2) {
    return length === 1 ? [0] : [0, length - 1];
  }

  const buckets = Math.max(1, Math.floor(limit / 2));
  const indices: number[] = [];
  let previous = -1;
  const push = (index: number): void => {
    if (index !== previous) {
      indices.push(index);
      previous = index;
    }
  };

  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const start = Math.floor((bucket * length) / buckets);
    const end = Math.max(
      start + 1,
      Math.floor(((bucket + 1) * length) / buckets),
    );

    let lowest = start;
    let highest = start;
    let lowestValue = values[start]!;
    let highestValue = lowestValue;
    for (let index = start + 1; index < end; index += 1) {
      const value = values[index]!;
      if (value < lowestValue) {
        lowestValue = value;
        lowest = index;
      }
      if (value > highestValue) {
        highestValue = value;
        highest = index;
      }
    }

    push(Math.min(lowest, highest));
    push(Math.max(lowest, highest));
  }

  push(length - 1);
  return indices;
}

/**
 * Picks one shared set of indices covering all of `seriesList`, so several
 * vectors can be plotted against the same time samples.
 */
export function chartIndices(
  seriesList: readonly Float64Array[],
  maxPoints: number,
): number[] {
  const merged = new Set<number>();
  for (const series of seriesList) {
    for (const index of envelopeIndices(series, maxPoints)) {
      merged.add(index);
    }
  }
  return [...merged].sort((left, right) => left - right);
}
