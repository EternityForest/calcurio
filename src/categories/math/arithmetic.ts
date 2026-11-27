import { missing } from '../../framework/missing.js';
import type { MissingValue } from '../../framework/missing.js';
import type {
  CalcState,
  CalculatorConfig,
  ConfigFieldDefinition,
  VariableDefinition,
} from '../../framework/types.js';
import {
  defaultUnitForMeasure,
  measurementKinds,
  measureOf,
  type MeasureName,
  type UnitSymbol,
} from '../../framework/units.js';

/** Fewest and most operands an arithmetic calculator accepts. */
export const MIN_SLOTS = 2;
export const MAX_SLOTS = 10;

/** Name of operand `index` (zero-based). */
export function slotName(index: number): string {
  return `value${index + 1}`;
}

/** Config field letting the user choose how many operands to show. */
export const slotsConfig: readonly ConfigFieldDefinition[] = [
  {
    name: 'slots',
    label: 'Values',
    kind: 'number',
    default: MIN_SLOTS,
    min: MIN_SLOTS,
    max: MAX_SLOTS,
    description: 'How many values to combine.',
  },
];

/** Reads the operand count from config, clamped to the allowed range. */
export function slotCount(config: CalculatorConfig): number {
  const raw = config['slots'];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return MIN_SLOTS;
  }
  return Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, Math.round(raw)));
}

/** All measurement kinds suitable for add/subtract unit selection. */
function unitOptions(): readonly string[] {
  return [...measurementKinds(), '1'];
}

/** Config field for selecting the unit of operands and result. */
export const unitConfig: readonly ConfigFieldDefinition[] = [
  {
    name: 'unit',
    label: 'Unit',
    kind: 'select',
    default: '1',
    options: unitOptions(),
    description: 'Unit for all values and the result.',
  },
];

/** Reads the unit from config, defaulting to dimensionless. */
export function getUnit(config: CalculatorConfig): UnitSymbol {
  const raw = config['unit'];
  if (typeof raw === 'string') {
    // Handle custom "1" string which is dimensionless
    if (raw === '1') {
      return '1';
    }
    // Check if it's a valid measure name or a direct unit
    try {
      return measureOf(raw as UnitSymbol) ? (raw as UnitSymbol) : defaultUnitForMeasure(raw as MeasureName);
    } catch {
      return '1';
    }
  }
  return '1';
}

/** How one arithmetic calculator builds its operands and result. */
export interface OperandSpec {
  readonly count: number;
  /** Label for operand `index`, which runs from 0 to `count - 1`. */
  readonly operandLabel: (index: number, count: number) => string;
  readonly resultName: string;
  readonly resultLabel: string;
  readonly combine: (values: readonly number[]) => number | MissingValue;
  /** Unit for operands and result (defaults to dimensionless). */
  readonly unit?: UnitSymbol;
}

/**
 * Builds `count` operand variables plus one read-only result.
 * Each operand and the result use the specified unit.
 * The result reports the operands it still needs through `missing()`.
 */
export function buildOperands(
  spec: OperandSpec,
): readonly VariableDefinition[] {
  const unit = spec.unit ?? '1';
  const variables: VariableDefinition[] = [];
  for (let index = 0; index < spec.count; index += 1) {
    variables.push({
      name: slotName(index),
      label: spec.operandLabel(index, spec.count),
      unit,
    });
  }
  variables.push({
    name: spec.resultName,
    label: spec.resultLabel,
    unit,
    editable: false,
    computable: (state) => combineSlots(state, spec),
  });
  return variables;
}

/** Combines the operands, or reports the ones that are still empty. */
function combineSlots(
  state: Readonly<CalcState>,
  spec: OperandSpec,
): number | MissingValue {
  const values: number[] = [];
  const missingNames: string[] = [];
  for (let index = 0; index < spec.count; index += 1) {
    const name = slotName(index);
    const value = state[name];
    if (typeof value === 'number' && Number.isFinite(value)) {
      values.push(value);
    } else {
      missingNames.push(name);
    }
  }
  if (missingNames.length > 0) {
    return missing(missingNames);
  }
  return spec.combine(values);
}

/** Shared operand label for calculators that simply number their values. */
export function numberedLabel(index: number): string {
  return `Value ${index + 1}`;
}
