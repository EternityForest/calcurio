import { CalculatorDefinitionError, errorMessage } from './errors.js';
import type {
  CalcState,
  CalculatorDefinition,
  ConfigFieldDefinition,
  NumberVariableDefinition,
  TableSelectVariableDefinition,
  TextVariableDefinition,
  VariableDefinition,
} from './types.js';
import {
  isNumberVariable,
  isTableFieldVariable,
  isTableSelectVariable,
  isTextVariable,
} from './types.js';
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

  problems.push(...variableProblems(definition.variables));
  problems.push(...configProblems(definition));

  if (definition.computeState !== undefined) {
    if (typeof definition.computeState !== 'function') {
      problems.push('computeState must be a function.');
    } else {
      validateComputeState(definition, problems);
    }
  }

  const variablesByName = indexByName(definition.variables);
  for (const [index, state] of (definition.testCases ?? []).entries()) {
    validateTestCase(
      `test case ${index + 1}`,
      state,
      definition.variables,
      variablesByName,
      problems,
    );
  }

  if (problems.length > 0) {
    throw new CalculatorDefinitionError(
      `Invalid calculator "${definition.id}":\n- ${problems.join('\n- ')}`,
    );
  }
}

/**
 * Rejects a standalone variable list. Used both for a definition's own
 * variables and for the list a `buildVariables` builder produces, so a
 * misconfigured builder fails loudly instead of producing a broken runtime.
 */
export function validateVariableList(
  variables: readonly VariableDefinition[],
  context = 'variable list',
): void {
  const problems = variableProblems(variables);
  if (problems.length > 0) {
    throw new CalculatorDefinitionError(
      `Invalid ${context}:\n- ${problems.join('\n- ')}`,
    );
  }
}

/** Collects every problem in a variable list without throwing. */
function variableProblems(
  variables: readonly VariableDefinition[],
): string[] {
  const problems: string[] = [];
  const variablesByName = indexByName(variables);
  const seen = new Set<string>();
  let solvableCount = 0;

  for (const [index, variable] of variables.entries()) {
    const where = `variable ${index + 1} ("${variable.name}")`;

    if (!VARIABLE_NAME_PATTERN.test(variable.name)) {
      problems.push(
        `${where}: name must start with a letter and contain only ` +
          'letters, digits, and underscores.',
      );
    } else if (seen.has(variable.name)) {
      problems.push(`${where}: duplicate name.`);
    }
    seen.add(variable.name);

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
    if (variable.hidden !== undefined && typeof variable.hidden !== 'boolean') {
      problems.push(`${where}: hidden must be a boolean.`);
    }

    if (variable.takeFrom !== undefined) {
      // A wired variable is filled from its source, so it is solvable even
      // when it has no computable of its own.
      solvableCount += 1;
    }

    if (isTableSelectVariable(variable)) {
      solvableCount += 1;
      validateTableSelect(where, variable, problems);
    } else if (isTextVariable(variable)) {
      if (variable.computable !== undefined) {
        solvableCount += 1;
      }
      validateTextVariable(where, variable, problems);
    } else {
      if (isTableFieldVariable(variable)) {
        solvableCount += 1;
      } else if (variable.computable !== undefined) {
        solvableCount += 1;
      } else if (declaresEquivalents(variable)) {
        // A variable joined to others by `equivalent` links is filled in from
        // whichever member of its group already holds a value.
        solvableCount += 1;
      }
      validateNumberVariable(where, variable, problems);
    }
  }

  for (const [index, variable] of variables.entries()) {
    if (isNumberVariable(variable) && isTableFieldVariable(variable)) {
      validateTableFieldReference(
        `variable ${index + 1} ("${variable.name}")`,
        variable.tableSelect,
        variablesByName,
        problems,
      );
    }
  }

  for (const [index, variable] of variables.entries()) {
    if (!isTableSelectVariable(variable) && !isTextVariable(variable)) {
      validateEquivalent(
        `variable ${index + 1} ("${variable.name}")`,
        variable,
        variablesByName,
        problems,
      );
    }
  }

  for (const [index, variable] of variables.entries()) {
    validateWiring(
      `variable ${index + 1} ("${variable.name}")`,
      variable,
      variablesByName,
      problems,
    );
  }

  if (solvableCount === 0) {
    problems.push(
      'at least one variable must be computable or derive from a table.',
    );
  }

  return problems;
}

/** Indexes variables by name; a later duplicate overwrites the earlier one. */
function indexByName(
  variables: readonly VariableDefinition[],
): Map<string, VariableDefinition> {
  const byName = new Map<string, VariableDefinition>();
  for (const variable of variables) {
    byName.set(variable.name, variable);
  }
  return byName;
}

/**
 * Checks the `takeFrom` and `sendTo` wires of one variable. A wire names
 * another variable; the two must be the same kind, and two numeric variables
 * must measure the same kind while two table selects must share a table.
 */
