import configureMeasurements from 'convert-units';
import type { Measure, UnitDescription } from 'convert-units';
import allMeasures from 'convert-units/definitions/all';
import type {
  AllMeasures,
  AllMeasuresSystems,
  AllMeasuresUnits,
} from 'convert-units/definitions/all';

/** Units added by Calcurio because the library has no resistance measure. */
export type ResistanceUnit = 'Ω' | 'mΩ' | 'kΩ' | 'MΩ';

/** Every unit a calculator variable may use. */
export type UnitSymbol = AllMeasuresUnits | ResistanceUnit;

/** Every measurement kind the unit registry understands. */
export type MeasureName = AllMeasures | 'resistance';

type SystemName = AllMeasuresSystems;

const resistance: Measure<SystemName, ResistanceUnit> = {
  systems: {
    SI: {
      mΩ: {
        name: { singular: 'Milliohm', plural: 'Milliohms' },
        to_anchor: 1e-3,
      },
      Ω: {
        name: { singular: 'Ohm', plural: 'Ohms' },
        to_anchor: 1,
      },
      kΩ: {
        name: { singular: 'Kiloohm', plural: 'Kiloohms' },
        to_anchor: 1e3,
      },
      MΩ: {
        name: { singular: 'Megaohm', plural: 'Megaohms' },
        to_anchor: 1e6,
      },
    },
  },
};

const measures: Record<MeasureName, Measure<SystemName, UnitSymbol>> = {
  ...allMeasures,
  resistance,
};

const convert = configureMeasurements(measures);

const MEASURE_NAMES: ReadonlySet<string> = new Set(convert().measures());

/** Converts a value between two units of the same kind. */
export function convertUnit(
  value: number,
  from: UnitSymbol,
  to: UnitSymbol,
): number {
  return convert(value).from(from).to(to);
}

/** Lists every unit of the same kind as `unit`. */
export function unitsOfKind(unit: UnitSymbol): UnitSymbol[] {
  return [...convert().from(unit).possibilities()];
}

/** Returns the measurement kind, such as "voltage" or "resistance". */
export function measureOf(unit: UnitSymbol): MeasureName {
  const { measure } = convert().describe(unit);
  if (!MEASURE_NAMES.has(measure)) {
    throw new Error(`Unknown measurement kind "${measure}".`);
  }
  return measure as MeasureName;
}

/** Returns unit details, or null when the abbreviation is unknown. */
export function tryDescribeUnit(value: string): UnitDescription | null {
  try {
    return convert().describe(value);
  } catch {
    return null;
  }
}

/** Narrows a saved or user supplied string to a known unit. */
export function isUnitSymbol(value: string): value is UnitSymbol {
  return tryDescribeUnit(value) !== null;
}

/**
 * Produces the units shown in the selector: the variable's base unit first,
 * then either its explicit options or every unit of the same kind.
 */
export function choicesForUnit(
  unit: UnitSymbol,
  options?: readonly UnitSymbol[],
): UnitSymbol[] {
  const choices: UnitSymbol[] = [];
  const candidates = options ?? unitsOfKind(unit);
  for (const candidate of [unit, ...candidates]) {
    if (!choices.includes(candidate)) {
      choices.push(candidate);
    }
  }
  return choices;
}
