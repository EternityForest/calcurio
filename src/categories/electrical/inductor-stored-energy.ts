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
 * Stored energy in an inductor at a given current and inductance.
 * E = ½ × L × I². Enter any two values to Calculate the third.
 */
export const inductorStoredEnergy: CalculatorDefinition = {
  id: 'inductor-stored-energy',
  title: 'Inductor Stored Energy',
  description:
    'Calculate the energy stored in an inductor using E = ½LI². ' +
    'Enter any two values, then Calculate the third.',
  variables: [
    {
      name: 'energy',
      label: 'Energy',
      unit: 'J',
      defaultDisplayUnit: 'mJ',
      description: 'Energy stored in the magnetic field.',
      validate: (state) => {
        const energy = numberOrNull(state, 'energy');
        return energy !== null && energy < 0
          ? 'Energy cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const inductance = numberOrNull(state, 'inductance');
        const current = numberOrNull(state, 'current');
        if (inductance !== null && current !== null) {
          return 0.5 * inductance * current * current;
        }
        return missing(needs(state, ['inductance', 'current']));
      },
    },
    {
      name: 'inductance',
      label: 'Inductance',
      unit: 'H',
      defaultDisplayUnit: 'uH',
      description: 'Inductance of the component.',
      validate: (state) => {
        const L = numberOrNull(state, 'inductance');
        return L !== null && L < 0
          ? 'Inductance cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const current = numberOrNull(state, 'current');
        if (energy !== null && current !== null) {
          if (current === 0) {
            return missing(['current']);
          }
          return (2 * energy) / (current * current);
        }
        return missing(needs(state, ['energy', 'current']));
      },
    },
    {
      name: 'current',
      label: 'Current',
      unit: 'A',
      defaultDisplayUnit: 'mA',
      description: 'Current flowing through the inductor.',
      validate: (state) => {
        const current = numberOrNull(state, 'current');
        return current !== null && current < 0
          ? 'Current cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const inductance = numberOrNull(state, 'inductance');
        if (energy !== null && inductance !== null) {
          if (inductance === 0) {
            return missing(['inductance']);
          }
          return Math.sqrt((2 * energy) / inductance);
        }
        return missing(needs(state, ['energy', 'inductance']));
      },
    },
  ],
  testCases: [
    { inductance: 1e-3, current: 2, energy: 0.002 }, // 1mH at 2A = 2mJ
    { inductance: 10e-3, current: 0.5, energy: 0.00125 }, // 10mH at 0.5A
    { inductance: 470e-6, current: 1, energy: 0.000235 }, // 470uH at 1A
  ],
};
