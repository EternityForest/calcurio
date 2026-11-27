import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function numberOrNull(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function needs(state: Readonly<CalcState>, names: readonly string[]): string[] {
  return names.filter((name) => numberOrNull(state, name) === null);
}

const FOUR_PI = 4 * Math.PI;

function radiusFromVolume(volume: number): number {
  return Math.cbrt((3 * volume) / FOUR_PI);
}

function volumeFromRadius(radius: number): number {
  return (4 / 3) * Math.PI * radius * radius * radius;
}

/**
 * Sphere geometry. Enter a radius, diameter, surface area, cross-sectional
 * area, or volume and Calculate the others.
 */
export const sphere: CalculatorDefinition = {
  id: 'sphere',
  title: 'Sphere',
  description:
    'Relate the radius, diameter, surface area, cross-sectional area, and ' +
    'volume of a sphere. Enter any one value, then Calculate the rest.',
  variables: [
    {
      name: 'radius',
      label: 'Radius',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Distance from the centre to the surface.',
      validate: (state) => {
        const radius = numberOrNull(state, 'radius');
        return radius !== null && radius < 0
          ? 'Radius cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        if (surfaceArea !== null) {
          if (surfaceArea < 0) {
            return missing(['surfaceArea']);
          }
          return Math.sqrt(surfaceArea / FOUR_PI);
        }
        const crossSectionArea = numberOrNull(state, 'crossSectionArea');
        if (crossSectionArea !== null) {
          if (crossSectionArea < 0) {
            return missing(['crossSectionArea']);
          }
          return Math.sqrt(crossSectionArea / Math.PI);
        }
        const volume = numberOrNull(state, 'volume');
        if (volume !== null) {
          if (volume < 0) {
            return missing(['volume']);
          }
          return radiusFromVolume(volume);
        }
        return missing(
          needs(state, [
            'diameter',
            'surfaceArea',
            'crossSectionArea',
            'volume',
          ]),
        );
      },
    },
    {
      name: 'diameter',
      label: 'Diameter',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Distance across the sphere through its centre.',
      validate: (state) => {
        const diameter = numberOrNull(state, 'diameter');
        return diameter !== null && diameter < 0
          ? 'Diameter cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        if (surfaceArea !== null) {
          if (surfaceArea < 0) {
            return missing(['surfaceArea']);
          }
          return Math.sqrt(surfaceArea / Math.PI);
        }
        const crossSectionArea = numberOrNull(state, 'crossSectionArea');
        if (crossSectionArea !== null) {
          if (crossSectionArea < 0) {
            return missing(['crossSectionArea']);
          }
          return 2 * Math.sqrt(crossSectionArea / Math.PI);
        }
        const volume = numberOrNull(state, 'volume');
        if (volume !== null) {
          if (volume < 0) {
            return missing(['volume']);
          }
          return 2 * radiusFromVolume(volume);
        }
        return missing(
          needs(state, ['radius', 'surfaceArea', 'crossSectionArea', 'volume']),
        );
      },
    },
    {
      name: 'surfaceArea',
      label: 'Surface area',
      unit: 'm^2',
      defaultDisplayUnit: 'm^2',
      description: 'Total area of the sphere’s surface.',
      validate: (state) => {
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        return surfaceArea !== null && surfaceArea < 0
          ? 'Surface area cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        if (radius !== null) {
          if (radius < 0) {
            return missing(['radius']);
          }
          return FOUR_PI * radius * radius;
        }
        const diameter = numberOrNull(state, 'diameter');
        if (diameter !== null) {
          if (diameter < 0) {
            return missing(['diameter']);
          }
          return Math.PI * diameter * diameter;
        }
        const crossSectionArea = numberOrNull(state, 'crossSectionArea');
        if (crossSectionArea !== null) {
          if (crossSectionArea < 0) {
            return missing(['crossSectionArea']);
          }
          return 4 * crossSectionArea;
        }
        const volume = numberOrNull(state, 'volume');
        if (volume !== null) {
          if (volume < 0) {
            return missing(['volume']);
          }
          const radiusFromVolumeValue = radiusFromVolume(volume);
          return FOUR_PI * radiusFromVolumeValue * radiusFromVolumeValue;
        }
        return missing(
          needs(state, ['radius', 'diameter', 'crossSectionArea', 'volume']),
        );
      },
    },
    {
      name: 'crossSectionArea',
      label: 'Cross-sectional area',
      unit: 'm^2',
      defaultDisplayUnit: 'm^2',
      description: 'Area of a great circle through the centre.',
      validate: (state) => {
        const area = numberOrNull(state, 'crossSectionArea');
        return area !== null && area < 0
          ? 'Cross-sectional area cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        if (radius !== null) {
          if (radius < 0) {
            return missing(['radius']);
          }
          return Math.PI * radius * radius;
        }
        const diameter = numberOrNull(state, 'diameter');
        if (diameter !== null) {
          if (diameter < 0) {
            return missing(['diameter']);
          }
          return (Math.PI * diameter * diameter) / 4;
        }
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        if (surfaceArea !== null) {
          if (surfaceArea < 0) {
            return missing(['surfaceArea']);
          }
          return surfaceArea / 4;
        }
        const volume = numberOrNull(state, 'volume');
        if (volume !== null) {
          if (volume < 0) {
            return missing(['volume']);
          }
          const radiusFromVolumeValue = radiusFromVolume(volume);
          return Math.PI * radiusFromVolumeValue * radiusFromVolumeValue;
        }
        return missing(
          needs(state, ['radius', 'diameter', 'surfaceArea', 'volume']),
        );
      },
    },
    {
      name: 'volume',
      label: 'Volume',
      unit: 'm^3',
      defaultDisplayUnit: 'm^3',
      description: 'Space enclosed by the sphere.',
      validate: (state) => {
        const volume = numberOrNull(state, 'volume');
        return volume !== null && volume < 0
          ? 'Volume cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        if (radius !== null) {
          if (radius < 0) {
            return missing(['radius']);
          }
          return volumeFromRadius(radius);
        }
        const diameter = numberOrNull(state, 'diameter');
        if (diameter !== null) {
          if (diameter < 0) {
            return missing(['diameter']);
          }
          return volumeFromRadius(diameter / 2);
        }
        const surfaceArea = numberOrNull(state, 'surfaceArea');
        if (surfaceArea !== null) {
          if (surfaceArea < 0) {
            return missing(['surfaceArea']);
          }
          return volumeFromRadius(Math.sqrt(surfaceArea / FOUR_PI));
        }
        const crossSectionArea = numberOrNull(state, 'crossSectionArea');
        if (crossSectionArea !== null) {
          if (crossSectionArea < 0) {
            return missing(['crossSectionArea']);
          }
          return volumeFromRadius(Math.sqrt(crossSectionArea / Math.PI));
        }
        return missing(
          needs(state, [
            'radius',
            'diameter',
            'surfaceArea',
            'crossSectionArea',
          ]),
        );
      },
    },
  ],
  testCases: [
    {
      radius: 2,
      diameter: 4,
      surfaceArea: FOUR_PI * 4,
      crossSectionArea: Math.PI * 4,
      volume: (4 / 3) * Math.PI * 8,
    },
  ],
};
