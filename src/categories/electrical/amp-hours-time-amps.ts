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
 * Relate battery capacity (amp-hours), discharge current (amps), and runtime.
 * Enter any two values to Calculate the third.
 */
export const ampHoursTimeAmps: CalculatorDefinition = {
  id: 'amp-hours-time-amps',
  title: 'Amp Hours / Time / Amps',
  description:
    'Relate battery capacity (Ah), discharge current (A), and runtime. ' +
    'Enter any two values, then Calculate the third.',
  variables: [
    {
      name: 'capacity',
      label: 'Capacity',
      unit: '1',
      defaultDisplayUnit: '1',
      description: 'Battery capacity in amp-hours (Ah).',
      validate: (state) => {
        const cap = numberOrNull(state, 'capacity');
        return cap !== null && cap < 0
          ? 'Capacity cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const amps = numberOrNull(state, 'amps');
        const time = numberOrNull(state, 'time');
        if (amps !== null && time !== null) {
          return amps * time;
        }
        return missing(needs(state, ['amps', 'time']));
      },
    },
    {
      name: 'amps',
      label: 'Current',
      unit: 'A',
      defaultDisplayUnit: 'mA',
      description: 'Discharge current draw.',
      validate: (state) => {
        const amps = numberOrNull(state, 'amps');
        return amps !== null && amps < 0
          ? 'Current cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const capacity = numberOrNull(state, 'capacity');
        const time = numberOrNull(state, 'time');
        if (capacity !== null && time !== null) {
          if (time === 0) {
            return missing(['time']);
          }
          return capacity / time;
        }
        return missing(needs(state, ['capacity', 'time']));
      },
    },
    {
      name: 'time',
      label: 'Runtime',
      unit: 'h',
      defaultDisplayUnit: 'min',
      description: 'Expected runtime at the given current.',
      validate: (state) => {
        const time = numberOrNull(state, 'time');
        return time !== null && time < 0
          ? 'Time cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const capacity = numberOrNull(state, 'capacity');
        const amps = numberOrNull(state, 'amps');
        if (capacity !== null && amps !== null) {
          if (amps === 0) {
            return missing(['amps']);
          }
          return capacity / amps;
        }
        return missing(needs(state, ['capacity', 'amps']));
      },
    },
  ],
  testCases: [
    { capacity: 5, amps: 0.5, time: 10 },
    { capacity: 10, amps: 2, time: 5 },
    { capacity: 2, amps: 0.1, time: 20 },
  ],
};
