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
 * Relate side length and area of a square. Enter either value to Calculate the other.
 */
export const squareArea: CalculatorDefinition = {
  id: 'square-area',
  title: 'Square Area',
  description:
    'Relate the side length and area of a square. Enter one value, then ' +
    'Calculate the other.',
  variables: [
    {
      name: 'side',
      label: 'Side',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Length of one side.',
      validate: (state) => {
        const side = numberOrNull(state, 'side');
        return side !== null && side < 0
          ? 'Side cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const area = numberOrNull(state, 'area');
        if (area !== null) {
          if (area < 0) {
            return missing(['area']);
          }
          return Math.sqrt(area);
        }
        return missing(needs(state, ['area']));
      },
    },
    {
      name: 'area',
      label: 'Area',
      unit: 'm^2',
      defaultDisplayUnit: 'm^2',
      description: 'Enclosed area.',
      validate: (state) => {
        const area = numberOrNull(state, 'area');
        return area !== null && area < 0
          ? 'Area cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const side = numberOrNull(state, 'side');
        if (side !== null) {
          if (side < 0) {
            return missing(['side']);
          }
          return side * side;
        }
        return missing(needs(state, ['side']));
      },
    },
  ],
  testCases: [
    { side: 5, area: 25 },
    { side: 10, area: 100 },
  ],
};
