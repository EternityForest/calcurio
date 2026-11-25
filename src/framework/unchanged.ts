const UNCHANGED_BRAND: unique symbol = Symbol('calcurio.unchanged');

/**
 * Sentinel returned by an implicit computable when this round must leave the
 * current value alone. Unlike `missing`, it does not clear the value.
 */
export interface UnchangedValue {
  readonly [UNCHANGED_BRAND]: true;
}

const UNCHANGED: UnchangedValue = Object.freeze({
  [UNCHANGED_BRAND]: true as const,
});

/** Signals that a computed variable should keep its current value. */
export function unchanged(): UnchangedValue {
  return UNCHANGED;
}

/** Narrows an unknown value to the unchanged sentinel. */
export function isUnchanged(value: unknown): value is UnchangedValue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (value as Partial<UnchangedValue>)[UNCHANGED_BRAND] === true;
}