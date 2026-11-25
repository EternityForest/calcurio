import { missing } from '../../framework/missing.js';
import type { MissingValue } from '../../framework/missing.js';
import type {
  CalcState,
  CalculatorConfig,
  ConfigFieldDefinition,
  VariableDefinition,
} from '../../framework/types.js';

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

/** How one arithmetic calculator builds its operands and result. */
export interface OperandSpec {
  readonly count: number;
  /** Label for operand `index`, which runs from 0 to `count - 1`. */
  readonly operandLabel: (index: number, count: number) => string;
  readonly resultName: string;
  readonly resultLabel: string;
  readonly combine: (values: readonly number[]) => number | MissingValue;
}

/**
 * Builds `count` dimensionless operand variables plus one read-only result.
 * The result reports the operands it still needs through `missing()`.
 */
export function buildOperands(
  spec: OperandSpec,
): readonly VariableDefinition[] {
  const variables: VariableDefinition[] = [];
  for (let index = 0; index < spec.count; index += 1) {
    variables.push({
      name: slotName(index),
      label: spec.operandLabel(index, spec.count),
      unit: '1',
    });
  }
  variables.push({
    name: spec.resultName,
    label: spec.resultLabel,
    unit: '1',
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
