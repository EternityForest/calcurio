import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Volume and weight of a fluid. Choosing a fluid sets its density from the
 * fluids table; entering either a volume or a weight then gives the other.
 */
export const volumeAndWeight: CalculatorDefinition = {
  id: 'volume-and-weight',
  title: 'Volume and weight',
  description:
    'Pick a fluid to bring in its density, then enter a volume or a weight ' +
    'and read the other.',
  variables: [
    {
      name: 'fluid',
      label: 'Fluid',
      table: 'fluids',
      description: 'Working fluid, which sets its density.',
    },
    {
      name: 'density',
      label: 'Density',
      unit: 'kg/m3',
      editable: false,
      tableSelect: 'fluid',
      tableField: 'density',
      description: 'Density of the chosen fluid at 20 °C.',
    },
    {
      name: 'volume',
      label: 'Volume',
      unit: 'm3',
      defaultDisplayUnit: 'l',
      description: 'Volume of the fluid.',
      computable: (state) => {
        const weight = valueOf(state, 'weight');
        const density = valueOf(state, 'density');
        if (weight === null || density === null) {
          return missing([
            ...(weight === null ? ['weight'] : []),
            ...(density === null ? ['density'] : []),
          ]);
        }
        if (density === 0) {
          return missing([]);
        }
        return weight / density;
      },
      validate: (state) =>
        valueOf(state, 'density') === 0
          ? 'Density must be non-zero to calculate volume.'
          : undefined,
    },
    {
      name: 'weight',
      label: 'Weight',
      unit: 'kg',
      description: 'Weight of the fluid.',
      computable: (state) => {
        const volume = valueOf(state, 'volume');
        const density = valueOf(state, 'density');
        if (volume === null || density === null) {
          return missing([
            ...(volume === null ? ['volume'] : []),
            ...(density === null ? ['density'] : []),
          ]);
        }
        return volume * density;
      },
    },
  ],
  testCases: [
    { fluid: 'water', density: 998.2, volume: 0.001, weight: 0.9982 },
    {
      fluid: 'propylene-glycol-50',
      density: 1039.1,
      volume: 0.02,
      weight: 20.782,
    },
    {
      fluid: 'mineral-oil',
      density: 880,
      volume: 0.2,
      weight: 176,
    },
  ],
};
