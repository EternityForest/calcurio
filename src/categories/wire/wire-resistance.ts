import { isMissing, missing } from '../../framework/missing.js';
import type { MissingValue } from '../../framework/missing.js';
import { findRow, numericCell } from '../../framework/tables.js';
import type {
  CalcState,
  CalculatorDefinition,
  TableCell,
  TableDefinition,
  TableRow,
} from '../../framework/types.js';
import { wireGaugeTable } from './wire-gauge.js';
import { wireMetalsTable } from './wire-metals.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

interface WireInputs {
  readonly resistivity: number;
  readonly length: number;
  readonly area: number;
}

/** Reads the three values the resistance formulas need, or reports what is
 * still missing. */
function readWireInputs(
  state: Readonly<CalcState>,
): WireInputs | MissingValue {
  const resistivity = valueOf(state, 'resistivity');
  const length = valueOf(state, 'length');
  const area = valueOf(state, 'area');
  if (resistivity === null || length === null || area === null) {
    return missing([
      ...(resistivity === null ? ['resistivity'] : []),
      ...(length === null ? ['length'] : []),
      ...(area === null ? ['area'] : []),
    ]);
  }
  return { resistivity, length, area };
}

function cellNumber(row: TableRow, key: string): number {
  const value: TableCell | undefined = row[key];
  const parsed = numericCell(value);
  if (parsed === null) {
    throw new Error(`Table row is missing numeric column "${key}".`);
  }
  return parsed;
}

function requireRow(table: TableDefinition, key: string): TableRow {
  const row = findRow(table, key);
  if (row === undefined) {
    throw new Error(`Table "${table.id}" has no row "${key}".`);
  }
  return row;
}

/** Builds a complete state for one gauge, metal, and length. */
function wireCase(
  gaugeKey: string,
  metalKey: string,
  length: number,
): Readonly<CalcState> {
  const gauge = requireRow(wireGaugeTable, gaugeKey);
  const metal = requireRow(wireMetalsTable, metalKey);
  const area = cellNumber(gauge, 'area');
  const resistivity = cellNumber(metal, 'resistivity');
  const resistance = (resistivity * length) / area;
  return {
    gauge: gaugeKey,
    area,
    diameter: cellNumber(gauge, 'diameter'),
    radius: cellNumber(gauge, 'radius'),
    metal: metalKey,
    resistivity,
    length,
    resistance,
    roundTripResistance: resistance * 2,
  };
}

/**
 * Resistance of one wire run. A standard gauge (or a directly entered
 * cross-section) and a metal set the resistivity, then the single and
 * round-trip resistance follow from the length.
 */
export const wireResistance: CalculatorDefinition = {
  id: 'wire-resistance',
  title: 'Wire resistance',
  description:
    'Resistance of a length of wire, one-way and round-trip. Choose a ' +
    'standard gauge and metal, or type the cross-section directly.',
  variables: [
    {
      name: 'gauge',
      label: 'Wire gauge',
      table: 'wire-gauge',
      description:
        'Pick a standard size, or type a cross-section, diameter, or ' +
        'radius below to match one.',
    },
    {
      name: 'area',
      label: 'Cross-section',
      unit: 'mm2',
      tableSelect: 'gauge',
      tableField: 'area',
      description: 'Conductor cross-sectional area.',
    },
    {
      name: 'diameter',
      label: 'Diameter',
      unit: 'mm',
      tableSelect: 'gauge',
      tableField: 'diameter',
      description: 'Conductor diameter.',
    },
    {
      name: 'radius',
      label: 'Radius',
      unit: 'mm',
      tableSelect: 'gauge',
      tableField: 'radius',
      description: 'Conductor radius.',
    },
    {
      name: 'metal',
      label: 'Metal',
      table: 'wire-metals',
      description: 'Conductor material, which sets its resistivity.',
    },
    {
      name: 'resistivity',
      label: 'Resistivity',
      unit: 'Ω·mm²/m',
      tableSelect: 'metal',
      tableField: 'resistivity',
      description: 'Resistivity at 20 °C.',
    },
    {
      name: 'length',
      label: 'Length',
      unit: 'm',
      description: 'Length of the wire run.',
      validate: (state) => {
        const length = valueOf(state, 'length');
        return length !== null && length < 0
          ? 'Length must not be negative.'
          : undefined;
      },
    },
    {
      name: 'resistance',
      label: 'Resistance (one-way)',
      unit: 'Ω',
      description: 'Resistance of a single conductor of this length.',
      computable: (state) => {
        const inputs = readWireInputs(state);
        if (isMissing(inputs)) {
          return inputs;
        }
        if (inputs.area === 0) {
          return missing([]);
        }
        return (inputs.resistivity * inputs.length) / inputs.area;
      },
      validate: (state) => {
        const area = valueOf(state, 'area');
        return area !== null && area <= 0
          ? 'Cross-section must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'roundTripResistance',
      label: 'Resistance (round trip)',
      unit: 'Ω',
      description: 'Resistance out and back through the same conductor.',
      computable: (state) => {
        const inputs = readWireInputs(state);
        if (isMissing(inputs)) {
          return inputs;
        }
        if (inputs.area === 0) {
          return missing([]);
        }
        return (2 * inputs.resistivity * inputs.length) / inputs.area;
      },
    },
  ],
  testCases: [
    wireCase('awg-10', 'copper', 10),
    wireCase('awg-24', 'aluminium', 2),
    wireCase('mm2-1-5', 'copper', 25),
    wireCase('awg-4-0', 'annealed-copper', 100),
    wireCase('mm2-630', 'aluminium', 0.5),
  ],
};