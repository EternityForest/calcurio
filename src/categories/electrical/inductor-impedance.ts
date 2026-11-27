import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Impedance of an ideal inductor at a frequency. Enter any two of frequency,
 * inductance, and impedance, then Calculate the third.
 */
export const inductorImpedance: CalculatorDefinition = {
  id: 'inductor-impedance',
  title: 'Inductor impedance',
  description:
    'Reactance of an ideal inductor, Z = 2πfL. Enter any two values, then ' +
    'press Calculate on the third.',
  variables: [
    {
      name: 'frequency',
      label: 'Frequency',
      unit: 'Hz',
      description: 'Signal frequency.',
      computable: (state) => {
        const inductance = valueOf(state, 'inductance');
        const impedance = valueOf(state, 'impedance');
        if (inductance === null || impedance === null) {
          return missing([
            ...(inductance === null ? ['inductance'] : []),
            ...(impedance === null ? ['impedance'] : []),
          ]);
        }
        if (inductance === 0) {
          return missing([]);
        }
        return impedance / (2 * Math.PI * inductance);
      },
      validate: (state) =>
        valueOf(state, 'inductance') === 0
          ? 'Inductance must be non-zero to calculate frequency.'
          : undefined,
    },
    {
      name: 'inductance',
      label: 'Inductance',
      unit: 'H',
      description: 'Inductance of the component.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        const impedance = valueOf(state, 'impedance');
        if (frequency === null || impedance === null) {
          return missing([
            ...(frequency === null ? ['frequency'] : []),
            ...(impedance === null ? ['impedance'] : []),
          ]);
        }
        if (frequency === 0) {
          return missing([]);
        }
        return impedance / (2 * Math.PI * frequency);
      },
      validate: (state) =>
        valueOf(state, 'frequency') === 0
          ? 'Frequency must be non-zero to calculate inductance.'
          : undefined,
    },
    {
      name: 'impedance',
      label: 'Impedance',
      unit: 'ohm',
      description: 'Reactance at the frequency.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        const inductance = valueOf(state, 'inductance');
        if (frequency === null || inductance === null) {
          return missing([
            ...(frequency === null ? ['frequency'] : []),
            ...(inductance === null ? ['inductance'] : []),
          ]);
        }
        return 2 * Math.PI * frequency * inductance;
      },
    },
  ],
  testCases: [
    { frequency: 1000, inductance: 0.001, impedance: 6.283185307179586 },
    { frequency: 50, inductance: 0.1, impedance: 31.415926535897935 },
    { frequency: 2.4e9, inductance: 2e-9, impedance: 30.159289474462014 },
  ],
};
