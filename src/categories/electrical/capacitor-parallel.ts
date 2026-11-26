import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Combined capacitance of two capacitors in parallel.
 * C_total = C1 + C2
 */
export const capacitorParallel: CalculatorDefinition = {
  id: 'capacitor-parallel',
  title: 'Capacitors in parallel',
  description:
    'Combined capacitance of two capacitors connected in parallel. ' +
    'The equivalent capacitance is the sum of both values.',
  variables: [
    {
      name: 'c1',
      label: 'C1',
      unit: 'F',
      description: 'Capacitance of the first capacitor.',
    },
    {
      name: 'c2',
      label: 'C2',
      unit: 'F',
      description: 'Capacitance of the second capacitor.',
    },
    {
      name: 'ctotal',
      label: 'C total',
      unit: 'F',
      description: 'Equivalent parallel capacitance (C1 + C2).',
      computable: (state) => {
        const c1 = valueOf(state, 'c1');
        const c2 = valueOf(state, 'c2');
        if (c1 === null || c2 === null) {
          return missing([
            ...(c1 === null ? ['c1'] : []),
            ...(c2 === null ? ['c2'] : []),
          ]);
        }
        return c1 + c2;
      },
    },
  ],
  testCases: [
    { c1: 0.001, c2: 0.001, ctotal: 0.002 },
    { c1: 0.000001, c2: 0.000002, ctotal: 0.000003 },
    { c1: 1e-6, c2: 10e-6, ctotal: 11e-6 },
  ],
};