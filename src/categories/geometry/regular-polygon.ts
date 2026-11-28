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
 * Relate side length, number of sides, area, and perimeter of a regular polygon.
 * Enter any two values to Calculate the others.
 */
export const regularPolygon: CalculatorDefinition = {
  id: 'regular-polygon',
  title: 'Regular Polygon',
  description:
    'Relate the side length, number of sides, area, and perimeter of a ' +
    'regular polygon. Enter any two values, then Calculate the rest.',
  variables: [
    {
      name: 'nSides',
      label: 'Number of Sides',
      unit: 'count',
      defaultDisplayUnit: 'count',
      description: 'Integer count of equal sides.',
      validate: (state) => {
        const n = numberOrNull(state, 'nSides');
        if (n !== null && n < 3) {
          return 'A polygon must have at least 3 sides.';
        }
        return undefined;
      },
      computable: () => {
        // Cannot compute nSides from other numeric properties alone
        return missing(['nSides']);
      },
    },
    {
      name: 'side',
      label: 'Side Length',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Length of one side.',
      validate: (state) => {
        const side = numberOrNull(state, 'side');
        return side !== null && side < 0
          ? 'Side length cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const perimeter = numberOrNull(state, 'perimeter');
        const area = numberOrNull(state, 'area');
        const n = numberOrNull(state, 'nSides');

        if (perimeter !== null && n !== null) {
          if (n <= 0) {
            return missing(['nSides']);
          }
          return perimeter / n;
        }
        if (area !== null && n !== null && n > 2) {
          // area = n * s² / (4 * tan(π/n)) → s = sqrt(4 * A * tan(π/n) / n)
          return Math.sqrt((4 * area * Math.tan(Math.PI / n)) / n);
        }
        return missing(needs(state, ['perimeter', 'area']));
      },
    },
    {
      name: 'perimeter',
      label: 'Perimeter',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Total boundary length.',
      validate: (state) => {
        const perimeter = numberOrNull(state, 'perimeter');
        return perimeter !== null && perimeter < 0
          ? 'Perimeter cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const side = numberOrNull(state, 'side');
        const n = numberOrNull(state, 'nSides');
        if (side !== null && n !== null) {
          if (n < 0) {
            return missing(['nSides']);
          }
          return side * n;
        }
        return missing(needs(state, ['side', 'nSides']));
      },
    },
    {
      name: 'area',
      label: 'Area',
      unit: 'm^2',
      defaultDisplayUnit: 'cm^2',
      description: 'Enclosed area.',
      validate: (state) => {
        const area = numberOrNull(state, 'area');
        return area !== null && area < 0
          ? 'Area cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const side = numberOrNull(state, 'side');
        const n = numberOrNull(state, 'nSides');
        if (side !== null && n !== null && n > 2) {
          if (side < 0 || n < 0) {
            return missing(['side', 'nSides']);
          }
          return (n * side * side) / (4 * Math.tan(Math.PI / n));
        }
        return missing(needs(state, ['side', 'nSides']));
      },
    },
  ],
  testCases: [
    { nSides: 4, side: 10, perimeter: 40, area: 100 }, // square
    { nSides: 6, side: 5, perimeter: 30, area: (3 * Math.sqrt(3) / 2) * 25 }, // hexagon
    { nSides: 3, side: 10, perimeter: 30, area: (Math.sqrt(3) / 4) * 100 }, // triangle
  ],
};
