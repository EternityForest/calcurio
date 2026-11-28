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
 * Relate energy, power (watts), and time. Enter any two values to Calculate
 * the third.
 */
export const energyWattsTime: CalculatorDefinition = {
  id: 'energy-watts-time',
  title: 'Energy / Watts / Time',
  description:
    'Relate energy, power, and time with E = P × t. Enter any two values, ' +
    'then Calculate the third.',
  variables: [
    {
      name: 'energy',
      label: 'Energy',
      unit: 'J',
      defaultDisplayUnit: 'Wh',
      description: 'Total energy consumed or produced.',
      validate: (state) => {
        const energy = numberOrNull(state, 'energy');
        return energy !== null && energy < 0
          ? 'Energy cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const watts = numberOrNull(state, 'watts');
        const time = numberOrNull(state, 'time');
        if (watts !== null && time !== null) {
          return watts * time;
        }
        return missing(needs(state, ['watts', 'time']));
      },
    },
    {
      name: 'watts',
      label: 'Power',
      unit: 'W',
      defaultDisplayUnit: 'mW',
      description: 'Rate of energy transfer.',
      validate: (state) => {
        const watts = numberOrNull(state, 'watts');
        return watts !== null && watts < 0
          ? 'Power cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const time = numberOrNull(state, 'time');
        if (energy !== null && time !== null) {
          if (time === 0) {
            return missing(['time']);
          }
          return energy / time;
        }
        return missing(needs(state, ['energy', 'time']));
      },
    },
    {
      name: 'time',
      label: 'Time',
      unit: 's',
      defaultDisplayUnit: 'min',
      description: 'Duration of operation.',
      validate: (state) => {
        const time = numberOrNull(state, 'time');
        return time !== null && time < 0
          ? 'Time cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const watts = numberOrNull(state, 'watts');
        if (energy !== null && watts !== null) {
          if (watts === 0) {
            return missing(['watts']);
          }
          return energy / watts;
        }
        return missing(needs(state, ['energy', 'watts']));
      },
    },
  ],
  testCases: [
    { energy: 3600, watts: 100, time: 36 }, // 100W for 36s = 3600J
    { energy: 1, watts: 1, time: 1 },
    { energy: 5, watts: 2, time: 2.5 },
  ],
};
