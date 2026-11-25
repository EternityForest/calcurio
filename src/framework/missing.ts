const MISSING_BRAND: unique symbol = Symbol('calcurio.missing');

/**
 * Sentinel returned by a computable function when it cannot produce a value
 * because other variables are not available yet.
 */
export interface MissingValue {
  readonly [MISSING_BRAND]: true;
  /** Names of the variables that are still needed. */
  readonly needs: readonly string[];
}

/**
 * Builds a missing-value sentinel. The runtime shows `needs` as the reason the
 * variable has no value.
 */
export function missing(needs: readonly string[]): MissingValue {
  return Object.freeze({
    [MISSING_BRAND]: true as const,
    needs: Object.freeze([...needs]),
  });
}

/**
 * Narrows an unknown value to the missing-value sentinel.
 */
export function isMissing(value: unknown): value is MissingValue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<MissingValue>;
  return candidate[MISSING_BRAND] === true && Array.isArray(candidate.needs);
}
