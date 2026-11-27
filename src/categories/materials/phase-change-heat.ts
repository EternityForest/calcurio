import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import {
  findMaterial,
  latentHeatBetween,
  sensibleHeatBetween,
} from '../../models/materials.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function materialId(state: Readonly<CalcState>): string | null {
  const value = state['material'];
  return typeof value === 'string' ? value : null;
}

/**
 * Heat needed to move a mass of a material between two temperatures, including
 * the latent heat when the range crosses a melting or boiling point. The
 * sensible part integrates the sampled specific heat; the latent part adds the
 * heat of fusion or vaporization for each transition that is crossed.
 */
export const phaseChangeHeat: CalculatorDefinition = {
  id: 'phase-change-heat',
  title: 'Phase change heat',
  description:
    'Pick a material, enter its mass and two temperatures, and read the total ' +
    'heat. A transition adds the latent heat of fusion or vaporization when ' +
    'the range crosses the melting or boiling point.',
  variables: [
    {
      name: 'material',
      label: 'Material',
      table: 'materials',
      filter: 'heatOfFusion',
      description: 'Material whose latent heat is used.',
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
      name: 'sensibleHeat',
      label: 'Sensible heat',
      unit: 'J',
      defaultDisplayUnit: 'kJ',
      editable: false,
      description: 'Heat that changes the temperature without a phase change.',
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
      name: 'latentHeat',
      label: 'Latent heat',
      unit: 'J',
      defaultDisplayUnit: 'kJ',
      editable: false,
      description:
        'Heat absorbed or released by any phase transitions crossed.',
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
        const latent = latentHeatBetween(material, start, end);
        if (latent === null) {
          return missing(['material']);
        }
        return mass * latent;
      },
    },
    {
      name: 'totalHeat',
      label: 'Total heat',
      unit: 'J',
      defaultDisplayUnit: 'kJ',
      editable: false,
      description: 'Sensible and latent heat together.',
      computable: (state) => {
        const sensible = valueOf(state, 'sensibleHeat');
        const latent = valueOf(state, 'latentHeat');
        if (sensible === null || latent === null) {
          return missing([
            ...(sensible === null ? ['sensibleHeat'] : []),
            ...(latent === null ? ['latentHeat'] : []),
          ]);
        }
        return sensible + latent;
      },
    },
  ],
  testCases: [
    {
      material: 'water',
      mass: 1,
      startTemperature: -10,
      endTemperature: 10,
      sensibleHeat: 62820,
      latentHeat: 334000,
      totalHeat: 396820,
    },
    {
      material: 'water',
      mass: 1,
      startTemperature: 20,
      endTemperature: 120,
      sensibleHeat: 374560,
      latentHeat: 2256000,
      totalHeat: 2630560,
    },
    {
      material: 'aluminum',
      mass: 1,
      startTemperature: 20,
      endTemperature: 700,
      sensibleHeat: 612000,
      latentHeat: 397000,
      totalHeat: 1009000,
    },
  ],
};
