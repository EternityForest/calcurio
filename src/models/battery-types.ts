/**
 * Resting cell voltage against state of charge for common battery
 * chemistries, and a model that relates state of charge, cell voltage, and
 * pack voltage. The voltage column is a two-dimensional lookup sampled against
 * state of charge and temperature. The model interpolates it forwards to a
 * cell voltage, and inverts it by binary search to a state of charge.
 *
 * The reference curves are typical resting open-circuit voltages at 25 °C;
 * the temperature coefficient shifts them a few millivolts per degree, rising
 * with temperature for lead-acid and falling for the rest.
 */

import {
  interpolateLookup,
  invertLookup,
  lookupCellOf,
} from '../framework/interpolate.js';
import type { LookupCell } from '../framework/interpolate.js';
import { findRow, numericCell, textCell } from '../framework/tables.js';
import type { TableDefinition, TableRow } from '../framework/types.js';

/** State-of-charge sample points, in percent. */
const SOC_POINTS = [0, 25, 50, 75, 100] as const;
/** Temperature sample points, in degrees Celsius. */
const TEMPERATURE_POINTS = [-10, 25, 45] as const;
/** Temperature the reference curves are quoted at, in degrees Celsius. */
export const REFERENCE_TEMPERATURE = 25;
/** Decimals kept when writing a sampled voltage into a cell. */
const VOLTAGE_DECIMALS = 4;

/** One chemistry's reference curve and its temperature dependence. */
interface ChemistrySpec {
  readonly id: string;
  readonly label: string;
  /** Nominal cell voltage, for reference. */
  readonly nominal: number;
  /** Resting cell voltage at 0, 25, 50, 75 and 100 % charge, at 25 °C. */
  readonly curve: readonly [number, number, number, number, number];
  /** Volts per degree Celsius away from 25 °C. */
  readonly temperatureCoefficient: number;
}

/** Typical resting cell voltages of the common chemistries. */
const CHEMISTRIES: readonly ChemistrySpec[] = [
  {
    id: 'li-ion-lco',
    label: 'Lithium cobalt oxide (LCO)',
    nominal: 3.6,
    curve: [3.0, 3.65, 3.8, 3.95, 4.2],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'li-ion-lmo',
    label: 'Lithium manganese oxide (LMO)',
    nominal: 3.7,
    curve: [3.0, 3.7, 3.85, 4.0, 4.2],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'li-ion-nmc',
    label: 'Lithium nickel manganese cobalt (NMC)',
    nominal: 3.6,
    curve: [3.0, 3.55, 3.7, 3.95, 4.2],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'li-ion-nca',
    label: 'Lithium nickel cobalt aluminium (NCA)',
    nominal: 3.6,
    curve: [3.0, 3.5, 3.65, 3.9, 4.2],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'lifepo4',
    label: 'Lithium iron phosphate (LiFePO₄)',
    nominal: 3.2,
    curve: [2.5, 3.2, 3.28, 3.33, 3.45],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'lithium-titanate',
    label: 'Lithium titanate (LTO)',
    nominal: 2.4,
    curve: [1.5, 2.2, 2.35, 2.45, 2.8],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'sodium-nfpp',
    label: 'Sodium NFPP',
    nominal: 3.1,
    curve: [2.0, 3.1, 3.15, 3.2, 3.8],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'sodium-layered-oxide',
    label: 'Sodium layered oxide',
    nominal: 3.2,
    curve: [2.2, 3.05, 3.25, 3.5, 4.0],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'nimh',
    label: 'Nickel metal hydride (NiMH)',
    nominal: 1.2,
    curve: [1.0, 1.25, 1.28, 1.32, 1.45],
    temperatureCoefficient: -0.0003,
  },
  {
    id: 'lithium-coin-3v',
    label: 'Lithium coin cell (3 V)',
    nominal: 3.0,
    curve: [2.0, 2.9, 3.0, 3.1, 3.3],
    temperatureCoefficient: -0.0002,
  },
  {
    id: 'lithium-1.5v',
    label: 'Lithium (1.5 V)',
    nominal: 1.5,
    curve: [0.9, 1.5, 1.6, 1.7, 1.8],
    temperatureCoefficient: -0.0003,
  },
  {
    id: 'alkaline',
    label: 'Alkaline',
    nominal: 1.5,
    curve: [0.9, 1.25, 1.35, 1.45, 1.6],
    temperatureCoefficient: -0.0003,
  },
  {
    id: 'flooded-lead-acid',
    label: 'Flooded lead-acid',
    nominal: 2.0,
    curve: [1.983, 2.0, 2.033, 2.067, 2.117],
    temperatureCoefficient: 0.0003,
  },
];

