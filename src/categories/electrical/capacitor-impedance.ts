import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Impedance of an ideal capacitor at a frequency. Enter any two of frequency,
 * capacitance, and impedance, then Calculate the third.
 */
export const capacitorImpedance: CalculatorDefinition = {
  id: 'capacitor-impedance',
  title: 'Capacitor impedance',
  description:
    'Reactance of an ideal capacitor, Z = 1/(2πfC). Enter any two values, ' +
    'then press Calculate on the third.',
  variables: [
    {
      name: 'frequency',
      label: 'Frequency',
      unit: 'Hz',
      description: 'Signal frequency.',
      computable: (state) => {
        const capacitance = valueOf(state, 'capacitance');
        const impedance = valueOf(state, 'impedance');
        if (capacitance === null || impedance === null) {
          return missing([
            ...(capacitance === null ? ['capacitance'] : []),
            ...(impedance === null ? ['impedance'] : []),
          ]);
        }
        if (capacitance === 0 || impedance === 0) {
          return missing([]);
        }
        return 1 / (2 * Math.PI * capacitance * impedance);
      },
      validate: (state) =>
        valueOf(state, 'capacitance') === 0
          ? 'Capacitance must be non-zero to calculate frequency.'
          : undefined,
    },
    {
      name: 'capacitance',
      label: 'Capacitance',
      unit: 'F',
      defaultDisplayUnit: 'uF',
      description: 'Capacitance of the component.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        const impedance = valueOf(state, 'impedance');
        if (frequency === null || impedance === null) {
          return missing([
            ...(frequency === null ? ['frequency'] : []),
            ...(impedance === null ? ['impedance'] : []),
          ]);
        }
        if (frequency === 0 || impedance === 0) {
          return missing([]);
        }
        return 1 / (2 * Math.PI * frequency * impedance);
      },
      validate: (state) =>
        valueOf(state, 'frequency') === 0
          ? 'Frequency must be non-zero to calculate capacitance.'
          : undefined,
    },
    {
      name: 'impedance',
      label: 'Impedance',
      unit: 'ohm',
      description: 'Reactance at the frequency.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        const capacitance = valueOf(state, 'capacitance');
        if (frequency === null || capacitance === null) {
          return missing([
            ...(frequency === null ? ['frequency'] : []),
            ...(capacitance === null ? ['capacitance'] : []),
          ]);
        }
        if (frequency === 0 || capacitance === 0) {
          return missing([]);
        }
        return 1 / (2 * Math.PI * frequency * capacitance);
      },
      validate: (state) =>
        valueOf(state, 'frequency') === 0
          ? 'Frequency must be non-zero to calculate impedance.'
          : valueOf(state, 'capacitance') === 0
            ? 'Capacitance must be non-zero to calculate impedance.'
            : undefined,
    },
  ],
  testCases: [
    { frequency: 1000, capacitance: 1e-6, impedance: 159.15494309189535 },
    { frequency: 60, capacitance: 1e-6, impedance: 2652.5823848649225 },
    { frequency: 2.4e9, capacitance: 1e-12, impedance: 66.31455962162306 },
  ],
};
