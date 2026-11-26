import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Tension at each anchor of a cable that sags under its own weight and an
 * optional load hung at midspan. The horizontal tension takes the parabolic
 * cable approximation (small sag), and the vertical reaction carries half the
 * total weight, so the anchor force is their vector sum.
 */
export const catenary: CalculatorDefinition = {
  id: 'catenary',
  title: 'Catenary (chain curve)',
  description:
    'Force at each anchor of a cable that sags between two points under its ' +
    'own weight plus a load hung at the centre. Uses the small-sag cable ' +
    'approximation H = P·W/(4·D) + Q·W/(8·D).',
  variables: [
    {
      name: 'width',
      label: 'Horizontal width',
      unit: 'm',
      description: 'Horizontal distance between the two anchors.',
      validate: (state) => {
        const width = valueOf(state, 'width');
        return width !== null && width <= 0
          ? 'Width must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'droop',
      label: 'Droop',
      unit: 'm',
      description: 'Vertical sag of the cable at the centre.',
      validate: (state) => {
        const droop = valueOf(state, 'droop');
        return droop !== null && droop <= 0
          ? 'Droop must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'centerWeight',
      label: 'Weight at centre',
      unit: 'N',
      default: 0,
      description: 'Load hung at the midpoint of the span.',
    },
    {
      name: 'ropeWeight',
      label: 'Weight of chain/rope',
      unit: 'N',
      description: 'Total weight of the chain or rope hanging between anchors.',
    },
    {
      name: 'forcePerAnchor',
      label: 'Force per anchor',
      unit: 'N',
      editable: false,
      description: 'Tension the cable pulls on each anchor with.',
      computable: (state) => {
        const width = valueOf(state, 'width');
        const droop = valueOf(state, 'droop');
        const centerWeight = valueOf(state, 'centerWeight');
        const ropeWeight = valueOf(state, 'ropeWeight');
        if (
          width === null ||
          droop === null ||
          centerWeight === null ||
          ropeWeight === null
        ) {
          return missing([
            ...(width === null ? ['width'] : []),
            ...(droop === null ? ['droop'] : []),
            ...(centerWeight === null ? ['centerWeight'] : []),
            ...(ropeWeight === null ? ['ropeWeight'] : []),
          ]);
        }
        if (width <= 0 || droop <= 0) {
          return missing([]);
        }
        const horizontal =
          (centerWeight * width) / (4 * droop) +
          (ropeWeight * width) / (8 * droop);
        const vertical = (centerWeight + ropeWeight) / 2;
        return Math.hypot(horizontal, vertical);
      },
    },
  ],
  testCases: [
    {
      width: 10,
      droop: 1,
      centerWeight: 100,
      ropeWeight: 50,
      forcePerAnchor: 321.37400330456103,
    },
    {
      width: 20,
      droop: 2,
      centerWeight: 0,
      ropeWeight: 100,
      forcePerAnchor: 134.62912017836263,
    },
    {
      width: 30,
      droop: 3,
      centerWeight: 500,
      ropeWeight: 200,
      forcePerAnchor: 1540.2921800749364,
    },
  ],
};
