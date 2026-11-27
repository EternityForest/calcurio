import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import { findMaterial, sensibleHeatBetween } from '../../models/materials.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function materialId(state: Readonly<CalcState>): string | null {
  const value = state['material'];
  return typeof value === 'string' ? value : null;
}

/**
 * Sensible heat needed to move a mass of a material between two temperatures.
 * The specific heat is sampled against temperature, so the calculator
 * integrates it piecewise rather than assuming a single constant value.
 */
export const energyAndTemperatureChange: CalculatorDefinition = {
  id: 'energy-and-temperature-change',
  title: 'Energy and temperature change',
  description:
    'Pick a material, enter its mass and two temperatures, and read the heat ' +
    'needed. The specific heat is integrated across the temperature range, so ' +
    'materials whose specific heat changes with temperature are handled.',
  variables: [
    {
      name: 'material',
      label: 'Material',
      table: 'materials',
      filter: 'specificHeat',
      description: 'Material whose specific heat is used.',
    },
    {
      name: 'mass',
      label: 'Mass',
      unit: 'kg',
      description: 'Mass of material being heated or cooled.',
      validate: (state) => {
        const mass = valueOf(state, 'mass');
        return mass !== null && mass <= 0
          ? 'Mass must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'startTemperature',
      label: 'Start temperature',
      unit: 'degC',
      description: 'Temperature before the change.',
    },
    {
      name: 'endTemperature',
      label: 'End temperature',
      unit: 'degC',
      description: 'Temperature after the change.',
    },
    {
      name: 'energy',
      label: 'Heat',
      unit: 'J',
      defaultDisplayUnit: 'kJ',
      editable: false,
      description: 'Sensible heat added to the material.',
      computable: (state) => {
        const id = materialId(state);
        const material = id === null ? undefined : findMaterial(id);
        const mass = valueOf(state, 'mass');
        const start = valueOf(state, 'startTemperature');
        const end = valueOf(state, 'endTemperature');
        if (material === undefined) {
          return missing(['material']);
        }
        if (mass === null || start === null || end === null) {
          return missing([
            ...(mass === null ? ['mass'] : []),
            ...(start === null ? ['startTemperature'] : []),
            ...(end === null ? ['endTemperature'] : []),
          ]);
        }
        const specific = sensibleHeatBetween(material, start, end);
        if (specific === null) {
          return missing(['material']);
        }
        return mass * specific;
      },
    },
    {
      name: 'averageSpecificHeat',
      label: 'Average specific heat',
      unit: 'J/(kg K)',
      editable: false,
      description:
        'Effective specific heat over the range, equal to the heat divided by ' +
        'the mass and temperature change.',
      computable: (state) => {
        const energy = valueOf(state, 'energy');
        const mass = valueOf(state, 'mass');
        const start = valueOf(state, 'startTemperature');
        const end = valueOf(state, 'endTemperature');
        if (
          energy === null ||
          mass === null ||
          start === null ||
          end === null
        ) {
          return missing([
            ...(energy === null ? ['energy'] : []),
            ...(mass === null ? ['mass'] : []),
            ...(start === null ? ['startTemperature'] : []),
            ...(end === null ? ['endTemperature'] : []),
          ]);
        }
        const change = end - start;
        if (mass === 0 || change === 0) {
          return missing([]);
        }
        return energy / (mass * change);
      },
    },
  ],
  testCases: [
    {
      material: 'water',
      mass: 1,
      startTemperature: 20,
      endTemperature: 80,
      energy: 250920,
      averageSpecificHeat: 4182,
    },
    {
      material: 'water',
      mass: 1,
      startTemperature: -10,
      endTemperature: 10,
      energy: 62820,
      averageSpecificHeat: 3141,
    },
    {
      material: 'aluminum',
      mass: 2,
      startTemperature: 20,
      endTemperature: 120,
      energy: 180000,
      averageSpecificHeat: 900,
    },
  ],
};
