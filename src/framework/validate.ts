import { CalculatorDefinitionError } from './errors.js';
import type { CalculatorDefinition } from './types.js';
import { measureOf, tryDescribeUnit } from './units.js';
import type { UnitSymbol } from './units.js';

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VARIABLE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Checks that an id is a lowercase, hyphen-separated slug. */
export function isValidIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}

/**
 * Rejects definitions that would make the runtime behave unpredictably.
 * Called by every registration and by the runtime constructor.
 */
export function validateCalculatorDefinition(
  definition: CalculatorDefinition,
): void {
  const problems: string[] = [];

  if (!isValidIdentifier(definition.id)) {
    problems.push(
      `id "${definition.id}" must use lowercase letters, digits, ` +
        'and single hyphens.',
    );
  }
  if (definition.title.trim() === '') {
    problems.push('title must not be empty.');
  }
  if (definition.variables.length === 0) {
    problems.push('at least one variable is required.');
  }

  const variableNames = new Set<string>();
  let computableCount = 0;

  for (const [index, variable] of definition.variables.entries()) {
    const where = `variable ${index + 1} ("${variable.name}")`;

    if (!VARIABLE_NAME_PATTERN.test(variable.name)) {
      problems.push(
        `${where}: name must start with a letter and contain only ` +
          'letters, digits, and underscores.',
      );
    } else if (variableNames.has(variable.name)) {
      problems.push(`${where}: duplicate name.`);
    }
    variableNames.add(variable.name);

    if (variable.label.trim() === '') {
      problems.push(`${where}: label must not be empty.`);
    }

    const baseDescription = tryDescribeUnit(variable.unit);
    if (baseDescription === null) {
      problems.push(`${where}: unknown unit "${variable.unit}".`);
    } else if (variable.unitOptions !== undefined) {
      validateUnitOptions(where, variable.unit, variable.unitOptions, problems);
    }

    if (variable.computable !== undefined) {
      computableCount += 1;
    }
    if (
      variable.editable !== undefined &&
      typeof variable.editable !== 'boolean'
    ) {
      problems.push(`${where}: editable must be a boolean.`);
    }
    if (variable.input !== undefined && typeof variable.input !== 'boolean') {
      problems.push(`${where}: input must be a boolean.`);
    }
  }

  if (computableCount === 0) {
    problems.push('at least one variable must be computable.');
  }

  for (const [index, state] of (definition.testCases ?? []).entries()) {
    const where = `test case ${index + 1}`;
    for (const key of Object.keys(state)) {
      if (!variableNames.has(key)) {
        problems.push(`${where}: unknown variable "${key}".`);
      }
    }
    for (const variable of definition.variables) {
      if (!Object.hasOwn(state, variable.name)) {
        problems.push(`${where}: missing variable "${variable.name}".`);
        continue;
      }
      const value = state[variable.name];
      if (value === null) {
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        problems.push(
          `${where}: "${variable.name}" must be a finite number or null.`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new CalculatorDefinitionError(
      `Invalid calculator "${definition.id}":\n- ${problems.join('\n- ')}`,
    );
  }
}

function validateUnitOptions(
  where: string,
  baseUnit: UnitSymbol,
  options: readonly string[],
  problems: string[],
): void {
  const baseMeasure = measureOf(baseUnit);
  const seen = new Set<string>();
  for (const option of options) {
    if (seen.has(option)) {
      problems.push(`${where}: duplicate unit option "${option}".`);
      continue;
    }
    seen.add(option);
    const description = tryDescribeUnit(option);
    if (description === null) {
      problems.push(`${where}: unknown unit option "${option}".`);
      continue;
    }
    if (description.measure !== baseMeasure) {
      problems.push(
        `${where}: unit option "${option}" measures ` +
          `"${description.measure}", expected "${baseMeasure}".`,
      );
    }
  }
}
