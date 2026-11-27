import { convertUnit } from '../../framework/units.js';
import type { UnitSymbol } from '../../framework/units.js';
import type { NumberVariableDefinition } from '../../framework/types.js';

/** One unit offered as a variable in a conversion calculator. */
export interface EquivalentUnit {
  /** Variable name, such as "centimetres". */
  readonly name: string;
  /** Label shown in the UI. */
  readonly label: string;
  /** Unit the value is stored and displayed in. */
  readonly unit: UnitSymbol;
  /** Optional explanation shown under the field. */
  readonly description?: string;
}

/**
 * Builds one variable per unit, each joined to the others by `equivalent`
 * conversions so that entering a value in any field fills the rest. The
 * variables are reflections of one another rather than formulas solved from
 * the state, so a conversion calculator has no `computable` values and needs
 * no test cases: the runtime fills the group from whichever single member the
 * user enters.
 *
 * Conversions go through `convertUnit`, so the results agree exactly with the
 * unit system, including the affine offset for temperatures.
 */
export function equivalentUnitVariables(
  units: readonly EquivalentUnit[],
): NumberVariableDefinition[] {
  const symbols = units.map((entry) => entry.unit);
  return units.map((entry) => {
    const equivalent: Record<string, (value: number) => number> = {};
    for (const other of units) {
      if (other.name === entry.name) {
        continue;
      }
      equivalent[other.name] = (value) =>
        convertUnit(value, entry.unit, other.unit);
    }
    const variable: NumberVariableDefinition = {
      name: entry.name,
      label: entry.label,
      unit: entry.unit,
      equivalent,
    };
    if (entry.description === undefined) {
      return variable;
    }
    return { ...variable, description: entry.description };
  });
}
