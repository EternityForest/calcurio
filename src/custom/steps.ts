import type { CalculatorCatalog, CatalogEntry } from './catalog.js';
import type {
  CalcState,
  ConfigFieldDefinition,
  ConfigValue,
  CalculatorConfig,
  VariableDefinition,
} from '../framework/types.js';
import { globalVariableName, STEP_VALUE_NAME, wirePath } from './types.js';
import type {
  CustomDefinition,
  CustomStep,
  StepVariable,
  TextStep,
  VariableStep,
} from './types.js';

/** One field a step contributes, with its wiring and its local definition. */
export interface StepField {
  /** Local variable name, as used inside the step. */
  readonly name: string;
  readonly definition: VariableDefinition;
  readonly wiring: StepVariable;
}

/** A wire path the editor can offer, with the labels shown in a dropdown. */
export interface WireOption {
  readonly path: string;
  readonly stepId: string;
  readonly stepLabel: string;
  readonly variable: string;
  readonly variableLabel: string;
  readonly definition: VariableDefinition;
}

/** Builds the definition of a lone value or text step's single variable. */
export function standaloneDefinition(
  step: VariableStep | TextStep,
): VariableDefinition {
  if (step.kind === 'variable') {
    return {
      name: STEP_VALUE_NAME,
      label: step.label,
      unit: step.unit,
      ...(step.default === undefined ? {} : { default: step.default }),
    };
  }
  return {
    name: STEP_VALUE_NAME,
    label: step.label,
    ...(step.default === undefined ? {} : { default: step.default }),
  };
}

/** Fills a config's missing fields from the supplied defaults. */
export function resolveFieldConfig(
  fields: readonly ConfigFieldDefinition[],
  provided: CalculatorConfig,
): CalculatorConfig {
  const resolved: Record<string, ConfigValue> = {};
  for (const field of fields) {
    resolved[field.name] = provided[field.name] ?? field.default;
  }
  return resolved;
}

/** The config a custom starts with, taken from its field defaults. */
export function defaultCustomConfig(
  fields: readonly ConfigFieldDefinition[],
): CalculatorConfig {
  return resolveFieldConfig(fields, {});
}

/**
 * The variable list a step contributes, in local names, using the step's own
 * stored config. Only the editor needs this; compile builds the list from the
 * live parent config instead. A step whose subcalculator is missing yields no
 * fields, so callers that collect validation problems never throw here.
 */
export function localVariables(
  step: CustomStep,
  catalog: CalculatorCatalog,
): readonly VariableDefinition[] {
  if (step.kind === 'subcalc') {
    const entry = catalog.get(step.calculatorId);
    if (entry === undefined) {
      return [];
    }
    return entry.variables(resolveFieldConfig(entry.config, step.config));
  }
  return [standaloneDefinition(step)];
}

/** Every field a step contributes, paired with its wiring. */
export function stepFields(
  step: CustomStep,
  catalog: CalculatorCatalog,
): readonly StepField[] {
  return localVariables(step, catalog).map((definition) => ({
    name: definition.name,
    definition,
    wiring:
      step.kind === 'subcalc'
        ? (step.variables[definition.name] ?? {})
        : step.variable,
  }));
}

/**
 * The settings every subcalculator step exposes, namespaced so a custom with
 * several steps has no colliding field names. Their defaults come from the
 * step's stored config.
 */
export function customConfigFields(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): readonly ConfigFieldDefinition[] {
  const fields: ConfigFieldDefinition[] = [];
  for (const step of custom.steps) {
    if (step.kind !== 'subcalc') {
      continue;
    }
    const entry = catalog.requireEntry(step.calculatorId);
    for (const field of entry.config) {
      fields.push({
        name: globalVariableName(step.id, field.name),
        label: `${step.label}: ${field.label}`,
        kind: field.kind,
        default: step.config[field.name] ?? field.default,
        ...(field.description === undefined
          ? {}
          : { description: field.description }),
        ...(field.options === undefined ? {} : { options: field.options }),
        ...(field.min === undefined ? {} : { min: field.min }),
        ...(field.max === undefined ? {} : { max: field.max }),
      });
    }
  }
  return fields;
}

/**
 * Reads one subcalculator step's own config out of a resolved parent config.
 * The parent stores it under namespaced names.
 */
export function subcalcConfig(
  step: CustomStep,
  entry: CatalogEntry,
  config: CalculatorConfig,
): CalculatorConfig {
  const provided: Record<string, ConfigValue> = {};
  for (const field of entry.config) {
    const name = globalVariableName(step.id, field.name);
    const value = config[name];
    if (value !== undefined) {
      provided[field.name] = value;
    }
  }
  return resolveFieldConfig(entry.config, provided);
}

/** Every wire path defined by a custom, with the labels a dropdown shows. */
export function wireOptions(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): readonly WireOption[] {
  const options: WireOption[] = [];
  for (const step of custom.steps) {
    for (const field of stepFields(step, catalog)) {
      options.push({
        path: wirePath(step.id, field.name),
        stepId: step.id,
        stepLabel: step.label,
        variable: field.name,
        variableLabel: field.definition.label,
        definition: field.definition,
      });
    }
  }
  return options;
}

/**
 * Drops wiring that no longer names a field of the custom, and values or
 * per-variable settings for fields a subcalculator no longer has. Editing a
 * step can shrink its field list, so the editor runs this after every change,
 * keeping the custom valid instead of surfacing dangling-wire problems.
 *
 * A step whose subcalculator is missing is left untouched: the compiler
 * already reports the missing calculator, and pruning would discard the
 * values the user pinned before it disappeared.
 */
export function pruneCustom(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): CustomDefinition {
  const paths = new Set(
    wireOptions(custom, catalog).map((option) => option.path),
  );
  const steps = custom.steps.map((step) => pruneStep(step, catalog, paths));
  return { ...custom, steps };
}

function pruneStep(
  step: CustomStep,
  catalog: CalculatorCatalog,
  paths: ReadonlySet<string>,
): CustomStep {
  if (step.kind !== 'subcalc') {
    return { ...step, variable: pruneWiring(step.variable, paths) ?? {} };
  }
  if (catalog.get(step.calculatorId) === undefined) {
    return step;
  }
  const known = new Set(
    localVariables(step, catalog).map((definition) => definition.name),
  );
  const variables: Record<string, StepVariable> = {};
  for (const name of known) {
    const wiring = step.variables[name];
    if (wiring === undefined) {
      continue;
    }
    const pruned = pruneWiring(wiring, paths);
    if (pruned !== undefined) {
      variables[name] = pruned;
    }
  }
  return {
    ...step,
    values: pickKnown(step.values, known),
    variables,
  };
}

/** Keeps the wiring a compile would honour, or nothing when it is empty. */
function pruneWiring(
  wiring: StepVariable,
  paths: ReadonlySet<string>,
): StepVariable | undefined {
  const takeFrom =
    wiring.takeFrom !== undefined && paths.has(wiring.takeFrom)
      ? wiring.takeFrom
      : undefined;
  const pruned: StepVariable = {
    ...(takeFrom === undefined ? {} : { takeFrom }),
    ...(wiring.hidden === undefined ? {} : { hidden: wiring.hidden }),
  };
  return Object.keys(pruned).length === 0 ? undefined : pruned;
}

/** Keeps only the state entries whose names are still part of the step. */
function pickKnown(record: CalcState, known: ReadonlySet<string>): CalcState {
  const kept: CalcState = {};
  for (const [name, value] of Object.entries(record)) {
    if (known.has(name)) {
      kept[name] = value;
    }
  }
  return kept;
}
