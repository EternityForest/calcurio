/**
 * Generic capacitor DC-bias data and model. The table holds approximate
 * figures for common dielectric and package combinations; the model turns a
 * rated capacitance and voltage rating into the nonlinear capacitance law
 * `C(V) = Csat + (C0 − Csat) / (1 + (|V| / V0)^n)` used by the calculators.
 *
 * Package sizes are quoted as imperial (EIA) / metric (IEC), e.g. `0402/1005`,
 * so the label is unambiguous. The law is fitted to X5R anchors, so the other
 * class-2 dielectrics are extrapolations of the same shape.
 */

import { booleanCell, findRow, numericCell } from '../framework/tables.js';
import type { TableDefinition, TableRow } from '../framework/types.js';

/** Caps the knee voltage at this multiple of the part's voltage rating. */
const KNEE_VOLTAGE_LIMIT = 1.5;

/**
 * Empirical DC-bias fit, calibrated against 10 µF / 10 V X5R anchors in 0402,
 * 0603 and 0805. `density` is the rated capacitance per active cubic
 * millimetre (µF/mm³): the knee voltage falls as the dielectric packs tighter,
 * and the residual capacitance it settles to shrinks with it too.
 */
const KNEE_SCALE = 2.9;
const KNEE_DENSITY_EXPONENT = -0.145;
const RESIDUAL_INTERCEPT = 0.43;
const RESIDUAL_SLOPE = -0.17;
const MIN_RESIDUAL = 0.05;
const MAX_RESIDUAL = 0.9;

export const capacitorTypesTable: TableDefinition = {
  id: 'capacitor-types',
  title: 'Capacitor types',
  description:
    'Approximate DC-bias behaviour of common ceramic and electrolytic ' +
    'capacitors. Packages are named imperial/metric, e.g. 0402/1005. The ' +
    'active volume is the ceramic or foil volume that stores charge; the ' +
    'nonlinear flag selects whether the DC-bias model applies. The form ' +
    'modifier α_form and knee exponent n shape the capacitance drop with ' +
    'voltage.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Capacitor ID' },
    { key: 'label', label: 'Capacitor' },
    { key: 'dielectric', label: 'Dielectric' },
    {
      key: 'volume',
      label: 'Active volume',
      unit: 'mm^3',
      description: 'Volume of active dielectric, or null when not applicable.',
    },
    {
      key: 'nonlinear',
      label: 'Model nonlinear',
      kind: 'boolean',
      description: 'Whether the DC-bias capacitance drop is modelled.',
    },
    {
      key: 'kDiel',
      label: 'Dielectric k',
      kind: 'number',
      description: 'Dielectric constant of the ceramic body.',
    },
    {
      key: 'alphaForm',
      label: 'Form modifier α_form',
      kind: 'number',
      description: 'Grain and stability modifier of the formulation.',
    },
    {
      key: 'kneeN',
      label: 'Knee exponent n',
      kind: 'number',
      description: 'Sharpness of the capacitance drop with voltage.',
    },
  ],
  rows: [
    {
      id: 'c0g-0603',
      label: '0603/1608 C0G/NP0',
      dielectric: 'C0G/NP0',
      volume: 1,
      nonlinear: false,
      kDiel: null,
      alphaForm: null,
      kneeN: null,
    },
    {
      id: 'x5r-0402',
      label: '0402/1005 X5R',
      dielectric: 'X5R',
      volume: 0.25,
      nonlinear: true,
      kDiel: 1.8,
      alphaForm: 0.8,
      kneeN: 2.1,
    },
    {
      id: 'x5r-0603',
      label: '0603/1608 X5R',
      dielectric: 'X5R',
      volume: 1,
      nonlinear: true,
      kDiel: 1.8,
      alphaForm: 0.85,
      kneeN: 2.1,
    },
    {
      id: 'x5r-0805',
      label: '0805/2012 X5R',
      dielectric: 'X5R',
      volume: 3.1,
      nonlinear: true,
      kDiel: 1.8,
      alphaForm: 0.9,
      kneeN: 2.1,
    },
    {
      id: 'x7r-0603',
      label: '0603/1608 X7R',
      dielectric: 'X7R',
      volume: 1,
      nonlinear: true,
      kDiel: 2.2,
      alphaForm: 1,
      kneeN: 1.4,
    },
    {
      id: 'x7r-0805',
      label: '0805/2012 X7R',
      dielectric: 'X7R',
      volume: 3.1,
      nonlinear: true,
      kDiel: 2.2,
      alphaForm: 1,
      kneeN: 1.4,
    },
    {
      id: 'x7r-1206',
      label: '1206/3216 X7R',
      dielectric: 'X7R',
      volume: 8,
      nonlinear: true,
      kDiel: 2.2,
      alphaForm: 1,
      kneeN: 1.4,
    },
    {
      id: 'x8r-1206',
      label: '1206/3216 X8R',
      dielectric: 'X8R',
      volume: 8,
      nonlinear: true,
      kDiel: 2.4,
      alphaForm: 1.25,
      kneeN: 1.3,
    },
    {
      id: 'x7t-1210',
      label: '1210/3225 X7T',
      dielectric: 'X7T',
      volume: 16,
      nonlinear: true,
      kDiel: 2.4,
      alphaForm: 1.3,
      kneeN: 1.25,
    },
    {
      id: 'alu-polymer',
      label: 'Aluminium polymer',
      dielectric: 'Conductive polymer',
      volume: null,
      nonlinear: false,
      kDiel: null,
      alphaForm: null,
      kneeN: null,
    },
    {
      id: 'alu-electrolytic',
      label: 'Aluminium electrolytic',
      dielectric: 'Wet Al₂O₃',
      volume: null,
      nonlinear: false,
      kDiel: null,
      alphaForm: null,
      kneeN: null,
    },
    {
      id: 'tantalum',
      label: 'Tantalum (MnO₂)',
      dielectric: 'Ta₂O₅',
      volume: null,
      nonlinear: false,
      kDiel: null,
      alphaForm: null,
      kneeN: null,
    },
  ],
};