/** Rounds to a fixed number of decimals, dropping floating point noise. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Builds a lookup cell for one chemistry: every state-of-charge point at every
 * temperature point, each the reference voltage shifted by the temperature
 * coefficient. Written as "voltage@soc,temperature" samples.
 */
function voltageCell(spec: ChemistrySpec): string {
  const samples: string[] = [];
  for (const [index, soc] of SOC_POINTS.entries()) {
    const reference = spec.curve[index]!;
    for (const temperature of TEMPERATURE_POINTS) {
      const volts =
        reference +
        spec.temperatureCoefficient * (temperature - REFERENCE_TEMPERATURE);
      samples.push(`${round(volts, VOLTAGE_DECIMALS)}@${soc},${temperature}`);
    }
  }
  return samples.join('; ');
}

export const batteryTypesTable: TableDefinition = {
  id: 'battery-types',
  title: 'Battery chemistries',
  description:
    'Typical resting cell voltages of common battery chemistries, sampled ' +
    'against state of charge (percent) and temperature (°C). The voltage ' +
    'column is written as "voltage@charge,temperature" samples; the nominal ' +
    'voltage is the familiar label value.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Chemistry ID' },
    { key: 'label', label: 'Chemistry' },
    {
      key: 'nominal',
      label: 'Nominal voltage',
      unit: 'V',
      description: 'Nominal cell voltage.',
    },
    {
      key: 'voltage',
      label: 'Resting voltage',
      unit: 'V@percent,degC',
      kind: 'lookup',
      standards: { degC: REFERENCE_TEMPERATURE },
      description:
        'Resting cell voltage sampled against state of charge and ' +
        'temperature, written as "voltage@charge,temperature" samples.',
    },
  ],
  rows: CHEMISTRIES.map((spec) => ({
    id: spec.id,
    label: spec.label,
    nominal: spec.nominal,
    voltage: voltageCell(spec),
  })),
};

/** One chemistry's voltage data, with its lookup column parsed. */
export interface BatteryType {
  readonly id: string;
  readonly label: string;
  readonly nominal: number | null;
  readonly voltage: LookupCell | null;
}

/** Converts one table row into a battery chemistry. */
export function batteryTypeFrom(row: TableRow): BatteryType {
  const id = textCell(row['id']);
  const label = textCell(row['label']);
  if (id === null || label === null) {
    throw new Error('Battery types table has an incomplete row.');
  }
  return {
    id,
    label,
    nominal: numericCell(row['nominal']),
    voltage: lookupCellOf(row['voltage']),
  };
}

/** Finds a chemistry by its table key, or null when unknown. */
export function findBatteryType(id: string): BatteryType | null {
  const row = findRow(batteryTypesTable, id);
  return row === undefined ? null : batteryTypeFrom(row);
}

/**
 * Resting cell voltage at a state of charge and temperature, or null when the
 * chemistry has no voltage data.
 */
export function cellVoltageAt(
  type: BatteryType,
  socPercent: number,
  temperature: number,
): number | null {
  if (type.voltage === null) {
    return null;
  }
  return interpolateLookup(
    type.voltage,
    [socPercent, temperature],
    [null, REFERENCE_TEMPERATURE],
  );
}

/**
 * State of charge that produces a resting cell voltage, by inverse search
 * along the state-of-charge axis with the temperature fixed. Returns null when
 * the chemistry has no voltage data. Targets outside the sampled range clamp
 * to the nearer end.
 */
export function stateOfChargeAt(
  type: BatteryType,
  cellVoltage: number,
  temperature: number,
): number | null {
  if (type.voltage === null) {
    return null;
  }
  return invertLookup(
    type.voltage,
    0,
    [null, temperature],
    [null, REFERENCE_TEMPERATURE],
    cellVoltage,
  );
}
