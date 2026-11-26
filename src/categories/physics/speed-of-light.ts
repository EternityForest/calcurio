import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Wavelength and travel time from the speed of light in a chosen medium.
 * Picking a medium sets the speed from the wave-media table; the frequency
 * then gives the wavelength and a distance gives the time to cover it.
 */
export const speedOfLight: CalculatorDefinition = {
  id: 'speed-of-light',
  title: 'Speed of light',
  description:
    'Wavelength and travel time in a propagation medium. Choose a medium to ' +
    'bring in its speed, then enter a frequency for the wavelength and a ' +
    'distance for the time of flight.',
  variables: [
    {
      name: 'medium',
      label: 'Medium',
      table: 'wave-media',
      description: 'Propagation medium, which sets the speed of light in it.',
    },
    {
      name: 'speed',
      label: 'Speed of light',
      unit: 'm/s',
      editable: false,
      tableSelect: 'medium',
      tableField: 'speedOfLight',
      description: 'Phase velocity of the wave in the chosen medium.',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      unit: 'Hz',
      defaultDisplayUnit: 'MHz',
      description: 'Frequency of the wave.',
      validate: (state) => {
        const frequency = valueOf(state, 'frequency');
        return frequency !== null && frequency <= 0
          ? 'Frequency must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'wavelength',
      label: 'Wavelength',
      unit: 'm',
      editable: false,
      description: 'Wavelength in the medium, the speed divided by frequency.',
      computable: (state) => {
        const speed = valueOf(state, 'speed');
        const frequency = valueOf(state, 'frequency');
        if (speed === null || frequency === null) {
          return missing([
            ...(speed === null ? ['speed'] : []),
            ...(frequency === null ? ['frequency'] : []),
          ]);
        }
        if (frequency === 0) {
          return missing([]);
        }
        return speed / frequency;
      },
    },
    {
      name: 'distance',
      label: 'Distance',
      unit: 'm',
      description: 'Distance the wave travels through the medium.',
    },
    {
      name: 'travelTime',
      label: 'Travel time',
      unit: 's',
      editable: false,
      description: 'Time for the wave to cover the distance, distance/speed.',
      computable: (state) => {
        const speed = valueOf(state, 'speed');
        const distance = valueOf(state, 'distance');
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
      medium: 'vacuum',
      speed: 299792458,
      frequency: 1e6,
      wavelength: 299.792458,
      distance: 300,
      travelTime: 0.000001000692285594456,
    },
    {
      medium: 'cat5e',
      speed: 194865098,
      frequency: 1e8,
      wavelength: 1.94865098,
      distance: 100,
      travelTime: 5.131755302840327e-7,
    },
    {
      medium: 'rg316',
      speed: 206856796,
      frequency: 2.4e9,
      wavelength: 0.08619033166666666,
      distance: 0.1,
      travelTime: 4.834262249715982e-10,
    },
  ],
};
