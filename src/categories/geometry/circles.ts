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
 * Circle geometry. Enter a radius, diameter, area, or circumference and
 * Calculate the others.
 */
export const circles: CalculatorDefinition = {
  id: 'circles',
  title: 'Circles',
  description:
    'Relate the radius, diameter, area, and circumference of a circle. ' +
    'Enter any one value, then Calculate the rest.',
  variables: [
    {
      name: 'radius',
      label: 'Radius',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Distance from the centre to the edge.',
      validate: (state) => {
        const radius = numberOrNull(state, 'radius');
        return radius !== null && radius < 0
          ? 'Radius cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const area = numberOrNull(state, 'area');
        if (area !== null) {
          if (area < 0) {
            return missing(['area']);
          }
          return Math.sqrt(area / Math.PI);
        }
        const circumference = numberOrNull(state, 'circumference');
        if (circumference !== null) {
          if (circumference < 0) {
            return missing(['circumference']);
          }
          return circumference / (2 * Math.PI);
        }
        return missing(needs(state, ['diameter', 'area', 'circumference']));
      },
    },
    {
      name: 'diameter',
      label: 'Diameter',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Distance across the circle through its centre.',
      validate: (state) => {
        const diameter = numberOrNull(state, 'diameter');
        return diameter !== null && diameter < 0
          ? 'Diameter cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const area = numberOrNull(state, 'area');
        if (area !== null) {
          if (area < 0) {
            return missing(['area']);
          }
          return 2 * Math.sqrt(area / Math.PI);
        }
        const circumference = numberOrNull(state, 'circumference');
        if (circumference !== null) {
          if (circumference < 0) {
            return missing(['circumference']);
          }
          return circumference / Math.PI;
        }
        return missing(needs(state, ['radius', 'area', 'circumference']));
      },
    },
    {
      name: 'area',
      label: 'Area',
      unit: 'm2',
      defaultDisplayUnit: 'm2',
      description: 'Enclosed area.',
      validate: (state) => {
        const area = numberOrNull(state, 'area');
        return area !== null && area < 0
          ? 'Area cannot be negative.'
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
        const circumference = numberOrNull(state, 'circumference');
        if (circumference !== null) {
          if (circumference < 0) {
            return missing(['circumference']);
          }
          return (circumference * circumference) / (4 * Math.PI);
        }
        return missing(needs(state, ['radius', 'diameter', 'circumference']));
      },
    },
    {
      name: 'circumference',
      label: 'Circumference',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Distance around the circle.',
      validate: (state) => {
        const circumference = numberOrNull(state, 'circumference');
        return circumference !== null && circumference < 0
          ? 'Circumference cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const radius = numberOrNull(state, 'radius');
        if (radius !== null) {
          if (radius < 0) {
            return missing(['radius']);
          }
          return 2 * Math.PI * radius;
        }
        const diameter = numberOrNull(state, 'diameter');
        if (diameter !== null) {
          if (diameter < 0) {
            return missing(['diameter']);
          }
          return Math.PI * diameter;
        }
        const area = numberOrNull(state, 'area');
        if (area !== null) {
          if (area < 0) {
            return missing(['area']);
          }
          return 2 * Math.PI * Math.sqrt(area / Math.PI);
        }
        return missing(needs(state, ['radius', 'diameter', 'area']));
      },
    },
  ],
  testCases: [
    {
      radius: 2,
      diameter: 4,
      area: Math.PI * 4,
      circumference: 4 * Math.PI,
    },
  ],
};
