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
 * Slope, angle, and the sides of a right triangle. Enter any two of rise,
 * run, and angle, then Calculate the others.
 */
export const riseRunAngle: CalculatorDefinition = {
  id: 'rise-run-angle',
  title: 'Rise / run and angle',
  description:
    'Relate the vertical rise, horizontal run, slope, angle, and hypotenuse ' +
    'of a right triangle. Enter any two of rise, run, and angle, then ' +
    'Calculate the rest.',
  variables: [
    {
      name: 'rise',
      label: 'Rise',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Vertical change. Negative when the line falls.',
      computable: (state) => {
        const run = numberOrNull(state, 'run');
        const angle = numberOrNull(state, 'angle');
        if (run !== null && angle !== null) {
          return run * Math.tan(angle);
        }
        const slope = numberOrNull(state, 'slope');
        if (run !== null && slope !== null) {
          return run * slope;
        }
        const hypotenuse = numberOrNull(state, 'hypotenuse');
        if (run !== null && hypotenuse !== null) {
          const square = hypotenuse * hypotenuse - run * run;
          if (square < 0) {
            return missing(['hypotenuse']);
          }
          return Math.sqrt(square);
        }
        return missing(needs(state, ['run', 'angle']));
      },
    },
    {
      name: 'run',
      label: 'Run',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Horizontal change. Zero gives a vertical line.',
      computable: (state) => {
        const rise = numberOrNull(state, 'rise');
        const angle = numberOrNull(state, 'angle');
        if (rise !== null && angle !== null) {
          const tangent = Math.tan(angle);
          if (tangent === 0) {
            return missing(['angle']);
          }
          return rise / tangent;
        }
        const slope = numberOrNull(state, 'slope');
        if (rise !== null && slope !== null) {
          if (slope === 0) {
            return missing(['slope']);
          }
          return rise / slope;
        }
        const hypotenuse = numberOrNull(state, 'hypotenuse');
        if (rise !== null && hypotenuse !== null) {
          const square = hypotenuse * hypotenuse - rise * rise;
          if (square < 0) {
            return missing(['hypotenuse']);
          }
          return Math.sqrt(square);
        }
        return missing(needs(state, ['rise', 'angle']));
      },
    },
    {
      name: 'angle',
      label: 'Angle',
      unit: 'rad',
      defaultDisplayUnit: 'deg',
      description: 'Angle above the horizontal. Positive when the line rises.',
      computable: (state) => {
        const rise = numberOrNull(state, 'rise');
        const run = numberOrNull(state, 'run');
        if (rise !== null && run !== null) {
          return Math.atan2(rise, run);
        }
        const slope = numberOrNull(state, 'slope');
        if (slope !== null) {
          return Math.atan(slope);
        }
        return missing(needs(state, ['rise', 'run']));
      },
    },
    {
      name: 'slope',
      label: 'Slope',
      unit: '1',
      defaultDisplayUnit: '1',
      description: 'Rise divided by run.',
      computable: (state) => {
        const rise = numberOrNull(state, 'rise');
        const run = numberOrNull(state, 'run');
        if (rise !== null && run !== null) {
          if (run === 0) {
            return missing(['run']);
          }
          return rise / run;
        }
        const angle = numberOrNull(state, 'angle');
        if (angle !== null) {
          return Math.tan(angle);
        }
        return missing(needs(state, ['rise', 'run']));
      },
    },
    {
      name: 'hypotenuse',
      label: 'Hypotenuse',
      unit: 'm',
      defaultDisplayUnit: 'm',
      description: 'Length of the sloping side.',
      computable: (state) => {
        const rise = numberOrNull(state, 'rise');
        const run = numberOrNull(state, 'run');
        if (rise !== null && run !== null) {
          return Math.hypot(rise, run);
        }
        const angle = numberOrNull(state, 'angle');
        if (rise !== null && angle !== null) {
          const sine = Math.sin(angle);
          if (sine === 0) {
            return missing(['angle']);
          }
          return rise / sine;
        }
        if (run !== null && angle !== null) {
          const cosine = Math.cos(angle);
          if (cosine === 0) {
            return missing(['angle']);
          }
          return run / cosine;
        }
        return missing(needs(state, ['rise', 'run']));
      },
    },
  ],
  testCases: [
    {
      rise: 3,
      run: 4,
      angle: Math.atan2(3, 4),
      slope: 0.75,
      hypotenuse: 5,
    },
  ],
};
