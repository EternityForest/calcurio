import type {
  CalcState,
  CalculatorDefinition,
  NumberVariableDefinition,
  TableSelectVariableDefinition,
  TextVariableDefinition,
  VariableBase,
  VariableDefinition,
} from '../framework/types.js';
import { isTableSelectVariable, isTextVariable } from '../framework/types.js';
import type { CalculatorCatalog } from './catalog.js';
import { localVariables } from './steps.js';
import { globalVariableName, parseWirePath, STEP_VALUE_NAME } from './types.js';
import type {
  CustomDefinition,
  CustomStep,
  StepVariable,
  SubcalcStep,
  TextStep,
  VariableStep,
} from './types.js';
import { validateCustom } from './validate.js';

/**
 * Turns a custom into an ordinary calculator definition. Every step's fields
 * become namespaced variables in step order, wires become `takeFrom` links
 * between them, and each subcalculator keeps its own settings and values. The
 * runtime then solves the whole thing with its usual refinement rounds, so a
 * wire that reaches an earlier step simply starts another round.
 *
 * A step's settings are fixed when the custom is built, so the compiled
 * definition exposes no config fields: the subcalculator's options belong to
 * the editor, not the running calculator.
 */
export function compileCustom(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): CalculatorDefinition {
  validateCustom(custom, catalog);
  return {
    id: custom.id,
    title: custom.title,
    ...(custom.description === undefined
      ? {}
      : { description: custom.description }),
    variables: buildCustomVariables(custom, catalog),
  };
}

/** A step field before its `takeFrom` is resolved against the emitted names. */
interface PendingVariable {
  readonly step: CustomStep;
  readonly wiring: StepVariable;
  readonly base: VariableDefinition;
}

/** Builds the whole variable list, dropping dangling wires. */
function buildCustomVariables(
  custom: CustomDefinition,
  catalog: CalculatorCatalog,
): readonly VariableDefinition[] {
  const pending: PendingVariable[] = [];
  for (const step of custom.steps) {
    if (step.kind === 'subcalc') {
      pending.push(...pendingSubcalcVariables(step, catalog));
    } else {
      pending.push(pendingStandaloneVariable(step));
    }
  }

  const emitted = new Set(pending.map((entry) => entry.base.name));
  return pending.map((entry) => applyTakeFrom(entry, emitted));
}

function pendingSubcalcVariables(
  step: SubcalcStep,
  catalog: CalculatorCatalog,
): PendingVariable[] {
  const local = localVariables(step, catalog);
  const localNames = local.map((definition) => definition.name);
  return local.map((definition) => ({
    step,
    wiring: step.variables[definition.name] ?? {},
    base: namespaceSubcalcVariable(step, definition, localNames),
  }));
}

function pendingStandaloneVariable(step: CustomStep): PendingVariable {
  if (step.kind === 'subcalc') {
    throw new Error('A subcalculator step is not a standalone variable.');
  }
  return {
    step,
    wiring: step.variable,
    base: namespaceStandaloneVariable(step),
  };
}

/** Namespaces a step's single value or text variable. */
function namespaceStandaloneVariable(
  step: VariableStep | TextStep,
): VariableDefinition {
  const name = globalVariableName(step.id, STEP_VALUE_NAME);
  if (step.kind === 'variable') {
    return {
      name,
      label: step.label,
      unit: step.unit,
      ...(step.default === undefined ? {} : { default: step.default }),
    };
  }
  return {
    name,
    label: step.label,
    ...(step.default === undefined ? {} : { default: step.default }),
  };
}