function validateWiring(
  where: string,
  variable: VariableDefinition,
  variablesByName: ReadonlyMap<string, VariableDefinition>,
  problems: string[],
): void {
  if (variable.takeFrom !== undefined) {
    if (typeof variable.takeFrom !== 'string' || variable.takeFrom === '') {
      problems.push(`${where}: takeFrom must be a non-empty variable name.`);
    } else if (variable.takeFrom === variable.name) {
      problems.push(`${where}: takeFrom must not name the variable itself.`);
    } else {
      const source = variablesByName.get(variable.takeFrom);
      if (source === undefined) {
        problems.push(
          `${where}: takeFrom names unknown variable "${variable.takeFrom}".`,
        );
      } else {
        validateWireMatch(where, 'takeFrom', variable, source, problems);
      }
    }
  }

  if (variable.sendTo === undefined) {
    return;
  }
  if (!Array.isArray(variable.sendTo)) {
    problems.push(`${where}: sendTo must be an array of variable names.`);
    return;
  }
  const seen = new Set<string>();
  for (const targetName of variable.sendTo) {
    if (typeof targetName !== 'string' || targetName === '') {
      problems.push(`${where}: sendTo entries must be non-empty names.`);
      continue;
    }
    if (targetName === variable.name) {
      problems.push(`${where}: sendTo must not name the variable itself.`);
      continue;
    }
    if (seen.has(targetName)) {
      problems.push(`${where}: duplicate sendTo target "${targetName}".`);
      continue;
    }
    seen.add(targetName);
    const target = variablesByName.get(targetName);
    if (target === undefined) {
      problems.push(`${where}: sendTo names unknown variable "${targetName}".`);
    } else {
      validateWireMatch(
        where,
        `sendTo "${targetName}"`,
        variable,
        target,
        problems,
      );
    }
  }
}

/** Checks that a wire joins two variables whose values are compatible. */
function validateWireMatch(
  where: string,
  link: string,
  variable: VariableDefinition,
  other: VariableDefinition,
  problems: string[],
): void {
  const kind = variableKind(variable);
  const otherKind = variableKind(other);
  if (kind !== otherKind) {
    problems.push(
      `${where}: ${link} must be the same kind of variable ` +
        `(it is ${kind}, "${other.name}" is ${otherKind}).`,
    );
    return;
  }
  if (kind === 'tableSelect') {
    const table = (variable as TableSelectVariableDefinition).table;
    const otherTable = (other as TableSelectVariableDefinition).table;
    if (table !== otherTable) {
      problems.push(
        `${where}: ${link} must select from the same table ` +
          `("${table}" vs "${otherTable}").`,
      );
    }
    return;
  }
  if (kind === 'number') {
    const unit = (variable as NumberVariableDefinition).unit;
    const otherUnit = (other as NumberVariableDefinition).unit;
    if (measureOf(unit) !== measureOf(otherUnit)) {
      problems.push(
        `${where}: ${link} must measure the same kind ` +
          `("${unit}" vs "${otherUnit}").`,
      );
    }
  }
}

function variableKind(
  variable: VariableDefinition,
): 'number' | 'text' | 'tableSelect' {
  if (isTableSelectVariable(variable)) {
    return 'tableSelect';
  }
  return isTextVariable(variable) ? 'text' : 'number';
}

/** Collects every problem with a definition's config fields. */
function configProblems(definition: CalculatorDefinition): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const [index, field] of (definition.config ?? []).entries()) {
    const where = `config field ${index + 1} ("${field.name}")`;
    if (!VARIABLE_NAME_PATTERN.test(field.name)) {
      problems.push(
        `${where}: name must start with a letter and contain only ` +
          'letters, digits, and underscores.',
      );
    } else if (seen.has(field.name)) {
      problems.push(`${where}: duplicate name.`);
    }
    seen.add(field.name);

    if (field.label.trim() === '') {
      problems.push(`${where}: label must not be empty.`);
    }
    validateConfigField(where, field, problems);
  }

  if (
    definition.buildVariables !== undefined &&
    typeof definition.buildVariables !== 'function'
  ) {
    problems.push('buildVariables must be a function.');
  }
  return problems;
}

function validateConfigField(
  where: string,
  field: ConfigFieldDefinition,
  problems: string[],
): void {
  switch (field.kind) {
    case 'number':
      if (typeof field.default !== 'number' || !Number.isFinite(field.default)) {
        problems.push(`${where}: default must be a finite number.`);
      }
      if (field.options !== undefined) {
        problems.push(`${where}: options are only allowed on select fields.`);
      }
      if (
        field.min !== undefined &&
        field.max !== undefined &&
        field.min > field.max
      ) {
        problems.push(`${where}: min must not exceed max.`);
      }
      return;
    case 'boolean':
      if (typeof field.default !== 'boolean') {
        problems.push(`${where}: default must be a boolean.`);
      }
      if (field.options !== undefined) {
        problems.push(`${where}: options are only allowed on select fields.`);
      }
      return;
    case 'string':
      if (typeof field.default !== 'string') {
        problems.push(`${where}: default must be a string.`);
      }
      if (field.options !== undefined) {
        problems.push(`${where}: options are only allowed on select fields.`);
      }
      return;
    case 'select': {
      const options = field.options ?? [];
      if (options.length === 0) {
        problems.push(`${where}: select fields must list at least one option.`);
      } else if (new Set(options).size !== options.length) {
        problems.push(`${where}: select options must be unique.`);
      }
      if (typeof field.default !== 'string' || !options.includes(field.default)) {
        problems.push(`${where}: default must be one of the options.`);
      }
      return;
    }
    default:
      problems.push(
        `${where}: unknown kind ` +
          `"${String((field as { kind: unknown }).kind)}".`,
      );
  }
}

