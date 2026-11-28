import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Resistor divider. Each resistor can be typed directly or chosen from the
 * E-series tables; the output voltage and the divider ratio follow from the
 * input voltage, the two resistances, and the current the load draws from the
 * output node. The ratio is derived only.
 */
export const voltageDivider: CalculatorDefinition = {
  id: 'voltage-divider',
  title: 'Voltage divider',
  description:
    'Two-resistor divider. Type each resistance or pick one from the ' +
    'E-series tables, set the input voltage, and set the load current to ' +
    'read the loaded output voltage and the divider ratio.',
  variables: [
    {
      name: 'r1Select',
      label: 'R1 (E-series)',
      table: 'e-series-resistors',
      description:
        'Pick a preferred value, or type R1 directly below to match one.',
    },
    {
      name: 'r1',
      label: 'R1',
      unit: 'ohm',
      tableSelect: 'r1Select',
      tableField: 'value',
      description: 'Resistance from the input to the output node.',
    },
    {
      name: 'r2Select',
      label: 'R2 (E-series)',
      table: 'e-series-resistors',
      description:
        'Pick a preferred value, or type R2 directly below to match one.',
    },
    {
      name: 'r2',
      label: 'R2',
      unit: 'ohm',
      tableSelect: 'r2Select',
      tableField: 'value',
      description: 'Resistance from the output node to ground.',
    },
    {
      name: 'vin',
      label: 'Input voltage',
      unit: 'V',
      description: 'Voltage across the whole divider.',
    },
    {
      name: 'loadCurrent',
      label: 'Load current',
      unit: 'A',
      defaultDisplayUnit: 'uA',
      default: 0,
      description:
        'Current drawn from the output node. Zero gives the unloaded ' +
        'voltage.',
    },
    {
      name: 'vout',
      label: 'Output voltage',
      unit: 'V',
      description: 'Voltage across R2 with the load current drawn.',
      computable: (state) => {
        const vin = valueOf(state, 'vin');
        const r1 = valueOf(state, 'r1');
        const r2 = valueOf(state, 'r2');
        const load = valueOf(state, 'loadCurrent');
        if (vin === null || r1 === null || r2 === null || load === null) {
          return missing([
            ...(vin === null ? ['vin'] : []),
            ...(r1 === null ? ['r1'] : []),
            ...(r2 === null ? ['r2'] : []),
            ...(load === null ? ['loadCurrent'] : []),
          ]);
        }
        if (r1 + r2 === 0) {
          return missing([]);
        }
        return (vin * r2 - load * r1 * r2) / (r1 + r2);
      },
    },
    {
      name: 'ratio',
      label: 'Divider ratio',
      unit: '1',
      editable: false,
      description: 'Fraction of the input voltage that appears across R2.',
      computable: (state) => {
        const r1 = valueOf(state, 'r1');
        const r2 = valueOf(state, 'r2');
        if (r1 === null || r2 === null) {
          return missing([
            ...(r1 === null ? ['r1'] : []),
            ...(r2 === null ? ['r2'] : []),
          ]);
        }
        if (r1 + r2 === 0) {
          return missing([]);
        }
        return r2 / (r1 + r2);
      },
    },
  ],
  testCases: [
    {
      r1Select: '1k',
      r1: 1000,
      r2Select: '2.2k',
      r2: 2200,
      vin: 12,
      loadCurrent: 0,
      vout: 8.25,
      ratio: 0.6875,
    },
    {
      r1Select: '4.7k',
      r1: 4700,
      r2Select: '4.7k',
      r2: 4700,
      vin: 5,
      loadCurrent: 0,
      vout: 2.5,
      ratio: 0.5,
    },
    {
      r1Select: '330',
      r1: 330,
      r2Select: '470',
      r2: 470,
      vin: 3.3,
      loadCurrent: 0,
      vout: 1.93875,
      ratio: 0.5875,
    },
    {
      r1Select: '1k',
      r1: 1000,
      r2Select: '2.2k',
      r2: 2200,
      vin: 12,
      loadCurrent: 0.001,
      vout: 7.5625,
      ratio: 0.6875,
    },
  ],
};
