import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function numberOrNull(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function needs(state: Readonly<CalcState>, names: readonly string[]): string[] {
  return names.filter((name) => numberOrNull(state, name) === null);
}

/**
 * Right triangle side lengths via the Pythagorean theorem (a² + b² = c²).
 * Enter any two sides to Calculate the third.
 */
export const pythagoreanTheorem: CalculatorDefinition = {
  id: 'pythagorean-theorem',
  title: 'Pythagorean Theorem',
  description:
    'Relate the three sides of a right triangle using a² + b² = c². ' +
    'Enter any two sides, then Calculate the third.',
  variables: [
    {
      name: 'a',
      label: 'Side A',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'One leg of the right triangle.',
      validate: (state) => {
        const a = numberOrNull(state, 'a');
        return a !== null && a < 0
          ? 'Side length cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const c = numberOrNull(state, 'c');
        const b = numberOrNull(state, 'b');
        if (c !== null && b !== null) {
          if (c <= 0 || b >= c) {
            return missing(['c', 'b']);
          }
          return Math.sqrt(c * c - b * b);
        }
        return missing(needs(state, ['c', 'b']));
      },
    },
    {
      name: 'b',
      label: 'Side B',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Other leg of the right triangle.',
      validate: (state) => {
        const b = numberOrNull(state, 'b');
        return b !== null && b < 0
          ? 'Side length cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const c = numberOrNull(state, 'c');
        const a = numberOrNull(state, 'a');
        if (c !== null && a !== null) {
          if (c <= 0 || a >= c) {
            return missing(['c', 'a']);
          }
          return Math.sqrt(c * c - a * a);
        }
        return missing(needs(state, ['c', 'a']));
      },
    },
    {
      name: 'c',
      label: 'Hypotenuse',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Longest side, opposite the right angle.',
      validate: (state) => {
        const c = numberOrNull(state, 'c');
        return c !== null && c < 0
          ? 'Side length cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const a = numberOrNull(state, 'a');
        const b = numberOrNull(state, 'b');
        if (a !== null && b !== null) {
          if (a < 0 || b < 0) {
            return missing(['a', 'b']);
          }
          return Math.sqrt(a * a + b * b);
        }
        return missing(needs(state, ['a', 'b']));
      },
    },
  ],
  testCases: [
    { a: 3, b: 4, c: 5 },
    { a: 5, b: 12, c: 13 },
    { a: 1, b: 1, c: Math.sqrt(2) },
  ],
};
