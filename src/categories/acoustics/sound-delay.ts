import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function numberOrNull(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Sound travel time from distance and speed of sound in a chosen medium.
 * Picking a medium sets up the speed lookup; entering a temperature (and
 * optionally pressure) interpolates the speed from the table.
 */
export const soundDelay: CalculatorDefinition = {
  id: 'sound-delay',
  title: 'Speed of Sound Delay',
  description:
    'Calculate sound travel time from distance and the speed of sound in ' +
    'a chosen medium. Pick a medium, enter temperature (and optionally ' +
    'pressure) to interpolate the speed from the table.',
  variables: [
    {
      name: 'medium',
      label: 'Medium',
      table: 'speed-of-sound',
      default: 'air',
      description: 'Propagation medium, which sets up the speed lookup.',
    },
    {
      name: 'temperature',
      label: 'Temperature',
      unit: 'degC',
      default: 20,
      description: 'Temperature for speed interpolation.',
    },
    {
      name: 'pressure',
      label: 'Pressure',
      unit: 'kPa',
      default: 101.325,
      description: 'Pressure for speed interpolation (optional).',
    },
    {
      name: 'speed',
      label: 'Speed of Sound',
      unit: 'm/s',
      editable: false,
      tableSelect: 'medium',
      tableField: 'speed',
      tableAxis: ['temperature', 'pressure'],
      description: 'Phase velocity of sound in the chosen medium.',
    },
    {
      name: 'distance',
      label: 'Distance',
      unit: 'm',
      defaultDisplayUnit: 'cm',
      description: 'Distance the sound travels through the medium.',
    },
    {
      name: 'delay',
      label: 'Delay',
      unit: 's',
      editable: false,
      defaultDisplayUnit: 'ms',
      description: 'Time for sound to cover the distance, distance/speed.',
      computable: (state) => {
        const speed = numberOrNull(state, 'speed');
        const distance = numberOrNull(state, 'distance');
        if (speed === null || distance === null) {
          return missing([
            ...(speed === null ? ['speed'] : []),
            ...(distance === null ? ['distance'] : []),
          ]);
        }
        if (speed === 0) {
          return missing([]);
        }
        return distance / speed;
      },
    },
  ],
  testCases: [
    {
      medium: 'air',
      temperature: 20,
      pressure: 101.325,
      speed: 343,
      distance: 100,
      delay: 100 / 343,
    },
    {
      medium: 'water',
      temperature: 20,
      pressure: 101.325,
      speed: 1481,
      distance: 100,
      delay: 100 / 1481,
    },
    {
      medium: 'air',
      temperature: 0,
      pressure: 101.325,
      speed: 331.3,
      distance: 331.3,
      delay: 1,
    },
  ],
};
