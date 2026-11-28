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
 * Relate length, width, height, and volume of a rectangular box. Enter any three
 * values to Calculate the fourth.
 */
export const boxVolume: CalculatorDefinition = {
  id: 'box-volume',
  title: 'Box Volume',
  description:
    'Relate the dimensions and volume of a rectangular box. Enter any three ' +
    'values, then Calculate the fourth.',
  variables: [
    {
      name: 'length',
      label: 'Length',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Longest horizontal dimension.',
      validate: (state) => {
        const length = numberOrNull(state, 'length');
        return length !== null && length < 0
          ? 'Length cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const width = numberOrNull(state, 'width');
        const height = numberOrNull(state, 'height');
        if (volume !== null && width !== null && height !== null) {
          if (width === 0 || height === 0) {
            return missing(['width', 'height']);
          }
          return volume / (width * height);
        }
        return missing(needs(state, ['volume', 'width', 'height']));
      },
    },
    {
      name: 'width',
      label: 'Width',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Shorter horizontal dimension.',
      validate: (state) => {
        const width = numberOrNull(state, 'width');
        return width !== null && width < 0
          ? 'Width cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const length = numberOrNull(state, 'length');
        const height = numberOrNull(state, 'height');
        if (volume !== null && length !== null && height !== null) {
          if (length === 0 || height === 0) {
            return missing(['length', 'height']);
          }
          return volume / (length * height);
        }
        return missing(needs(state, ['volume', 'length', 'height']));
      },
    },
    {
      name: 'height',
      label: 'Height',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Vertical dimension.',
      validate: (state) => {
        const height = numberOrNull(state, 'height');
        return height !== null && height < 0
          ? 'Height cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const length = numberOrNull(state, 'length');
        const width = numberOrNull(state, 'width');
        if (volume !== null && length !== null && width !== null) {
          if (length === 0 || width === 0) {
            return missing(['length', 'width']);
          }
          return volume / (length * width);
        }
        return missing(needs(state, ['volume', 'length', 'width']));
      },
    },
    {
      name: 'volume',
      label: 'Volume',
      unit: 'm^3',
      defaultDisplayUnit: 'l',
      description: 'Enclosed volume.',
      computable: (state) => {
        const length = numberOrNull(state, 'length');
        const width = numberOrNull(state, 'width');
        const height = numberOrNull(state, 'height');
        if (length !== null && width !== null && height !== null) {
          return length * width * height;
        }
        return missing(needs(state, ['length', 'width', 'height']));
      },
    },
  ],
  testCases: [
    { length: 2, width: 3, height: 4, volume: 24 },
    { length: 1, width: 1, height: 1, volume: 1 },
    { length: 5, width: 2, height: 3, volume: 30 },
  ],
};
