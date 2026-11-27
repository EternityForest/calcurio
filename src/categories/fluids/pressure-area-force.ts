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
 * Pressure acting on an area produces a force. Enter any two of pressure,
 * area, and force, then Calculate the third.
 */
export const pressureAreaForce: CalculatorDefinition = {
  id: 'pressure-area-force',
  title: 'Pressure, area, and force',
  description:
    'Relate pressure, area, and force with F = P × A. Enter any two values, ' +
    'then Calculate the third.',
  variables: [
    {
      name: 'pressure',
      label: 'Pressure',
      unit: 'Pa',
      defaultDisplayUnit: 'kPa',
      description: 'Force per unit area.',
      computable: (state) => {
        const force = numberOrNull(state, 'force');
        const area = numberOrNull(state, 'area');
        if (force !== null && area !== null) {
          if (area === 0) {
            return missing(['area']);
          }
          return force / area;
        }
        return missing(needs(state, ['force', 'area']));
      },
    },
    {
      name: 'area',
      label: 'Area',
      unit: 'm^2',
      defaultDisplayUnit: 'cm^2',
      description: 'Area over which the pressure acts.',
      validate: (state) => {
        const area = numberOrNull(state, 'area');
        return area !== null && area <= 0
          ? 'Area must be greater than zero.'
          : undefined;
      },
      computable: (state) => {
        const force = numberOrNull(state, 'force');
        const pressure = numberOrNull(state, 'pressure');
        if (force !== null && pressure !== null) {
          if (pressure === 0) {
            return missing(['pressure']);
          }
          return force / pressure;
        }
        return missing(needs(state, ['force', 'pressure']));
      },
    },
    {
      name: 'force',
      label: 'Force',
      unit: 'N',
      defaultDisplayUnit: 'N',
      description: 'Total force acting on the area.',
      computable: (state) => {
        const pressure = numberOrNull(state, 'pressure');
        const area = numberOrNull(state, 'area');
        if (pressure !== null && area !== null) {
          return pressure * area;
        }
        return missing(needs(state, ['pressure', 'area']));
      },
    },
  ],
  testCases: [
    {
      pressure: 100000,
      area: 0.01,
      force: 1000,
    },
  ],
};
