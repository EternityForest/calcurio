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
 * Relate cylinder radius, height, volume, and surface area. Enter any two values
 * to Calculate the others.
 */
export const cylinderProperties: CalculatorDefinition = {
  id: 'cylinder-properties',
  title: 'Cylinder Properties',
  description:
    'Relate a cylinder\'s radius, height, volume, and total surface area. ' +
    'Enter any two values, then Calculate the rest.',
  variables: [
    {
      name: 'radius',
      label: 'Radius',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Distance from centre axis to edge.',
      validate: (state) => {
        const radius = numberOrNull(state, 'radius');
        return radius !== null && radius < 0
          ? 'Radius cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        const height = numberOrNull(state, 'height');

        // Try volume first if height is known
        if (volume !== null && height !== null) {
          if (height === 0) {
            return missing(['height']);
          }
          return Math.sqrt(volume / Math.PI / height);
        }
        // Try surface area if height is known
        if (surfaceArea !== null && height !== null && height > 0) {
          // SA = 2πr(h + r) → 2πr² + 2πhr - SA = 0 → quadratic in r
          const a = 2 * Math.PI;
          const b = 2 * Math.PI * height;
          const c = -surfaceArea;
          const disc = b * b - 4 * a * c;
          if (disc < 0) {
            return missing(['surfaceArea']);
          }
          return (-b + Math.sqrt(disc)) / (2 * a);
        }
        return missing(needs(state, ['volume', 'surfaceArea']));
      },
    },
    {
      name: 'height',
      label: 'Height',
      unit: 'm',
      defaultDisplayUnit: 'mm',
      description: 'Length along the axis.',
      validate: (state) => {
        const height = numberOrNull(state, 'height');
        return height !== null && height < 0
          ? 'Height cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const volume = numberOrNull(state, 'volume');
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        const radius = numberOrNull(state, 'radius');

        if (volume !== null && radius !== null) {
          if (radius <= 0) {
            return missing(['radius']);
          }
          return volume / (Math.PI * radius * radius);
        }
        if (surfaceArea !== null && radius !== null && radius > 0) {
          // SA = 2πr(h + r) → h = SA/(2πr) - r
          return surfaceArea / (2 * Math.PI * radius) - radius;
        }
        return missing(needs(state, ['volume', 'surfaceArea']));
      },
    },
    {
      name: 'volume',
      label: 'Volume',
      unit: 'm^3',
      defaultDisplayUnit: 'l',
      description: 'Enclosed volume.',
      validate: (state) => {
        const volume = numberOrNull(state, 'volume');
        return volume !== null && volume < 0
          ? 'Volume cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        const height = numberOrNull(state, 'height');
        if (radius !== null && height !== null) {
          if (radius < 0 || height < 0) {
            return missing(['radius', 'height']);
          }
          return Math.PI * radius * radius * height;
        }
        return missing(needs(state, ['radius', 'height']));
      },
    },
    {
      name: 'surfaceArea',
      label: 'Surface Area',
      unit: 'm^2',
      defaultDisplayUnit: 'cm^2',
      description: 'Total surface area (including top and bottom).',
      validate: (state) => {
        const sa = numberOrNull(state, 'surfaceArea');
        return sa !== null && sa < 0
          ? 'Surface area cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        const height = numberOrNull(state, 'height');
        if (radius !== null && height !== null) {
          if (radius < 0 || height < 0) {
            return missing(['radius', 'height']);
          }
          return 2 * Math.PI * radius * (radius + height);
        }
        return missing(needs(state, ['radius', 'height']));
      },
    },
  ],
  testCases: [
    { radius: 1, height: 2, volume: 2 * Math.PI, surfaceArea: 6 * Math.PI },
    { radius: 5, height: 10, volume: 250 * Math.PI, surfaceArea: 150 * Math.PI },
  ],
};