/** Namespaces one variable of a subcalculator step, translating its wiring. */
function namespaceSubcalcVariable(
  step: SubcalcStep,
  definition: VariableDefinition,
  localNames: readonly string[],
): VariableDefinition {
  const name = globalVariableName(step.id, definition.name);
  const label = `${step.label}: ${definition.label}`;
  const stored = step.values[definition.name] ?? null;

  if (isTableSelectVariable(definition)) {
    return {
      name,
      label,
      table: definition.table,
      ...(stored === undefined || typeof stored !== 'string'
        ? {}
        : { default: stored }),
      ...optionalBase(definition),
    } satisfies TableSelectVariableDefinition;
  }

  if (isTextVariable(definition)) {
    const compute = definition.computable;
    const textDefault =
      compute === undefined && typeof stored === 'string'
        ? { default: stored }
        : {};
    const computable =
      compute === undefined
        ? {}
        : {
            computable: (state: Readonly<CalcState>) =>
              compute(localState(state, step.id, localNames)),
          };
    return {
      name,
      label,
      ...optionalBase(definition),
      ...textDefault,
      ...computable,
    } satisfies TextVariableDefinition;
  }

  const compute = definition.computable;
  const numberDefault =
    compute === undefined &&
    definition.tableSelect === undefined &&
    typeof stored === 'number' &&
    Number.isFinite(stored)
      ? { default: stored }
      : {};
  const computable =
    compute === undefined
      ? {}
      : {
          computable: (state: Readonly<CalcState>) =>
            compute(localState(state, step.id, localNames)),
        };
  const table =
    definition.tableSelect === undefined
      ? {}
      : {
          tableSelect: globalVariableName(step.id, definition.tableSelect),
          ...(definition.tableField === undefined
            ? {}
            : { tableField: definition.tableField }),
        };
  const equivalent =
    definition.equivalent === undefined
      ? {}
      : { equivalent: namespaceEquivalent(step.id, definition.equivalent) };
  return {
    name,
    label,
    unit: definition.unit,
    ...(definition.defaultDisplayUnit === undefined
      ? {}
      : { defaultDisplayUnit: definition.defaultDisplayUnit }),
    ...(definition.unitOptions === undefined
      ? {}
      : { unitOptions: definition.unitOptions }),
    ...optionalBase(definition),
    ...numberDefault,
    ...computable,
    ...table,
    ...equivalent,
  } satisfies NumberVariableDefinition;
}

/** Copies the optional base fields a subcalculator variable may carry. */
function optionalBase(variable: VariableDefinition): Partial<VariableBase> {
  return {
    ...(variable.editable === undefined ? {} : { editable: variable.editable }),
    ...(variable.description === undefined
      ? {}
      : { description: variable.description }),
  };
}

/**
 * Rebuilds the subcalculator's local state from the namespaced one so its own
 * `computable` and `validate` functions keep working unchanged.
 */
function localState(
  state: Readonly<CalcState>,
  stepId: string,
  localNames: readonly string[],
): CalcState {
  const local: CalcState = {};
  for (const name of localNames) {
    local[name] = state[globalVariableName(stepId, name)] ?? null;
  }
  return local;
}

/** Rewrites a subcalculator's `equivalent` targets into namespaced names. */
function namespaceEquivalent(
  stepId: string,
  equivalent: Readonly<Record<string, (value: number) => number | string>>,
): Record<string, (value: number) => number | string> {
  const result: Record<string, (value: number) => number | string> = {};
  for (const [target, convert] of Object.entries(equivalent)) {
    result[globalVariableName(stepId, target)] = convert;
  }
  return result;
}

/** Adds the namespaced `takeFrom` and `hidden` to a base variable. */
function applyTakeFrom(
  entry: PendingVariable,
  emitted: ReadonlySet<string>,
): VariableDefinition {
  const takeFrom = resolveTakeFrom(entry.wiring.takeFrom, emitted);
  const hidden = entry.step.hidden === true || entry.wiring.hidden === true;
  return {
    ...entry.base,
    ...(takeFrom === undefined ? {} : { takeFrom }),
    ...(hidden ? { hidden: true } : {}),
  };
}

/** Maps a wire path to a namespaced name that exists in this build. */
function resolveTakeFrom(
  path: string | undefined,
  emitted: ReadonlySet<string>,
): string | undefined {
  if (path === undefined) {
    return undefined;
  }
  const parsed = parseWirePath(path);
  if (parsed === null) {
    return undefined;
  }
  const name = globalVariableName(parsed.stepId, parsed.variable);
  return emitted.has(name) ? name : undefined;
}
