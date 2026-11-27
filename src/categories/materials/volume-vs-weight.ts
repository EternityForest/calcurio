import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Volume and weight of a material. Choosing a material sets its density from
 * the shared materials table; entering either a volume or a weight then gives
 * the other.
 */
export const volumeVsWeight: CalculatorDefinition = {
  id: 'volume-vs-weight',
  title: 'Volume vs weight',
  description:
    'Pick a material to bring in its density, then enter a volume or a weight ' +
    'and read the other.',
  variables: [
    {
      name: 'material',
      label: 'Material',
      table: 'materials',
      filter: 'density',
      description: 'Material whose density is used.',
    },
    {
      name: 'density',
      label: 'Density',
      unit: 'kg/m^3',
      editable: false,
      tableSelect: 'material',
      tableField: 'density',
      description: 'Density of the chosen material at 20 °C.',
    },
    {
      name: 'volume',
      label: 'Volume',
      unit: 'm^3',
      defaultDisplayUnit: 'l',
      description: 'Volume of the material.',
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
      description: 'Weight of the material.',
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
    { material: 'water', density: 998.2, volume: 0.001, weight: 0.9982 },
    {
      material: 'propylene-glycol-50',
      density: 1039.1,
      volume: 0.02,
      weight: 20.782,
    },
    {
      material: 'aluminum',
      density: 2700,
      volume: 0.001,
      weight: 2.7,
    },
  ],
};
