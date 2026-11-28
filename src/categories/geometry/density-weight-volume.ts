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
 * Relate density, mass, and volume with ρ = m/V. Enter any two values to
 * Calculate the third.
 */
export const densityWeightVolume: CalculatorDefinition = {
  id: 'density-weight-volume',
  title: 'Density / Weight / Volume',
  description:
    'Relate density, mass, and volume with ρ = m/V. Enter any two values, ' +
    'then Calculate the third.',
  variables: [
    {
      name: 'density',
      label: 'Density',
      unit: 'kg/m^3',
      defaultDisplayUnit: 'kg/m^3',
      description: 'Mass per unit volume.',
      validate: (state) => {
        const density = numberOrNull(state, 'density');
        return density !== null && density < 0
          ? 'Density cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const mass = numberOrNull(state, 'mass');
        const volume = numberOrNull(state, 'volume');
        if (mass !== null && volume !== null) {
          if (volume === 0) {
            return missing(['volume']);
          }
          return mass / volume;
        }
        return missing(needs(state, ['mass', 'volume']));
      },
    },
    {
      name: 'mass',
      label: 'Mass',
      unit: 'kg',
      defaultDisplayUnit: 'g',
      description: 'Total mass of the material.',
      validate: (state) => {
        const mass = numberOrNull(state, 'mass');
        return mass !== null && mass < 0
          ? 'Mass cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const density = numberOrNull(state, 'density');
        const volume = numberOrNull(state, 'volume');
        if (density !== null && volume !== null) {
          return density * volume;
        }
        return missing(needs(state, ['density', 'volume']));
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
        const mass = numberOrNull(state, 'mass');
        const density = numberOrNull(state, 'density');
        if (mass !== null && density !== null) {
          if (density === 0) {
            return missing(['density']);
          }
          return mass / density;
        }
        return missing(needs(state, ['mass', 'density']));
      },
    },
  ],
  testCases: [
    { density: 1000, mass: 5, volume: 0.005 }, // water
    { density: 7850, mass: 1, volume: 1 / 7850 }, // steel
    { density: 1.225, mass: 1.225, volume: 1 }, // air at STP
  ],
};
