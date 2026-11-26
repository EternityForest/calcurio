import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

/** Speed of light in vacuum, in metres per second. */
const SPEED_OF_LIGHT = 299792458;

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Free-space path loss from the Friis transmission equation. The loss is
 * entirely a property of the frequency and the link distance, so those are
 * the only values the calculator works from: the transmit power and the two
 * antenna gains are there for the record and may be left as entered.
 */
export const friis: CalculatorDefinition = {
  id: 'friis',
  title: 'Friis path loss',
  description:
    'Free-space path loss between two antennas, 20 log10(4πdf/c). Enter the ' +
    'frequency and the link distance to get the loss; the transmit power and ' +
    'antenna gains are recorded but do not change it.',
  variables: [
    {
      name: 'frequency',
      label: 'Frequency',
      unit: 'Hz',
      defaultDisplayUnit: 'MHz',
      description: 'Carrier frequency of the link.',
      validate: (state) => {
        const frequency = valueOf(state, 'frequency');
        return frequency !== null && frequency <= 0
          ? 'Frequency must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'distance',
      label: 'Distance',
      unit: 'm',
      description: 'Distance between the two antennas.',
      validate: (state) => {
        const distance = valueOf(state, 'distance');
        return distance !== null && distance <= 0
          ? 'Distance must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'wavelength',
      label: 'Wavelength',
      unit: 'm',
      editable: false,
      description: 'Free-space wavelength at the carrier frequency.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        if (frequency === null) {
          return missing(['frequency']);
        }
        if (frequency <= 0) {
          return missing([]);
        }
        return SPEED_OF_LIGHT / frequency;
      },
    },
    {
      name: 'pathLoss',
      label: 'Path loss',
      unit: 'dB',
      editable: false,
      description: 'Free-space path loss at this frequency and distance.',
      computable: (state) => {
        const frequency = valueOf(state, 'frequency');
        const distance = valueOf(state, 'distance');
        if (frequency === null || distance === null) {
          return missing([
            ...(frequency === null ? ['frequency'] : []),
            ...(distance === null ? ['distance'] : []),
          ]);
        }
        if (frequency <= 0 || distance <= 0) {
          return missing([]);
        }
        return (
          20 * Math.log10((4 * Math.PI * distance * frequency) / SPEED_OF_LIGHT)
        );
      },
    },
    {
      name: 'transmitPower',
      label: 'Transmit power',
      unit: 'W',
      description:
        'Power fed to the transmit antenna. Recorded for reference; it does ' +
        'not affect the path loss.',
    },
    {
      name: 'transmitGain',
      label: 'Transmit gain',
      unit: 'dB',
      default: 0,
      description:
        'Gain of the transmit antenna over an isotropic radiator. Recorded ' +
        'for reference.',
    },
    {
      name: 'receiveGain',
      label: 'Receive gain',
      unit: 'dB',
      default: 0,
      description:
        'Gain of the receive antenna over an isotropic radiator. Recorded ' +
        'for reference.',
    },
  ],
  testCases: [
    {
      frequency: 2.4e9,
      distance: 100,
      transmitPower: 1,
      transmitGain: 0,
      receiveGain: 0,
      wavelength: 0.12491352416666666,
      pathLoss: 80.0520080561155,
    },
    {
      frequency: 915e6,
      distance: 1000,
      transmitPower: 0.1,
      transmitGain: 2,
      receiveGain: 2,
      wavelength: 0.32764203060109287,
      pathLoss: 91.67620510321234,
    },
    {
      frequency: 5.8e9,
      distance: 5,
      transmitPower: 0.001,
      transmitGain: 6,
      receiveGain: 3,
      wavelength: 0.05168835482758621,
      pathLoss: 61.6957431798625,
    },
  ],
};
