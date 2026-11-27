import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Combined resistance of two resistors in parallel.
 * R_total = (R1 * R2) / (R1 + R2)
 */
export const resistorParallel: CalculatorDefinition = {
  id: 'resistor-parallel',
  title: 'Resistors in parallel',
  description:
    'Combined resistance of two resistors connected in parallel. ' +
    'The equivalent resistance is always less than either individual resistor.',
  variables: [
    {
      name: 'r1',
      label: 'R1',
      unit: 'ohm',
      description: 'Resistance of the first resistor.',
    },
    {
      name: 'r2',
      label: 'R2',
      unit: 'ohm',
      description: 'Resistance of the second resistor.',
    },
    {
      name: 'rtotal',
      label: 'R total',
      unit: 'ohm',
      description: 'Equivalent parallel resistance.',
      computable: (state) => {
        const r1 = valueOf(state, 'r1');
        const r2 = valueOf(state, 'r2');
        if (r1 === null || r2 === null) {
          return missing([
            ...(r1 === null ? ['r1'] : []),
            ...(r2 === null ? ['r2'] : []),
          ]);
        }
        if (r1 === 0 || r2 === 0) {
          return 0;
        }
        return (r1 * r2) / (r1 + r2);
      },
    },
  ],
  testCases: [
    { r1: 1000, r2: 1000, rtotal: 500 },
    { r1: 1000, r2: 2000, rtotal: 666.6666666666666 },
    { r1: 100, r2: 200, rtotal: 66.66666666666667 },
    { r1: 1000, r2: 1000000, rtotal: 998.0079681274901 },
  ],
};