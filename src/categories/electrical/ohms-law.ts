import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' ? value : null;
}

export const ohmsLaw: CalculatorDefinition = {
  id: 'ohms-law',
  title: "Ohm's Law",
  description:
    'Relates voltage, current, and resistance. Enter any two values, then ' +
    'press Calculate on the third.',
  variables: [
    {
      name: 'voltage',
      label: 'Voltage',
      unit: 'V',
      description: 'Electrical potential difference.',
      computable: (state) => {
        const current = valueOf(state, 'current');
        const resistance = valueOf(state, 'resistance');
        if (current === null || resistance === null) {
          return missing([
            ...(current === null ? ['current'] : []),
            ...(resistance === null ? ['resistance'] : []),
          ]);
        }
        return current * resistance;
      },
    },
    {
      name: 'current',
      label: 'Current',
      unit: 'A',
      description: 'Rate of charge flow.',
      computable: (state) => {
        const voltage = valueOf(state, 'voltage');
        const resistance = valueOf(state, 'resistance');
        if (voltage === null || resistance === null) {
          return missing([
            ...(voltage === null ? ['voltage'] : []),
            ...(resistance === null ? ['resistance'] : []),
          ]);
        }
        if (resistance === 0) {
          return missing([]);
        }
        return voltage / resistance;
      },
      validate: (state) =>
        valueOf(state, 'resistance') === 0
          ? 'Resistance must be non-zero to calculate current.'
          : undefined,
    },
    {
      name: 'resistance',
      label: 'Resistance',
      unit: 'ohm',
      description: 'Opposition to current flow.',
      computable: (state) => {
        const voltage = valueOf(state, 'voltage');
        const current = valueOf(state, 'current');
        if (voltage === null || current === null) {
          return missing([
            ...(voltage === null ? ['voltage'] : []),
            ...(current === null ? ['current'] : []),
          ]);
        }
        if (current === 0) {
          return missing([]);
        }
        return voltage / current;
      },
      validate: (state) =>
        valueOf(state, 'current') === 0
          ? 'Current must be non-zero to calculate resistance.'
          : undefined,
    },
  ],
  testCases: [
    { voltage: 12, current: 0.12, resistance: 100 },
    { voltage: 5, current: 0.01, resistance: 500 },
    { voltage: -12, current: -0.12, resistance: 100 },
    { voltage: 3.3, current: 0.02, resistance: 165 },
    { voltage: 3.3, current: 0.001, resistance: 3300 },
  ],
};
