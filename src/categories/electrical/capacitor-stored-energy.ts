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
 * Stored energy in a capacitor at a given voltage and capacitance.
 * E = ½ × C × V². Enter any two values to Calculate the third.
 */
export const capacitorStoredEnergy: CalculatorDefinition = {
  id: 'capacitor-stored-energy',
  title: 'Capacitor Stored Energy',
  description:
    'Calculate the energy stored in a capacitor using E = ½CV². ' +
    'Enter any two values, then Calculate the third.',
  variables: [
    {
      name: 'energy',
      label: 'Energy',
      unit: 'J',
      defaultDisplayUnit: 'mJ',
      description: 'Energy stored in the electric field.',
      validate: (state) => {
        const energy = numberOrNull(state, 'energy');
        return energy !== null && energy < 0
          ? 'Energy cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const capacitance = numberOrNull(state, 'capacitance');
        const voltage = numberOrNull(state, 'voltage');
        if (capacitance !== null && voltage !== null) {
          return 0.5 * capacitance * voltage * voltage;
        }
        return missing(needs(state, ['capacitance', 'voltage']));
      },
    },
    {
      name: 'capacitance',
      label: 'Capacitance',
      unit: 'F',
      defaultDisplayUnit: 'uF',
      description: 'Capacitance of the component.',
      validate: (state) => {
        const cap = numberOrNull(state, 'capacitance');
        return cap !== null && cap < 0
          ? 'Capacitance cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const voltage = numberOrNull(state, 'voltage');
        if (energy !== null && voltage !== null) {
          if (voltage === 0) {
            return missing(['voltage']);
          }
          return (2 * energy) / (voltage * voltage);
        }
        return missing(needs(state, ['energy', 'voltage']));
      },
    },
    {
      name: 'voltage',
      label: 'Voltage',
      unit: 'V',
      defaultDisplayUnit: 'mV',
      description: 'Voltage across the capacitor plates.',
      validate: (state) => {
        const voltage = numberOrNull(state, 'voltage');
        return voltage !== null && voltage < 0
          ? 'Voltage cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const capacitance = numberOrNull(state, 'capacitance');
        if (energy !== null && capacitance !== null) {
          if (capacitance === 0) {
            return missing(['capacitance']);
          }
          return Math.sqrt((2 * energy) / capacitance);
        }
        return missing(needs(state, ['energy', 'capacitance']));
      },
    },
  ],
  testCases: [
    { capacitance: 1e-3, voltage: 10, energy: 0.05 }, // 1mF at 10V = 50mJ
    { capacitance: 100e-6, voltage: 5, energy: 0.00125 }, // 100uF at 5V
    { capacitance: 470e-6, voltage: 16, energy: 0.06016 }, // 470uF at 16V
  ],
};