/** DC-bias shape taken from one row of the capacitor types table. */
export interface CapacitorType {
  readonly id: string;
  readonly label: string;
  readonly dielectric: string;
  /** Active dielectric volume in cubic millimetres, or null. */
  readonly volume: number | null;
  readonly nonlinear: boolean;
  readonly kDiel: number | null;
  readonly alphaForm: number | null;
  readonly kneeN: number | null;
}

/** A concrete capacitor resolved for a rated value and voltage rating. */
export interface CapacitorModel {
  /** True when the DC-bias model applies. */
  readonly nonlinear: boolean;
  /** Rated (zero-bias) capacitance C0, in farads. */
  readonly capacitance: number;
  /** Fully biased capacitance Csat, in farads. */
  readonly saturated: number;
  /** Knee voltage V0, in volts. */
  readonly kneeVoltage: number;
  /** Knee exponent n. */
  readonly exponent: number;
}

/** Converts one table row into a capacitor type. */
export function capacitorTypeFrom(row: TableRow): CapacitorType {
  const id = row['id'];
  const label = row['label'];
  if (typeof id !== 'string' || typeof label !== 'string') {
    throw new Error('Capacitor types table has an incomplete row.');
  }
  return {
    id,
    label,
    dielectric: typeof row['dielectric'] === 'string' ? row['dielectric'] : '',
    volume: numericCell(row['volume']),
    nonlinear: booleanCell(row['nonlinear']) === true,
    kDiel: numericCell(row['kDiel']),
    alphaForm: numericCell(row['alphaForm']),
    kneeN: numericCell(row['kneeN']),
  };
}

/** Finds a capacitor type by its table key, or null when unknown. */
export function findCapacitorType(id: string): CapacitorType | null {
  const row = findRow(capacitorTypesTable, id);
  return row === undefined ? null : capacitorTypeFrom(row);
}

/**
 * Turns a rated capacitance and voltage rating into the parameters of the
 * DC-bias law. Parts without a modelled bias, or without the data the model
 * needs, resolve to a fixed capacitance.
 */
export function resolveCapacitor(
  type: CapacitorType,
  capacitance: number,
  voltageRating: number,
): CapacitorModel {
  if (
    !type.nonlinear ||
    type.volume === null ||
    type.volume <= 0 ||
    type.kDiel === null ||
    type.alphaForm === null ||
    type.kneeN === null
  ) {
    return {
      nonlinear: false,
      capacitance,
      saturated: capacitance,
      kneeVoltage: Number.POSITIVE_INFINITY,
      exponent: 1,
    };
  }

  // Volumetric density in µF per mm³: the capacitance a cubic millimetre of
  // dielectric holds. The empirical fit is calibrated in those units.
  const density = (capacitance * 1e6) / type.volume;
  const kneeVoltage = Math.min(
    KNEE_SCALE *
      type.alphaForm *
      type.kDiel *
      Math.pow(density, KNEE_DENSITY_EXPONENT),
    KNEE_VOLTAGE_LIMIT * voltageRating,
  );
  const ratio = clamp(
    RESIDUAL_INTERCEPT + RESIDUAL_SLOPE * Math.log(density),
    MIN_RESIDUAL,
    MAX_RESIDUAL,
  );

  return {
    nonlinear: true,
    capacitance,
    saturated: ratio * capacitance,
    kneeVoltage,
    exponent: type.kneeN,
  };
}

/**
 * Capacitance at a given bias voltage. Mirrors the ngspice law the SPICE
 * netlist emits; keep the two in step.
 */
export function capacitanceAtVoltage(
  model: CapacitorModel,
  voltage: number,
): number {
  if (!model.nonlinear) {
    return model.capacitance;
  }
  const ratio = Math.abs(voltage) / model.kneeVoltage;
  return (
    model.saturated +
    (model.capacitance - model.saturated) /
      (1 + Math.pow(ratio, model.exponent))
  );
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}
