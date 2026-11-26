import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function numberOrNull(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export const randomNumber: CalculatorDefinition = {
  id: 'random-number',
  title: 'Random number',
  description:
    'Generate a random number between a minimum and maximum, in steps. ' +
    'Press Calculate to generate a new value.',
  variables: [
    {
      name: 'min',
      label: 'Minimum',
      unit: '1',
      unitOptions: ['1'],
      default: 0,
      description: 'Lowest value the result can take.',
      validate: (state) => {
        const min = numberOrNull(state, 'min');
        const max = numberOrNull(state, 'max');
        if (min !== null && max !== null && min > max) {
          return 'Minimum must not exceed maximum.';
        }
        return undefined;
      },
    },
    {
      name: 'max',
      label: 'Maximum',
      unit: '1',
      unitOptions: ['1'],
      default: 100,
      description: 'Highest value the result can take.',
      validate: (state) => {
        const min = numberOrNull(state, 'min');
        const max = numberOrNull(state, 'max');
        if (min !== null && max !== null && min > max) {
          return 'Maximum must not be below minimum.';
        }
        return undefined;
      },
    },
    {
      name: 'step',
      label: 'Step',
      unit: '1',
      unitOptions: ['1'],
      default: 1,
      description:
        'Interval between possible results. Must be greater than zero.',
      validate: (state) => {
        const step = numberOrNull(state, 'step');
        if (step !== null && step <= 0) {
          return 'Step must be greater than zero.';
        }
        return undefined;
      },
    },
    {
      name: 'result',
      label: 'Result',
      unit: '1',
      unitOptions: ['1'],
      editable: false,
      autoUpdate: false,
      description: 'Press Calculate to generate a new random number.',
      computable: (state) => {
        const min = numberOrNull(state, 'min');
        const max = numberOrNull(state, 'max');
        const step = numberOrNull(state, 'step');
        if (min === null || max === null || step === null) {
          return missing([
            ...(min === null ? ['min'] : []),
            ...(max === null ? ['max'] : []),
            ...(step === null ? ['step'] : []),
          ]);
        }
        if (step <= 0) {
          return missing(['step']);
        }
        if (min > max) {
          return missing(['min', 'max']);
        }
        const steps = Math.floor((max - min) / step + 1e-9);
        const index = Math.floor(Math.random() * (steps + 1));
        return min + index * step;
      },
    },
  ],
};
