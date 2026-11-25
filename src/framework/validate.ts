import { CalculatorDefinitionError, errorMessage } from './errors.js';
import type {
  CalcState,
  CalculatorDefinition,
  TableSelectVariableDefinition,
  VariableDefinition,
} from './types.js';
import { isTableFieldVariable, isTableSelectVariable } from './types.js';
import { isUnchanged } from './unchanged.js';
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
 * Called by every registration and by the runtime constructor. Table contents
 * are checked separately by the table registry.
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

  const variablesByName = new Map<string, VariableDefinition>();
  let solvableCount = 0;

  for (const [index, variable] of definition.variables.entries()) {
    const where = `variable ${index + 1} ("${variable.name}")`;

    if (!VARIABLE_NAME_PATTERN.test(variable.name)) {
      problems.push(
        `${where}: name must start with a letter and contain only ` +
          'letters, digits, and underscores.',
      );
    } else if (variablesByName.has(variable.name)) {
      problems.push(`${where}: duplicate name.`);
    }
    variablesByName.set(variable.name, variable);

    if (variable.label.trim() === '') {
      problems.push(`${where}: label must not be empty.`);
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

    if (isTableSelectVariable(variable)) {
      solvableCount += 1;
      validateTableSelect(where, variable, problems);
    } else {
      if (isTableFieldVariable(variable)) {
        solvableCount += 1;
      } else if (variable.computable !== undefined) {
        solvableCount += 1;
      }
      validateNumberVariable(where, variable, problems);
    }
  }

  for (const [index, variable] of definition.variables.entries()) {
    if (!isTableSelectVariable(variable) && isTableFieldVariable(variable)) {
      validateTableFieldReference(
        `variable ${index + 1} ("${variable.name}")`,
        variable.tableSelect,
        variablesByName,
        problems,
      );
    }
  }

  if (solvableCount === 0) {
    problems.push(
      'at least one variable must be computable or derive from a table.',
    );
  }

  if (definition.computeState !== undefined) {
    if (typeof definition.computeState !== 'function') {
      problems.push('computeState must be a function.');
    } else {
      validateComputeState(definition, problems);
    }
  }

  for (const [index, state] of (definition.testCases ?? []).entries()) {
    const where = `test case ${index + 1}`;
    for (const key of Object.keys(state)) {
      if (!variablesByName.has(key)) {
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
      if (isTableSelectVariable(variable)) {
        if (typeof value !== 'string') {
          problems.push(
            `${where}: "${variable.name}" must be a row key or null.`,
          );
        }
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

/**
 * When `computeState` is set the runtime never solves individual variables, so
 * every `computable` must defer to it by returning the unchanged sentinel.
 */
function validateComputeState(
  definition: CalculatorDefinition,
  problems: string[],
): void {
  const blank: CalcState = {};
  for (const variable of definition.variables) {
    blank[variable.name] = null;
  }
  const frozen = Object.freeze(blank);
  for (const variable of definition.variables) {
    if (isTableSelectVariable(variable) || variable.computable === undefined) {
      continue;
    }
    let result: unknown;
    try {
      result = variable.computable(frozen);
    } catch (error) {
      problems.push(
        `variable "${variable.name}": computeState is set but its computable ` +
          `threw ${errorMessage(error)}.`,
      );
      continue;
    }
    if (!isUnchanged(result)) {
      problems.push(
        `variable "${variable.name}": when computeState is set every ` +
          'computable must return unchanged().',
      );
    }
  }
}

function validateTableSelect(
  where: string,
  variable: TableSelectVariableDefinition,
  problems: string[],
): void {
  if (!isValidIdentifier(variable.table ?? '')) {
    problems.push(`${where}: table must be a lowercase, hyphenated table id.`);
  }
  if ('unit' in variable) {
    problems.push(`${where}: a table-select variable must not have a unit.`);
  }
  if ('unitOptions' in variable) {
    problems.push(
      `${where}: a table-select variable must not have unit options.`,
    );
  }
  if ('computable' in variable) {
    problems.push(
      `${where}: a table-select variable is derived and must not have a ` +
        'computable function.',
    );
  }
  if ('tableSelect' in variable || 'tableField' in variable) {
    problems.push(
      `${where}: a table-select variable cannot also reference another ` +
        'table select.',
    );
  }
}

function validateNumberVariable(
  where: string,
  variable: Extract<VariableDefinition, { unit: UnitSymbol }>,
  problems: string[],
): void {
  const baseDescription = tryDescribeUnit(variable.unit);
  if (baseDescription === null) {
    problems.push(`${where}: unknown unit "${variable.unit}".`);
  } else if (variable.unitOptions !== undefined) {
    validateUnitOptions(where, variable.unit, variable.unitOptions, problems);
  }

  if (variable.defaultDisplayUnit !== undefined) {
    const description = tryDescribeUnit(variable.defaultDisplayUnit);
    if (description === null) {
      problems.push(
        `${where}: unknown default display unit ` +
          `"${variable.defaultDisplayUnit}".`,
      );
    } else if (
      baseDescription !== null &&
      description.measure !== baseDescription.measure
    ) {
      problems.push(
        `${where}: default display unit "${variable.defaultDisplayUnit}" ` +
          `measures "${description.measure}", expected ` +
          `"${baseDescription.measure}".`,
      );
    }
  }

  const hasSelect = variable.tableSelect !== undefined;
  const hasField = variable.tableField !== undefined;
  if (hasSelect !== hasField) {
    problems.push(
      `${where}: tableSelect and tableField must be provided together.`,
    );
  }
  if (hasField && variable.tableField === '') {
    problems.push(`${where}: tableField must not be empty.`);
  }
  if (hasSelect && variable.computable !== undefined) {
    problems.push(
      `${where}: a table-derived variable must not also have a computable ` +
        'function.',
    );
  }

  if (variable.default !== undefined) {
    if (
      typeof variable.default !== 'number' ||
      !Number.isFinite(variable.default)
    ) {
      problems.push(`${where}: default must be a finite number.`);
    } else if (hasSelect || variable.computable !== undefined) {
      problems.push(
        `${where}: only a plain input variable may declare a default.`,
      );
    }
  }
}

function validateTableFieldReference(
  where: string,
  selectName: string | undefined,
  variablesByName: ReadonlyMap<string, VariableDefinition>,
  problems: string[],
): void {
  if (selectName === undefined) {
    return;
  }
  const select = variablesByName.get(selectName);
  if (select === undefined) {
    problems.push(`${where}: tableSelect "${selectName}" is not a variable.`);
    return;
  }
  if (!isTableSelectVariable(select)) {
    problems.push(
      `${where}: tableSelect "${selectName}" is not a table-select variable.`,
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
