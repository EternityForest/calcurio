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
 * Relate data size, bitrate, and transfer time with T = D/B. Enter any two
 * values to calculate the third.
 */
export const dataTransferTime: CalculatorDefinition = {
  id: 'data-transfer-time',
  title: 'Data Transfer Time',
  description:
    'Relate data size, bitrate, and transfer time. Enter any two values, ' +
    'then calculate the third.',
  variables: [
    {
      name: 'dataSize',
      label: 'Data Size',
      unit: 'bit',
      defaultDisplayUnit: 'GB',
      description: 'Amount of data to transfer.',
      validate: (state) => {
        const ds = numberOrNull(state, 'dataSize');
        return ds !== null && ds < 0
          ? 'Data size cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const bitrate = numberOrNull(state, 'bitrate');
        const time = numberOrNull(state, 'time');
        if (bitrate !== null && time !== null) {
          return bitrate * time;
        }
        return missing(needs(state, ['bitrate', 'time']));
      },
    },
    {
      name: 'bitrate',
      label: 'Bitrate',
      unit: 'bps',
      defaultDisplayUnit: 'Gbps',
      description: 'Data transfer rate.',
      validate: (state) => {
        const br = numberOrNull(state, 'bitrate');
        return br !== null && br < 0
          ? 'Bitrate cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const dataSize = numberOrNull(state, 'dataSize');
        const time = numberOrNull(state, 'time');
        if (dataSize !== null && time !== null) {
          if (time === 0) {
            return missing(['time']);
          }
          return dataSize / time;
        }
        return missing(needs(state, ['dataSize', 'time']));
      },
    },
    {
      name: 'time',
      label: 'Transfer Time',
      unit: 's',
      defaultDisplayUnit: 's',
      description: 'Time required for the transfer.',
      validate: (state) => {
        const time = numberOrNull(state, 'time');
        return time !== null && time < 0
          ? 'Time cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const dataSize = numberOrNull(state, 'dataSize');
        const bitrate = numberOrNull(state, 'bitrate');
        if (dataSize !== null && bitrate !== null) {
          if (bitrate === 0) {
            return missing(['bitrate']);
          }
          return dataSize / bitrate;
        }
        return missing(needs(state, ['dataSize', 'bitrate']));
      },
    },
  ],
  testCases: [
    { dataSize: 1e9, bitrate: 1e8, time: 10 }, // 1Gbit at 100Mbps = 10s
    { dataSize: 100e6, bitrate: 10e6, time: 10 }, // 100Mbit at 10Mbps
    { dataSize: 500e9, bitrate: 1e10, time: 50 }, // 500Gbit at 10Gbps
  ],
};
