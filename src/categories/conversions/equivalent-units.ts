import {
  convertUnit,
  measureOf,
  baseUnitForMeasure,
} from '../../framework/units.js';
import type { UnitSymbol } from '../../framework/units.js';
import type { NumberVariableDefinition } from '../../framework/types.js';

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
  units: readonly UnitSymbol[],
): NumberVariableDefinition[] {
  const letters = ['A', 'B', 'C', 'D', 'E','F'
  ].reverse();

  const first = units[0];
  if (first == undefined) {
    throw new Error('empty units list');
  }
  const base = baseUnitForMeasure(measureOf(first));

  const u2l: Record<string, string> = {};

  for (const other of units) {
    u2l[other] = letters.pop()!;
  }

  return units.map((entry) => {
    const equivalent: Record<string, (value: number) => number> = {};
    for (const other of units) {
      if (other === entry) {
        continue;
      }

      equivalent[u2l[other]!] = (value) => value;
    }
    const variable: NumberVariableDefinition = {
      name: u2l[entry]!,
      label: u2l[entry]!,
      unit: base,
      defaultDisplayUnit:entry,
      equivalent,
    };
    return variable;
  });
}
