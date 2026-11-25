import { CustomDefinitionError } from '../framework/errors.js';
import { findRow } from '../framework/tables.js';
import type {
  CalcValue,
  ConfigFieldDefinition,
  VariableDefinition,
} from '../framework/types.js';
import { isTableSelectVariable, isTextVariable } from '../framework/types.js';
import { measureOf, tryDescribeUnit } from '../framework/units.js';
import type { UnitSymbol } from '../framework/units.js';
import { isValidIdentifier } from '../framework/validate.js';
import type { CalculatorCatalog } from './catalog.js';
import { localVariables, stepFields, wireOptions } from './steps.js';
import type { WireOption } from './steps.js';
import { CUSTOM_VERSION, parseWirePath, wirePath } from './types.js';
import type { CustomDefinition, CustomStep, SubcalcStep } from './types.js';

/** Step ids are short slugs that prefix every variable of the step. */
const STEP_ID_PATTERN = /^[a-z][a-z0-9]*$/;

/**
 * Collects every problem in a custom definition, given the catalog it embeds
 * its subcalculators from. Empty means the custom is safe to compile and run.
 */
export function customProblems(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): string[] {
  const problems: string[] = [];
  const seenStepIds = new Set<string>();

  if (custom.version !== CUSTOM_VERSION) {
    problems.push(`version must be ${CUSTOM_VERSION}.`);
  }
  if (!isValidIdentifier(custom.id)) {
    problems.push(
      `id "${custom.id}" must use lowercase letters, digits, and single ` +
        'hyphens.',
    );
  }
  if (custom.title.trim() === '') {
    problems.push('title must not be empty.');
  }
  if (custom.steps.length === 0) {
    problems.push('at least one step is required.');
  } else if (!custom.steps.some((step) => step.kind === 'subcalc')) {
    problems.push('at least one subcalculator step is required.');
  }

  for (const [index, step] of custom.steps.entries()) {
    const where = `step ${index + 1} ("${step.id}")`;
    if (!STEP_ID_PATTERN.test(step.id)) {
      problems.push(
        `${where}: id must start with a lowercase letter and contain only ` +
          'lowercase letters and digits.',
      );
    } else if (seenStepIds.has(step.id)) {
      problems.push(`${where}: duplicate step id.`);
    }
    seenStepIds.add(step.id);

    if (step.label.trim() === '') {
      problems.push(`${where}: label must not be empty.`);
    }
    problems.push(...stepProblems(where, step, catalog));
  }

  problems.push(...wireProblems(custom, catalog));
  return problems;
}

/** Validates a custom, raising when anything is wrong. */
export function validateCustom(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): void {
  const problems = customProblems(custom, catalog);
  if (problems.length > 0) {
    throw new CustomDefinitionError(
      `Invalid custom "${custom.id}":\n- ${problems.join('\n- ')}`,
    );
  }
}

function stepProblems(
  where: string,
  step: CustomStep,
  catalog: CalculatorCatalog,
): string[] {
  switch (step.kind) {
    case 'subcalc':
      return subcalcProblems(where, step, catalog);
    case 'variable':
      return variableStepProblems(where, step);
    case 'text':
      return textStepProblems(where, step);
  }
}

function subcalcProblems(
  where: string,
  step: SubcalcStep,
  catalog: CalculatorCatalog,
): string[] {
  const problems: string[] = [];
  const entry = catalog.get(step.calculatorId);
  if (entry === undefined) {
    problems.push(`${where}: unknown subcalculator "${step.calculatorId}".`);
    return problems;
  }
  if (!catalog.accepts(entry.definition)) {
    problems.push(
      `${where}: "${step.calculatorId}" cannot be embedded because it runs ` +
        'an asynchronous simulation.',
    );
  }

  const fieldsByName = new Map(
    entry.config.map((field) => [field.name, field]),
  );
  for (const [name, value] of Object.entries(step.config)) {
    const field = fieldsByName.get(name);
    if (field === undefined) {
      problems.push(`${where}: unknown setting "${name}".`);
      continue;
    }
    problems.push(
      ...configValueProblems(`${where} setting "${name}"`, field, value),
    );
  }

  const local = localVariables(step, catalog);
  const known = new Set(local.map((definition) => definition.name));
  for (const name of Object.keys(step.values)) {
    if (!known.has(name)) {
      problems.push(`${where}: unknown value "${name}".`);
    }
  }
  for (const definition of local) {
    if (!Object.hasOwn(step.values, definition.name)) {
      continue;
    }
    const value = step.values[definition.name] ?? null;
    problems.push(
      ...valueProblems(
        `${where} value "${definition.name}"`,
        definition,
        value,
        catalog,
      ),
    );
  }

  for (const name of Object.keys(step.variables)) {
    if (!known.has(name)) {
      problems.push(`${where}: unknown variable "${name}".`);
    }
  }

  return problems;
}

function variableStepProblems(
  where: string,
  step: Extract<CustomStep, { kind: 'variable' }>,
): string[] {
  const problems: string[] = [];
  if (tryDescribeUnit(step.unit) === null) {
    problems.push(`${where}: unknown unit "${step.unit}".`);
  }
  if (
    step.default !== undefined &&
    (typeof step.default !== 'number' || !Number.isFinite(step.default))
  ) {
    problems.push(`${where}: default must be a finite number.`);
  }
  return problems;
}

