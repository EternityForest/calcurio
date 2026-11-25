/**
 * Generic inductor saturation data and model. The table holds approximate
 * figures for common material and construction classes; the model turns a
 * rated inductance and saturation current into the nonlinear inductance law
 * `L(i) = L∞ + (L0 − L∞) / (1 + (|i| / I_k)^p)` used by the calculators.
 */

import { findRow, numericCell } from '../framework/tables.js';
import type { TableDefinition, TableRow } from '../framework/types.js';

/** Temperature the derating column is quoted at, in degrees Celsius. */
export const DERATING_TEMPERATURE = 100;

/** Temperature the unsaturated ratings are quoted at, in degrees Celsius. */
export const REFERENCE_TEMPERATURE = 25;

export const inductorTypesTable: TableDefinition = {
  id: 'inductor-types',
  title: 'Inductor types',
  description:
    'Approximate saturation behaviour of common inductor materials. The ' +
    'saturation drop ΔL is the fraction of the rated inductance lost at the ' +
    'rated saturation current, knee sharpness sets how abruptly that happens ' +
    '(2 is the classic atan shape), residual inductance is the fraction left ' +
    'at very high current, and the 100 °C derating scales the saturation ' +
    'current of a hot part.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Inductor ID' },
    { key: 'label', label: 'Inductor' },
    { key: 'material', label: 'Material / construction' },
    {
      key: 'drop',
      label: 'Saturation drop ΔL',
      kind: 'number',
      description:
        'Fraction of the rated inductance lost at the rated saturation ' +
        'current. Zero means the part never saturates.',
    },
    {
      key: 'knee',
      label: 'Knee sharpness',
      kind: 'number',
      description:
        'Exponent p of the saturation knee. Larger values bend more sharply.',
    },
    {
      key: 'residual',
      label: 'Residual L∞/L0',
      kind: 'number',
      description:
        'Fraction of the rated inductance that remains at very high current.',
    },
    {
      key: 'tempDerating',
      label: 'Derating at 100 °C',
      kind: 'number',
      description:
        'Fraction of the rated saturation current available at 100 °C; 1 at ' +
        '25 °C, interpolated in between.',
    },
  ],
  rows: [
    {
      id: 'air',
      label: 'Air core',
      material: 'Air',
      drop: 0,
      knee: null,
      residual: 1,
      tempDerating: 1,
    },
    {
      id: 'ferrite-drum',
      label: 'Ferrite drum (shielded)',
      material: 'Ferrite, gapped drum',
      drop: 0.1,
      knee: 2,
      residual: 0.05,
      tempDerating: 0.9,
    },
    {
      id: 'ferrite-toroid',
      label: 'Ferrite toroid (ungapped)',
      material: 'Ferrite, ungapped toroid',
      drop: 0.1,
      knee: 2.2,
      residual: 0.03,
      tempDerating: 0.92,
    },
    {
      id: 'iron-powder',
      label: 'Iron powder (carbonyl)',
      material: 'Powdered iron, distributed gap',
      drop: 0.3,
      knee: 1.4,
      residual: 0.3,
      tempDerating: 0.85,
    },
    {
      id: 'sendust',
      label: 'Sendust (Kool Mµ)',
      material: 'Powdered alloy, distributed gap',
      drop: 0.2,
      knee: 1.7,
      residual: 0.15,
      tempDerating: 0.9,
    },
    {
      id: 'mpp',
      label: 'Molypermalloy (MPP)',
      material: 'Powdered alloy, distributed gap',
      drop: 0.2,
      knee: 1.8,
      residual: 0.12,
      tempDerating: 0.9,
    },
    {
      id: 'high-flux',
      label: 'High flux',
      material: 'Powdered alloy, distributed gap',
      drop: 0.3,
      knee: 1.4,
      residual: 0.3,
      tempDerating: 0.8,
    },
    {
      id: 'nanocrystalline',
      label: 'Nanocrystalline',
      material: 'Nanocrystalline ribbon core',
      drop: 0.1,
      knee: 2.2,
      residual: 0.05,
      tempDerating: 0.95,
    },
  ],
};

