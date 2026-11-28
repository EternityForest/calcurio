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
 * Relate kinetic energy, mass, and speed using KE = ½mv². Enter any two
 * values to Calculate the third.
 */
export const kineticEnergy: CalculatorDefinition = {
  id: 'kinetic-energy',
  title: 'Kinetic Energy',
  description:
    'Relate kinetic energy, mass, and speed using KE = ½mv². Enter any two ' +
    'values, then Calculate the third.',
  variables: [
    {
      name: 'energy',
      label: 'Kinetic Energy',
      unit: 'J',
      defaultDisplayUnit: 'kJ',
      description: 'Energy of motion.',
      validate: (state) => {
        const energy = numberOrNull(state, 'energy');
        return energy !== null && energy < 0
          ? 'Energy cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const mass = numberOrNull(state, 'mass');
        const speed = numberOrNull(state, 'speed');
        if (mass !== null && speed !== null) {
          return 0.5 * mass * speed * speed;
        }
        return missing(needs(state, ['mass', 'speed']));
      },
    },
    {
      name: 'mass',
      label: 'Mass',
      unit: 'kg',
      defaultDisplayUnit: 'g',
      description: 'Mass of the object.',
      validate: (state) => {
        const mass = numberOrNull(state, 'mass');
        return mass !== null && mass < 0
          ? 'Mass cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const speed = numberOrNull(state, 'speed');
        if (energy !== null && speed !== null) {
          if (speed === 0) {
            return missing(['speed']);
          }
          return (2 * energy) / (speed * speed);
        }
        return missing(needs(state, ['energy', 'speed']));
      },
    },
    {
      name: 'speed',
      label: 'Speed',
      unit: 'm/s',
      defaultDisplayUnit: 'km/h',
      description: 'Speed of the object.',
      validate: (state) => {
        const speed = numberOrNull(state, 'speed');
        return speed !== null && speed < 0
          ? 'Speed cannot be negative.'
          : undefined;
      },
      computable: (state) => {
        const energy = numberOrNull(state, 'energy');
        const mass = numberOrNull(state, 'mass');
        if (energy !== null && mass !== null) {
          if (mass === 0) {
            return missing(['mass']);
          }
          return Math.sqrt((2 * energy) / mass);
        }
        return missing(needs(state, ['energy', 'mass']));
      },
    },
  ],
  testCases: [
    { mass: 10, speed: 5, energy: 125 }, // 10kg at 5m/s = 125J
    { mass: 1, speed: 10, energy: 50 }, // 1kg at 10m/s = 50J
    { mass: 80, speed: 3, energy: 360 }, // 80kg at 3m/s = 360J
  ],
};