/** Validates one test case against the variables it must cover. */
function validateTestCase(
  where: string,
  state: Readonly<CalcState>,
  variables: readonly VariableDefinition[],
  variablesByName: ReadonlyMap<string, VariableDefinition>,
  problems: string[],
): void {
  for (const key of Object.keys(state)) {
    if (!variablesByName.has(key)) {
      problems.push(`${where}: unknown variable "${key}".`);
    }
  }
  for (const variable of variables) {
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
        problems.push(`${where}: "${variable.name}" must be a row key or null.`);
      }
      continue;
    }
    if (isTextVariable(variable)) {
      if (typeof value !== 'string') {
        problems.push(`${where}: "${variable.name}" must be text or null.`);
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
  if (
    variable.default !== undefined &&
    (typeof variable.default !== 'string' || variable.default.trim() === '')
  ) {
    problems.push(`${where}: default must be a non-empty row key.`);
  }
  if (
    variable.filter !== undefined &&
    (typeof variable.filter !== 'string' || variable.filter.trim() === '')
  ) {
    problems.push(`${where}: filter must be a non-empty column key.`);
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

function validateTextVariable(
  where: string,
  variable: TextVariableDefinition,
  problems: string[],
): void {
  if (variable.default !== undefined && typeof variable.default !== 'string') {
    problems.push(`${where}: default must be a string.`);
  }
  if ('unit' in variable || 'unitOptions' in variable) {
    problems.push(`${where}: a text variable must not have a unit.`);
  }
  if ('table' in variable) {
    problems.push(`${where}: a text variable must not reference a table.`);
  }
}

function validateNumberVariable(
  where: string,
  variable: NumberVariableDefinition,
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
  if (
    variable.tableAxis !== undefined &&
    (typeof variable.tableAxis !== 'string' || variable.tableAxis === '')
  ) {
    problems.push(`${where}: tableAxis must be a non-empty variable name.`);
  }
  if (variable.tableAxis !== undefined && !hasField) {
    problems.push(`${where}: tableAxis requires tableField.`);
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

/** True when a numeric variable declares at least one equivalent link. */
function declaresEquivalents(variable: NumberVariableDefinition): boolean {
  const equivalent = variable.equivalent;
  return (
    typeof equivalent === 'object' &&
    equivalent !== null &&
    !Array.isArray(equivalent) &&
    Object.keys(equivalent).length > 0
  );
}

/**
 * Checks the map of equivalent variables. Each entry names another numeric
 * variable and the function that turns this variable's value into it. The
 * pair must be declared in both directions so the relationship is a clean
 * equivalence, and a computable variable, whose value already comes from a
 * formula, must not also declare one.
 */
function validateEquivalent(
  where: string,
  variable: NumberVariableDefinition,
  variablesByName: ReadonlyMap<string, VariableDefinition>,
  problems: string[],
): void {
  const equivalent = variable.equivalent;
  if (equivalent === undefined) {
    return;
  }
  if (
    typeof equivalent !== 'object' ||
    equivalent === null ||
    Array.isArray(equivalent)
  ) {
    problems.push(`${where}: equivalent must be an object of variables.`);
    return;
  }
  if (variable.computable !== undefined) {
    problems.push(
      `${where}: a computable variable must not declare equivalent ` +
        'variables.',
    );
  }

  for (const [targetName, convert] of Object.entries(equivalent)) {
    if (targetName === variable.name) {
      problems.push(`${where}: equivalent must not name the variable itself.`);
      continue;
    }
    const target = variablesByName.get(targetName);
    if (target === undefined) {
      problems.push(
        `${where}: equivalent names unknown variable "${targetName}".`,
      );
      continue;
    }
    if (isTableSelectVariable(target) || isTextVariable(target)) {
      problems.push(
        `${where}: equivalent target "${targetName}" must be a numeric ` +
          'variable.',
      );
      continue;
    }
    if (typeof convert !== 'function') {
      problems.push(
        `${where}: equivalent["${targetName}"] must be a function.`,
      );
      continue;
    }
    if (typeof target.equivalent?.[variable.name] !== 'function') {
      problems.push(
        `${where}: equivalent target "${targetName}" must declare the ` +
          `reverse conversion back to "${variable.name}".`,
      );
    }
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
