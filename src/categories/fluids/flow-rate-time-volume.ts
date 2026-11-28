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
 * Relate flow rate, time, and total volume with V = Q × t. Enter any two
 * values to Calculate the third.
 */
export const flowRateTimeVolume: CalculatorDefinition = {
  id: 'flow-rate-time-volume',
  title: 'Flow Rate / Time / Volume',
  description:
    'Relate volumetric flow rate, time, and total volume. Enter any two ' +
    'values, then Calculate the third.',
  variables: [
    {
      name: 'flowRate',
      label: 'Flow Rate',
      unit: 'm^3/s',
      defaultDisplayUnit: 'l/min',
      description: 'Volumetric flow rate.',
      validate: (state) => {
        const fr = numberOrNull(state, 'flowRate');
        return fr !== null && fr < 0
          ? 'Flow rate cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const time = numberOrNull(state, 'time');
        if (volume !== null && time !== null) {
          if (time === 0) {
            return missing(['time']);
          }
          return volume / time;
        }
        return missing(needs(state, ['volume', 'time']));
      },
    },
    {
      name: 'volume',
      label: 'Total Volume',
      unit: 'm^3',
      defaultDisplayUnit: 'l',
      description: 'Total volume flowed.',
      validate: (state) => {
        const volume = numberOrNull(state, 'volume');
        return volume !== null && volume < 0
          ? 'Volume cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const flowRate = numberOrNull(state, 'flowRate');
        const time = numberOrNull(state, 'time');
        if (flowRate !== null && time !== null) {
          return flowRate * time;
        }
        return missing(needs(state, ['flowRate', 'time']));
      },
    },
    {
      name: 'time',
      label: 'Time',
      unit: 's',
      defaultDisplayUnit: 'min',
      description: 'Duration of flow.',
      validate: (state) => {
        const time = numberOrNull(state, 'time');
        return time !== null && time < 0
          ? 'Time cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const flowRate = numberOrNull(state, 'flowRate');
        if (volume !== null && flowRate !== null) {
          if (flowRate === 0) {
            return missing(['flowRate']);
          }
          return volume / flowRate;
        }
        return missing(needs(state, ['volume', 'flowRate']));
      },
    },
  ],
  testCases: [
    { flowRate: 1, volume: 60, time: 60 }, // 1 l/s for 60s = 60l
    { flowRate: 0.5, volume: 10, time: 20 },
    { flowRate: 2, volume: 100, time: 50 },
  ],
};
