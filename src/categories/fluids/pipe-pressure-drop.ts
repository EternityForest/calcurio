import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Cross-sectional area in square metres for an internal diameter in mm. */
function areaFor(diameter: number): number {
  return (Math.PI * (diameter / 1000) ** 2) / 4;
}

/**
 * Friction factor for flow in a pipe. Laminar flow uses the exact
 * f = 64/Re; turbulent flow solves the implicit Colebrook-White equation
 * 1/√f = −2·log10(ε/(3.7·D) + 2.51/(Re·√f)) from the explicit Swamee-Jain
 * approximation, refined by iterating that fixed point to convergence.
 * `relativeRoughness` is the absolute roughness over the internal diameter.
 */
function frictionFactor(reynolds: number, relativeRoughness: number): number {
  if (reynolds < 2300) {
    return 64 / reynolds;
  }
  let factor =
    0.25 / Math.log10(relativeRoughness / 3.7 + 5.74 / reynolds ** 0.9) ** 2;
  for (let round = 0; round < 100; round += 1) {
    const inverseRoot =
      -2 *
      Math.log10(
        relativeRoughness / 3.7 + 2.51 / (reynolds * Math.sqrt(factor)),
      );
    const next = 1 / (inverseRoot * inverseRoot);
    const settled = Math.abs(next - factor) <= 1e-15 * factor;
    factor = next;
    if (settled) {
      break;
    }
  }
  return factor;
}

/**
 * Pressure drop along a straight length of pipe from the fluid's properties
 * and a volumetric flow. Choosing a fluid brings in its density and viscosity
 * at 20 °C; the Darcy-Weisbach equation then gives the head loss,
 * Δp = f·(L/D)·(ρ·v²/2), with the friction factor f from the Reynolds number
 * and the pipe's relative roughness (Colebrook-White).
 */
