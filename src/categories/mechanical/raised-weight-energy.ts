import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Gravitational acceleration at the Earth's surface, in metres per second
 * squared. */
const STANDARD_GRAVITY = 9.80665;

/**
 * Potential energy gained by raising a mass. The height is the vertical rise;
 * the energy is m·g·h, the work needed to lift the mass against gravity.
 */
export const raisedWeightEnergy: CalculatorDefinition = {
  id: 'raised-weight-energy',
  title: 'Energy stored in a raised weight',
  description:
    'Gravitational potential energy of a mass raised by a height, m·g·h. ' +
    'Gravity defaults to standard gravity but can be changed.',
  variables: [
    {
      name: 'mass',
      label: 'Mass',
      unit: 'kg',
      description: 'Mass being raised.',
      validate: (state) => {
        const mass = valueOf(state, 'mass');
        return mass !== null && mass < 0
          ? 'Mass must not be negative.'
          : undefined;
      },
    },
    {
      name: 'height',
      label: 'Height',
      unit: 'm',
      description: 'Vertical distance the mass is raised.',
    },
    {
      name: 'gravity',
      label: 'Gravity',
      unit: 'm/s2',
      default: STANDARD_GRAVITY,
      description: 'Acceleration due to gravity.',
      validate: (state) => {
        const gravity = valueOf(state, 'gravity');
        return gravity !== null && gravity <= 0
          ? 'Gravity must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'energy',
      label: 'Energy',
      unit: 'J',
      editable: false,
      description: 'Energy stored in the raised mass.',
      computable: (state) => {
        const mass = valueOf(state, 'mass');
        const height = valueOf(state, 'height');
        const gravity = valueOf(state, 'gravity');
        if (mass === null || height === null || gravity === null) {
          return missing([
            ...(mass === null ? ['mass'] : []),
            ...(height === null ? ['height'] : []),
            ...(gravity === null ? ['gravity'] : []),
          ]);
        }
        return mass * gravity * height;
      },
    },
  ],
  testCases: [
    { mass: 100, height: 10, gravity: 9.80665, energy: 9806.65 },
    { mass: 1, height: 1, gravity: 9.80665, energy: 9.80665 },
    { mass: 5, height: 2.5, gravity: 9.81, energy: 122.625 },
  ],
};
