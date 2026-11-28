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
 * Relate speed, distance, and time with d = s × t (or s = d/t, t = d/s).
 * Enter any two values, then Calculate the third.
 */
export const speedDistanceTime: CalculatorDefinition = {
  id: 'speed-distance-time',
  title: 'Speed / Distance / Time',
  description:
    'Relate speed, distance, and time. Enter any two values, then Calculate ' +
    'the third.',
  variables: [
    {
      name: 'speed',
      label: 'Speed',
      unit: 'm/s',
      defaultDisplayUnit: 'km/h',
      description: 'Rate of travel.',
      validate: (state) => {
        const speed = numberOrNull(state, 'speed');
        return speed !== null && speed < 0
          ? 'Speed cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const distance = numberOrNull(state, 'distance');
        const time = numberOrNull(state, 'time');
        if (distance !== null && time !== null) {
          if (time === 0) {
            return missing(['time']);
          }
          return distance / time;
        }
        return missing(needs(state, ['distance', 'time']));
      },
    },
    {
      name: 'distance',
      label: 'Distance',
      unit: 'm',
      defaultDisplayUnit: 'km',
      description: 'Total distance travelled.',
      validate: (state) => {
        const distance = numberOrNull(state, 'distance');
        return distance !== null && distance < 0
          ? 'Distance cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const speed = numberOrNull(state, 'speed');
        const time = numberOrNull(state, 'time');
        if (speed !== null && time !== null) {
          return speed * time;
        }
        return missing(needs(state, ['speed', 'time']));
      },
    },
    {
      name: 'time',
      label: 'Time',
      unit: 's',
      defaultDisplayUnit: 'min',
      description: 'Duration of travel.',
      validate: (state) => {
        const time = numberOrNull(state, 'time');
        return time !== null && time < 0
          ? 'Time cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const distance = numberOrNull(state, 'distance');
        const speed = numberOrNull(state, 'speed');
        if (distance !== null && speed !== null) {
          if (speed === 0) {
            return missing(['speed']);
          }
          return distance / speed;
        }
        return missing(needs(state, ['distance', 'speed']));
      },
    },
  ],
  testCases: [
    { speed: 1000 / 3600, distance: 100, time: 36 }, // 100 km/h for 100 m → 3.6 s
    { speed: 10, distance: 100, time: 10 },
    { speed: 5, distance: 20, time: 4 },
  ],
};
