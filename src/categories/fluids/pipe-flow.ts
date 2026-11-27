import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Cross-sectional area in square metres for a diameter in millimetres. */
function areaFor(diameter: number): number {
  return (Math.PI * (diameter / 1000) ** 2) / 4;
}

/**
 * Flow in a full pipe from Q = A·v. Enter any two of the pipe diameter, the
 * mean velocity, and the flow rate, then Calculate the third.
 */
export const pipeFlow: CalculatorDefinition = {
  id: 'pipe-flow',
  title: 'Pipe flow',
  description:
    'Flow, velocity, and pipe diameter related by Q = A·v for a full pipe. ' +
    'Enter any two values, then press Calculate on the third.',
  variables: [
    {
      name: 'diameter',
      label: 'Pipe diameter',
      unit: 'mm',
      description: 'Internal diameter of the pipe.',
      computable: (state) => {
        const flowRate = valueOf(state, 'flowRate');
        const velocity = valueOf(state, 'velocity');
        if (flowRate === null || velocity === null) {
          return missing([
            ...(flowRate === null ? ['flowRate'] : []),
            ...(velocity === null ? ['velocity'] : []),
          ]);
        }
        if (velocity <= 0) {
          return missing([]);
        }
        return Math.sqrt((4 * flowRate) / (Math.PI * velocity)) * 1000;
      },
      validate: (state) => {
        const diameter = valueOf(state, 'diameter');
        return diameter !== null && diameter <= 0
          ? 'Pipe diameter must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'velocity',
      label: 'Velocity',
      unit: 'm/s',
      description: 'Mean flow velocity.',
      computable: (state) => {
        const flowRate = valueOf(state, 'flowRate');
        const diameter = valueOf(state, 'diameter');
        if (flowRate === null || diameter === null) {
          return missing([
            ...(flowRate === null ? ['flowRate'] : []),
            ...(diameter === null ? ['diameter'] : []),
          ]);
        }
        if (diameter <= 0) {
          return missing([]);
        }
        return flowRate / areaFor(diameter);
      },
    },
    {
      name: 'flowRate',
      label: 'Flow rate',
      unit: 'm^3/s',
      defaultDisplayUnit: 'l/min',
      description: 'Volumetric flow through the pipe.',
      computable: (state) => {
        const diameter = valueOf(state, 'diameter');
        const velocity = valueOf(state, 'velocity');
        if (diameter === null || velocity === null) {
          return missing([
            ...(diameter === null ? ['diameter'] : []),
            ...(velocity === null ? ['velocity'] : []),
          ]);
        }
        if (diameter <= 0) {
          return missing([]);
        }
        return areaFor(diameter) * velocity;
      },
    },
  ],
  testCases: [
    {
      diameter: 50,
      velocity: 2,
      flowRate: 0.003926990816987242,
    },
    {
      diameter: 25,
      velocity: 1.5,
      flowRate: 0.0007363107781851078,
    },
    {
      diameter: 100,
      velocity: 0.5,
      flowRate: 0.003926990816987242,
    },
  ],
};