function textStepProblems(
  where: string,
  step: Extract<CustomStep, { kind: 'text' }>,
): string[] {
  const problems: string[] = [];
  if (step.default !== undefined && typeof step.default !== 'string') {
    problems.push(`${where}: default must be a string.`);
  }
  return problems;
}

/** Checks one stored config value against its field's kind and range. */
function configValueProblems(
  where: string,
  field: ConfigFieldDefinition,
  value: unknown,
): string[] {
  switch (field.kind) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return [`${where}: must be a finite number.`];
      }
      if (field.min !== undefined && value < field.min) {
        return [`${where}: must be at least ${field.min}.`];
      }
      if (field.max !== undefined && value > field.max) {
        return [`${where}: must be at most ${field.max}.`];
      }
      return [];
    case 'boolean':
      return typeof value === 'boolean'
        ? []
        : [`${where}: must be true or false.`];
    case 'string':
      return typeof value === 'string' ? [] : [`${where}: must be text.`];
    case 'select':
      return typeof value === 'string' && (field.options ?? []).includes(value)
        ? []
        : [`${where}: must be one of the listed options.`];
  }
}

/** Checks a stored subcalculator value against the variable it fills. */
function valueProblems(
  where: string,
  definition: VariableDefinition,
  value: CalcValue,
  catalog: CalculatorCatalog,
): string[] {
  if (value === null) {
    return [];
  }
  if (isTableSelectVariable(definition)) {
    if (typeof value !== 'string') {
      return [`${where}: must be a row key or null.`];
    }
    const table = catalog.getTable(definition.table);
    if (table === undefined) {
      return [`${where}: table "${definition.table}" is not available.`];
    }
    if (findRow(table, value) === undefined) {
      return [
        `${where}: row "${value}" is not in table "${definition.table}".`,
      ];
    }
    return [];
  }
  if (isTextVariable(definition)) {
    return typeof value === 'string' ? [] : [`${where}: must be text or null.`];
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return [`${where}: must be a finite number or null.`];
  }
  return [];
}

/**
 * Checks every wire. `takeFrom` is the single source of truth, so a target can
 * never have two sources; each wire must name an existing field and join two
 * fields of compatible kinds.
 */
function wireProblems(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): string[] {
  const problems: string[] = [];
  const options = new Map<string, WireOption>();
  for (const option of wireOptions(custom, catalog)) {
    options.set(option.path, option);
  }

  for (const step of custom.steps) {
    // A step whose subcalculator is missing yields no fields, so its wires are
    // skipped; the broken step itself is already reported.
    for (const field of stepFields(step, catalog)) {
      const source = field.wiring.takeFrom;
      if (source === undefined) {
        continue;
      }
      const selfPath = wirePath(step.id, field.name);
      problems.push(
        ...takeFromProblems(
          `wire into "${selfPath}"`,
          source,
          selfPath,
          field.definition,
          options,
        ),
      );
    }
  }
  return problems;
}

function takeFromProblems(
  where: string,
  sourcePath: string,
  selfPath: string,
  target: VariableDefinition,
  options: ReadonlyMap<string, WireOption>,
): string[] {
  if (sourcePath === '') {
    return [`${where}: take from must not be empty.`];
  }
  if (sourcePath === selfPath) {
    return [`${where}: a field cannot take its value from itself.`];
  }
  if (parseWirePath(sourcePath) === null) {
    return [`${where}: "${sourcePath}" is not a "step.variable" path.`];
  }
  const source = options.get(sourcePath);
  if (source === undefined) {
    return [`${where}: "${sourcePath}" does not name a field of this custom.`];
  }
  return wireMatchProblems(where, sourcePath, source.definition, target);
}

/** Explains why two fields cannot be joined by a wire, or nothing when they can. */
function wireMatchProblems(
  where: string,
  sourcePath: string,
  source: VariableDefinition,
  target: VariableDefinition,
): string[] {
  if (wireMatches(source, target)) {
    return [];
  }
  const sourceKind = wireKind(source);
  const targetKind = wireKind(target);
  if (sourceKind !== targetKind) {
    return [
      `${where}: "${sourcePath}" is ${sourceKind} but the field is ` +
        `${targetKind}.`,
    ];
  }
  if (sourceKind === 'tableSelect') {
    const sourceTable = (source as { table: string }).table;
    const targetTable = (target as { table: string }).table;
    return [
      `${where}: "${sourcePath}" selects from table "${sourceTable}" but ` +
        `the field selects from "${targetTable}".`,
    ];
  }
  return [
    `${where}: "${sourcePath}" measures a different kind than the field.`,
  ];
}

/**
 * Whether a value may flow from `source` into `target`: both must be the same
 * kind, two numbers must measure the same quantity, and two table selects must
 * read the same table.
 */
export function wireMatches(
  source: VariableDefinition,
  target: VariableDefinition,
): boolean {
  const sourceKind = wireKind(source);
  if (sourceKind !== wireKind(target)) {
    return false;
  }
  if (sourceKind === 'tableSelect') {
    return (
      (source as { table: string }).table ===
      (target as { table: string }).table
    );
  }
  if (sourceKind === 'number') {
    const sourceUnit = (source as { unit: UnitSymbol }).unit;
    const targetUnit = (target as { unit: UnitSymbol }).unit;
    return measureOf(sourceUnit) === measureOf(targetUnit);
  }
  return true;
}

function wireKind(
  definition: VariableDefinition,
): 'number' | 'text' | 'tableSelect' {
  if (isTableSelectVariable(definition)) {
    return 'tableSelect';
  }
  return isTextVariable(definition) ? 'text' : 'number';
}