/** Saturation shape taken from one row of the inductor types table. */
export interface InductorType {
  readonly id: string;
  readonly label: string;
  readonly material: string;
  /** Fraction of the rated inductance lost at the rated saturation current. */
  readonly drop: number;
  /** Knee sharpness exponent p, or null for a linear material. */
  readonly knee: number | null;
  /** Residual inductance fraction L∞/L0. */
  readonly residual: number;
  /** Fraction of the rated saturation current available at 100 °C. */
  readonly tempDerating: number;
}

/** A concrete inductor resolved for a rated value, current, and temperature. */
export interface InductorModel {
  /** True when the part does not saturate and behaves as a fixed inductance. */
  readonly linear: boolean;
  /** Inductance at zero current (L0), in henries. */
  readonly inductance: number;
  /** Residual inductance at very high current (L∞), in henries. */
  readonly infinity: number;
  /** Rated saturation current at 25 °C, in amperes. */
  readonly saturationCurrent: number;
  /** Saturation current after temperature derating, in amperes. */
  readonly deratedCurrent: number;
  /** Knee current I_k, in amperes, meaningful only when not linear. */
  readonly kneeCurrent: number;
  /** Knee sharpness exponent p. */
  readonly knee: number;
}

/** Converts one table row into an inductor type. */
export function inductorTypeFrom(row: TableRow): InductorType {
  const id = row['id'];
  const label = row['label'];
  const drop = numericCell(row['drop']);
  const residual = numericCell(row['residual']);
  const tempDerating = numericCell(row['tempDerating']);
  if (
    typeof id !== 'string' ||
    typeof label !== 'string' ||
    drop === null ||
    residual === null ||
    tempDerating === null
  ) {
    throw new Error('Inductor types table has an incomplete row.');
  }
  return {
    id,
    label,
    material: typeof row['material'] === 'string' ? row['material'] : '',
    drop,
    knee: numericCell(row['knee']),
    residual,
    tempDerating,
  };
}

/** Finds an inductor type by its table key, or null when unknown. */
export function findInductorType(id: string): InductorType | null {
  const row = findRow(inductorTypesTable, id);
  return row === undefined ? null : inductorTypeFrom(row);
}

/**
 * Fraction of the rated saturation current available at `temperature`. The
 * table quotes 1 at 25 °C and `tempDerating` at 100 °C; temperatures in
 * between are interpolated linearly.
 */
export function temperatureFactor(
  type: InductorType,
  temperature: number,
): number {
  const span = DERATING_TEMPERATURE - REFERENCE_TEMPERATURE;
  const slope = (type.tempDerating - 1) / span;
  return 1 + slope * (temperature - REFERENCE_TEMPERATURE);
}

/**
 * Turns a rated inductance, saturation current, and temperature into the
 * parameters of the saturation law. A part that never saturates (ΔL of zero)
 * or that keeps all its inductance resolves to a linear model.
 */
export function resolveInductor(
  type: InductorType,
  inductance: number,
  saturationCurrent: number,
  temperature: number,
): InductorModel {
  const deratedCurrent =
    saturationCurrent * temperatureFactor(type, temperature);
  const residualInductance = type.residual * inductance;
  const linear =
    type.drop <= 0 ||
    type.residual >= 1 ||
    type.knee === null ||
    type.knee <= 0;

  if (linear) {
    return {
      linear: true,
      inductance,
      infinity: inductance,
      saturationCurrent,
      deratedCurrent,
      kneeCurrent: Number.POSITIVE_INFINITY,
      knee: 1,
    };
  }

  const knee = type.knee as number;
  const headroom = 1 - type.drop - type.residual;
  if (headroom <= 0 || deratedCurrent <= 0) {
    throw new Error(
      `Inductor "${type.label}" cannot reach its saturation drop of ` +
        `${type.drop}.`,
    );
  }
  const kneeCurrent = deratedCurrent * Math.pow(headroom / type.drop, 1 / knee);

  return {
    linear: false,
    inductance,
    infinity: residualInductance,
    saturationCurrent,
    deratedCurrent,
    kneeCurrent,
    knee,
  };
}

/**
 * Inductance at a given current. Mirrors the ngspice law the SPICE netlist
 * emits; keep the two in step.
 */
export function inductanceAtCurrent(
  model: InductorModel,
  current: number,
): number {
  if (model.linear) {
    return model.inductance;
  }
  const ratio = Math.abs(current) / model.kneeCurrent;
  return (
    model.infinity +
    (model.inductance - model.infinity) / (1 + Math.pow(ratio, model.knee))
  );
}