export const pipePressureDrop: CalculatorDefinition = {
  id: 'pipe-pressure-drop',
  title: 'Pressure drop along pipe',
  description:
    'Darcy-Weisbach pressure loss along a straight pipe at a given ' +
    'volumetric flow. Pick a fluid to bring in its density and viscosity at ' +
    '20 °C, then enter the pipe geometry and the flow rate.',
  variables: [
    {
      name: 'fluid',
      label: 'Fluid',
      table: 'materials',
      filter: 'viscosity',
      description: 'Working fluid, which sets its density and viscosity.',
    },
    {
      name: 'density',
      label: 'Density',
      unit: 'kg/m^3',
      editable: false,
      tableSelect: 'fluid',
      tableField: 'density',
      description: 'Density of the chosen fluid at 20 °C.',
    },
    {
      name: 'viscosity',
      label: 'Viscosity',
      unit: 'Pa s',
      editable: false,
      tableSelect: 'fluid',
      tableField: 'viscosity',
      description: 'Dynamic viscosity of the chosen fluid at 20 °C.',
    },
    {
      name: 'diameter',
      label: 'Pipe diameter',
      unit: 'mm',
      description: 'Internal diameter of the pipe.',
      validate: (state) => {
        const diameter = valueOf(state, 'diameter');
        return diameter !== null && diameter <= 0
          ? 'Pipe diameter must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'length',
      label: 'Pipe length',
      unit: 'm',
      description: 'Straight length of pipe between the two ends.',
      validate: (state) => {
        const length = valueOf(state, 'length');
        return length !== null && length <= 0
          ? 'Pipe length must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'roughness',
      label: 'Roughness',
      unit: 'mm',
      default: 0.045,
      description:
        'Absolute wall roughness. About 0.045 mm for drawn steel, 0.15 mm ' +
        'for galvanised steel, and 0.25 mm for cast iron.',
      validate: (state) => {
        const roughness = valueOf(state, 'roughness');
        return roughness !== null && roughness < 0
          ? 'Roughness must not be negative.'
          : undefined;
      },
    },
    {
      name: 'flowRate',
      label: 'Flow rate',
      unit: 'm^3/s',
      defaultDisplayUnit: 'l/min',
      description: 'Volumetric flow through the pipe.',
      validate: (state) => {
        const flowRate = valueOf(state, 'flowRate');
        return flowRate !== null && flowRate < 0
          ? 'Flow rate must not be negative.'
          : undefined;
      },
    },
    {
      name: 'velocity',
      label: 'Velocity',
      unit: 'm/s',
      editable: false,
      description: 'Mean flow velocity, v = Q/A.',
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
      name: 'reynoldsNumber',
      label: 'Reynolds number',
      unit: '1',
      editable: false,
      description: 'Re = ρ·v·D/µ, which sets the flow regime.',
      computable: (state) => {
        const density = valueOf(state, 'density');
        const velocity = valueOf(state, 'velocity');
        const diameter = valueOf(state, 'diameter');
        const viscosity = valueOf(state, 'viscosity');
        if (
          density === null ||
          velocity === null ||
          diameter === null ||
          viscosity === null
        ) {
          return missing([
            ...(density === null ? ['density'] : []),
            ...(velocity === null ? ['velocity'] : []),
            ...(diameter === null ? ['diameter'] : []),
            ...(viscosity === null ? ['viscosity'] : []),
          ]);
        }
        if (viscosity <= 0) {
          return missing([]);
        }
        return (density * velocity * (diameter / 1000)) / viscosity;
      },
    },
    {
      name: 'frictionFactor',
      label: 'Friction factor',
      unit: '1',
      editable: false,
      description:
        'Darcy friction factor. Laminar flow uses 64/Re; turbulent flow uses ' +
        'Colebrook-White.',
      computable: (state) => {
        const reynoldsNumber = valueOf(state, 'reynoldsNumber');
        const roughness = valueOf(state, 'roughness');
        const diameter = valueOf(state, 'diameter');
        if (
          reynoldsNumber === null ||
          roughness === null ||
          diameter === null
        ) {
          return missing([
            ...(reynoldsNumber === null ? ['reynoldsNumber'] : []),
            ...(roughness === null ? ['roughness'] : []),
            ...(diameter === null ? ['diameter'] : []),
          ]);
        }
        if (reynoldsNumber <= 0 || diameter <= 0) {
          return missing([]);
        }
        return frictionFactor(reynoldsNumber, roughness / diameter);
      },
    },
    {
      name: 'pressureDrop',
      label: 'Pressure drop',
      unit: 'Pa',
      defaultDisplayUnit: 'kPa',
      editable: false,
      description: 'Pressure loss along the pipe, Δp = f·(L/D)·(ρ·v²/2).',
      computable: (state) => {
        const friction = valueOf(state, 'frictionFactor');
        const length = valueOf(state, 'length');
        const diameter = valueOf(state, 'diameter');
        const density = valueOf(state, 'density');
        const velocity = valueOf(state, 'velocity');
        if (
          friction === null ||
          length === null ||
          diameter === null ||
          density === null ||
          velocity === null
        ) {
          return missing([
            ...(friction === null ? ['frictionFactor'] : []),
            ...(length === null ? ['length'] : []),
            ...(diameter === null ? ['diameter'] : []),
            ...(density === null ? ['density'] : []),
            ...(velocity === null ? ['velocity'] : []),
          ]);
        }
        if (diameter <= 0) {
          return missing([]);
        }
        return (
          friction *
          (length / (diameter / 1000)) *
          ((density * velocity * velocity) / 2)
        );
      },
    },
  ],
  testCases: [
    {
      fluid: 'water',
      density: 998.2,
      viscosity: 0.001002,
      diameter: 50,
      length: 100,
      roughness: 0.045,
      flowRate: 0.003926990816987242,
      velocity: 2,
      reynoldsNumber: 99620.75848303393,
      frictionFactor: 0.021840547173396615,
      pressureDrop: 87204.936753938,
    },
    {
      fluid: 'air',
      density: 1.204,
      viscosity: 1.825e-5,
      diameter: 200,
      length: 50,
      roughness: 0.045,
      flowRate: 0.3141592653589793,
      velocity: 10,
      reynoldsNumber: 131945.20547945207,
      frictionFactor: 0.01830217342544978,
      pressureDrop: 275.4477100530192,
    },
    {
      fluid: 'propylene-glycol-50',
      density: 1039.1,
      viscosity: 0.0046,
      diameter: 25,
      length: 10,
      roughness: 0.0015,
      flowRate: 0.00005,
      velocity: 0.10185916357881301,
      reynoldsNumber: 575.2274830149163,
      frictionFactor: 0.11126033072091657,
      pressureDrop: 239.8987020608204,
    },
  ],
};
