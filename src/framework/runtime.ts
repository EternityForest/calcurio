import {
  CalculatorDefinitionError,
  errorMessage,
  StateLoadError,
} from './errors.js';
import { formatNumber, parseNumberText } from './format.js';
import { isMissing } from './missing.js';
import type {
  ComputeStateContext,
  OutputDisplayContent,
  OutputDisplayItem,
} from './output.js';
import {
  findColumn,
  findRow,
  isNumericColumn,
  numericCell,
  rowKey,
  rowLabel,
} from './tables.js';
import type {
  CalcState,
  CalcValue,
  CalculatorConfig,
  CalculatorDefinition,
  ConfigFieldDefinition,
  ConfigValue,
  NumberVariableDefinition,
  TableColumn,
  TableDefinition,
  TableResolver,
  TableSelectVariableDefinition,
  TextVariableDefinition,
  ValidationIssue,
  VariableDefinition,
} from './types.js';
import {
  isNumberVariable,
  isTableFieldVariable,
  isTableSelectVariable,
  isTextVariable,
} from './types.js';
import { isUnchanged } from './unchanged.js';
import { choicesForUnit, convertUnit, measureOf } from './units.js';
import type { UnitSymbol } from './units.js';
import {
  validateCalculatorDefinition,
  validateVariableList,
} from './validate.js';

/** Refinement rounds allowed before the runtime reports a cycle. */
export const MAX_REFINEMENT_ROUNDS = 5;

export const DEFAULT_RELATIVE_TOLERANCE = 1e-9;
export const DEFAULT_ABSOLUTE_TOLERANCE = 1e-9;

/** Result of committing text from a value field. */
export interface ValueUpdateResult {
  readonly ok: boolean;
  readonly message?: string;
}

/** One row offered by a table-select field. */
export interface TableChoice {
  readonly key: string;
  readonly label: string;
}

/** Everything needed to restore a calculator exactly. */
export interface CalculatorSnapshot {
  readonly state: CalcState;
  readonly units: Record<string, UnitSymbol>;
}

/** Called after every state or display-unit change. */
export type RuntimeListener = () => void;

/**
 * Evaluates one variable across hypothetical values of another without
 * touching live state. Created by `CalculatorRuntime.beginSample`.
 */
export interface RuntimeSampler {
  /** Variable being swept along the horizontal axis. */
  readonly axis: string;
  /** Computed variable being read for each axis value. */
  readonly target: string;
  /**
   * Value of the target, in base units, for one axis value (also base units),
   * or null when the target cannot be computed at that point.
   */
  sample(axisValue: number): number | null;
  /** Releases the working state. Later calls to `sample` throw. */
  stop(): void;
}

interface TableSelectBinding {
  readonly variable: TableSelectVariableDefinition;
  readonly table: TableDefinition;
}

interface TableFieldBinding {
  readonly variable: NumberVariableDefinition;
  readonly table: TableDefinition;
  readonly column: TableColumn;
  readonly columnUnit: UnitSymbol;
  readonly selectName: string;
}

/**
 * Compares two calculator values, treating very small numeric differences as
 * equal so decimal conversions and repeated formulas do not cause extra
 * compute rounds. Strings and nulls are equal only to themselves.
 */
export function nearlyEqual(
  left: CalcValue,
  right: CalcValue,
  relativeTolerance = DEFAULT_RELATIVE_TOLERANCE,
  absoluteTolerance = DEFAULT_ABSOLUTE_TOLERANCE,
): boolean {
  if (typeof left !== 'number' || typeof right !== 'number') {
    return left === right;
  }
  if (left === right) {
    return true;
  }
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return false;
  }
  const difference = Math.abs(left - right);
  if (difference <= absoluteTolerance) {
    return true;
  }
  return (
    difference <= relativeTolerance * Math.max(Math.abs(left), Math.abs(right))
  );
}

/**
 * Units a numeric variable offers, base unit first, then its preferred
 * display unit when it is not already listed, then the remaining options.
 */
function unitChoicesFor(variable: NumberVariableDefinition): UnitSymbol[] {
  const choices = choicesForUnit(variable.unit, variable.unitOptions);
  const preferred = variable.defaultDisplayUnit;
  if (preferred !== undefined && !choices.includes(preferred)) {
    choices.splice(1, 0, preferred);
  }
  return choices;
}

/** Unit a numeric field starts in: its preferred display unit, or the base. */
function initialDisplayUnit(variable: NumberVariableDefinition): UnitSymbol {
  return variable.defaultDisplayUnit ?? variable.unit;
}

/**
 * Owns the state of one calculator and the rules for recomputing it. No DOM
 * code lives here, so a calculator can be embedded in any UI.
 */
export class CalculatorRuntime {
  readonly definition: CalculatorDefinition;

  private readonly tables: TableResolver | undefined;
  private readonly variablesByName = new Map<string, VariableDefinition>();
  private readonly choicesByVariable = new Map<string, UnitSymbol[]>();
  private readonly displayUnits = new Map<string, UnitSymbol>();
  private readonly listeners = new Set<RuntimeListener>();
  private derivedNames: readonly string[] = [];
  private derivedNameSet: ReadonlySet<string> = new Set<string>();
  private readonly missingNeeds = new Map<string, readonly string[]>();
  private readonly tableSelects = new Map<string, TableSelectBinding>();
  private readonly tableFields = new Map<string, TableFieldBinding>();
  private readonly tableFieldsBySelect = new Map<string, TableFieldBinding[]>();
  private equivalentGroups: readonly (readonly string[])[] = [];

  /** Settings the variable list was built from. */
  private configValues: CalculatorConfig;
  /** Variables for the current config; may differ from the definition. */
  private variableList: readonly VariableDefinition[] = [];

  private values: CalcState = {};
  private pinnedNames = new Set<string>();
  private order: string[] = [];
  private lastTouchedName: string | null = null;
  private converged = true;
  private errorMessages: string[] = [];
  private issues: ValidationIssue[] = [];
  private runController: AbortController | null = null;
  private displayItems: OutputDisplayItem[] = [];

  constructor(
    definition: CalculatorDefinition,
    tables?: TableResolver,
    config?: CalculatorConfig,
  ) {
    validateCalculatorDefinition(definition);
    this.definition = definition;
    this.tables = tables;
    this.configValues = resolveConfig(definition, config);
    this.variableList = buildVariableList(definition, this.configValues);
    this.bindVariables();
    this.recompute();
  }

  /** Settings the variable list was built from. */
  get config(): CalculatorConfig {
    return { ...this.configValues };
  }

  /** Settings a caller may adjust before the variable list is rebuilt. */
  get configFields(): readonly ConfigFieldDefinition[] {
    return this.definition.config ?? [];
  }

  /**
   * Applies new settings and rebuilds the variable list. Values and display
   * units whose names survive the change are kept; the rest are recomputed.
   */
  setConfig(patch: CalculatorConfig): void {
    const next = resolveConfig(this.definition, {
      ...this.configValues,
      ...patch,
    });
    if (configEquals(next, this.configValues)) {
      return;
    }
    this.cancelComputeState();
    this.clearDisplay();
    this.configValues = next;
    this.variableList = buildVariableList(this.definition, next);
    this.bindVariables();
    this.recompute();
  }

  /**
   * Rebuilds the variable indexes, table bindings, and compute order from the
   * current variable list. Values for names that survive are preserved; stale
   * names are dropped.
   */
  private bindVariables(): void {
    const previousUnits = new Map(this.displayUnits);
    this.variablesByName.clear();
    this.choicesByVariable.clear();
    this.displayUnits.clear();
    this.tableSelects.clear();
    this.tableFields.clear();
    this.tableFieldsBySelect.clear();

    const nextValues: CalcState = {};
    for (const variable of this.variableList) {
      this.variablesByName.set(variable.name, variable);
      nextValues[variable.name] = Object.hasOwn(this.values, variable.name)
        ? (this.values[variable.name] ?? null)
        : this.initialValue(variable);
      if (isNumberVariable(variable)) {
        this.choicesByVariable.set(variable.name, unitChoicesFor(variable));
        this.displayUnits.set(
          variable.name,
          previousUnits.get(variable.name) ?? initialDisplayUnit(variable),
        );
      }
    }
    this.values = nextValues;

    for (const name of [...this.pinnedNames]) {
      if (!this.variablesByName.has(name)) {
        this.pinnedNames.delete(name);
      }
    }
    for (const name of [...this.missingNeeds.keys()]) {
      if (!this.variablesByName.has(name)) {
        this.missingNeeds.delete(name);
      }
    }

    this.bindTables(this.tables);
    this.applyTableDefaults();

    this.equivalentGroups = buildEquivalentGroups(this.variableList);
    this.derivedNames = this.variableList
      .filter((variable) => this.isDerived(variable))
      .map((variable) => variable.name);
    this.derivedNameSet = new Set(this.derivedNames);
    this.order = [...this.derivedNames];
  }

  /** A copy so callers cannot mutate internal state. */
  get state(): CalcState {
    return { ...this.values };
  }

  get errors(): readonly string[] {
    return [...this.errorMessages];
  }

  /** False when the last recompute could not reach a settled state. */
  get isConverged(): boolean {
    return this.converged;
  }

  get validationIssues(): readonly ValidationIssue[] {
    return [...this.issues];
  }

  /** True when the definition computes every derived value in one call. */
  get hasComputeState(): boolean {
    return this.definition.computeState !== undefined;
  }

  /** True while an async `computeState` run is in flight. */
  get isRunning(): boolean {
    return this.runController !== null;
  }

  /**
   * Content produced by the last `computeState` run. Items are discarded
   * before the next run begins.
   */
  get outputDisplay(): readonly OutputDisplayItem[] {
    return [...this.displayItems];
  }

  /**
   * True when a `computeState` run can start: the calculator must have a
   * `computeState` and every editable input must hold a value.
   */
  canRunComputeState(): boolean {
    if (!this.hasComputeState || this.isRunning) {
      return false;
    }
    return this.variableList.every((variable) => {
      if (this.isComputable(variable.name)) {
        return true;
      }
      return this.values[variable.name] !== null;
    });
  }

  /** Derived variables in the order they are solved. */
  get computeOrder(): readonly string[] {
    return [...this.order];
  }

  /** Variables for the current config, in declaration order. */
  get variables(): readonly VariableDefinition[] {
    return this.variableList;
  }

  variable(name: string): VariableDefinition {
    return this.requireVariable(name);
  }

  isTableSelect(name: string): boolean {
    return isTableSelectVariable(this.requireVariable(name));
  }

  /** Table behind a table-select variable, or null for numeric variables. */
  tableFor(name: string): TableDefinition | null {
    return this.tableSelects.get(name)?.table ?? null;
  }

  /** Rows offered by a table-select field. */
  tableChoices(name: string): readonly TableChoice[] {
    const binding = this.requireTableSelect(name);
    const choices: TableChoice[] = [];
    for (const row of binding.table.rows) {
      const key = rowKey(binding.table, row);
      if (key === null) {
        continue;
      }
      choices.push({ key, label: rowLabel(binding.table, row) });
    }
    return choices;
  }

  /** Selected row key, or null when no row is selected. */
  selectedKey(name: string): string | null {
    this.requireTableSelect(name);
    const value = this.values[name];
    return typeof value === 'string' ? value : null;
  }

  isComputable(name: string): boolean {
    return this.derivedNameSet.has(name);
  }

  /** True when the variable takes its value from another over a wire. */
  isWired(name: string): boolean {
    return this.requireVariable(name).takeFrom !== undefined;
  }

  /** Label of the variable this one takes its value from, or null. */
  sourceLabel(name: string): string | null {
    const source = this.requireVariable(name).takeFrom;
    if (source === undefined) {
      return null;
    }
    return this.variablesByName.get(source)?.label ?? source;
  }

  /**
   * Names of the numeric variables that can be plotted against `axis`: every
   * other computable variable, excluding text and table selects which have no
   * number.
   */
  graphTargets(axis: string): readonly string[] {
    this.requireVariable(axis);
    return this.variableList
      .filter(
        (variable) =>
          variable.name !== axis &&
          isNumberVariable(variable) &&
          this.isComputable(variable.name),
      )
      .map((variable) => variable.name);
  }

  isEditable(name: string): boolean {
    const variable = this.requireVariable(name);
    if (variable.takeFrom !== undefined) {
      return false;
    }
    return variable.editable !== false;
  }

  isPinned(name: string): boolean {
    this.requireVariable(name);
    return this.pinnedNames.has(name);
  }

  isMissing(name: string): boolean {
    this.requireVariable(name);
    return this.missingNeeds.has(name);
  }

  /** Names reported by the last `missing()` result for this variable. */
  missingNeedsFor(name: string): readonly string[] {
    this.requireVariable(name);
    return [...(this.missingNeeds.get(name) ?? [])];
  }

  /** Human readable explanation of what a variable still needs. */
  missingLabel(name: string): string {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      return this.values[name] === null ? 'Select a row' : '';
    }
    const needs = this.missingNeedsFor(name);
    if (needs.length === 0) {
      return '';
    }
    const labels = needs.map(
      (dependency) => this.variablesByName.get(dependency)?.label ?? dependency,
    );
    return `Needs ${joinWithAnd(labels)}`;
  }

  /** Display unit for a numeric variable; null for text and table selects. */
  displayUnitFor(name: string): UnitSymbol | null {
    const variable = this.requireVariable(name);
    if (!isNumberVariable(variable)) {
      return null;
    }
    return this.displayUnits.get(name) ?? variable.unit;
  }

  unitChoices(name: string): readonly UnitSymbol[] {
    const variable = this.requireVariable(name);
    if (!isNumberVariable(variable)) {
      return [];
    }
    return [...(this.choicesByVariable.get(name) ?? [])];
  }

  /** Value converted to its display unit and formatted for the field. */
  formattedValue(name: string): string {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      const binding = this.requireTableSelect(name);
      const selected = this.selectedKey(name);
      if (selected === null) {
        return '';
      }
      const row = findRow(binding.table, selected);
      return row === undefined ? '' : rowLabel(binding.table, row);
    }

    const value = this.values[name];
    if (isTextVariable(variable)) {
      return typeof value === 'string' ? value : '';
    }
    if (typeof value !== 'number') {
      return '';
    }
    const baseUnit = variable.unit;
    const displayUnit = this.displayUnitFor(name) ?? baseUnit;
    return formatNumber(convertUnit(value, baseUnit, displayUnit));
  }

  issuesFor(name: string): readonly ValidationIssue[] {
    this.requireVariable(name);
    return this.issues.filter((issue) => issue.variable === name);
  }

  /**
   * Commits text from a value field. The value is converted from the display
   * unit into the variable's base unit, pinned, and the rest is recomputed.
   */
  setDisplayText(name: string, text: string): ValueUpdateResult {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      return {
        ok: false,
        message: `${variable.label} is chosen from the table list.`,
      };
    }
    if (!this.isEditable(name)) {
      return { ok: false, message: `${variable.label} is read-only.` };
    }

    if (isTextVariable(variable)) {
      this.setValue(name, text);
      return { ok: true };
    }

    let parsed: number | null;
    try {
      parsed = parseNumberText(text);
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }

    const displayUnit = this.displayUnitFor(name) ?? variable.unit;
    const baseValue =
      parsed === null ? null : convertUnit(parsed, displayUnit, variable.unit);
    this.prepareTableFieldEdit(name, baseValue);
    this.prepareEquivalentEdit(name, baseValue);
    this.setValue(name, baseValue);
    return { ok: true };
  }

  /**
   * Chooses a row for a table-select field. Referencing fields are unpinned so
   * they refresh from the new selection. Passing null or an empty string
   * clears the selection.
   */
  setSelection(name: string, key: string | null): void {
    const binding = this.requireTableSelect(name);
    if (!this.isEditable(name)) {
      throw new Error(`${binding.variable.label} is read-only.`);
    }
    const normalized = key === '' ? null : key;
    const rowMissing =
      normalized !== null && findRow(binding.table, normalized) === undefined;
    if (rowMissing) {
      throw new RangeError(
        `Row "${normalized}" is not in table "${binding.table.id}".`,
      );
    }

    for (const field of this.tableFieldsBySelect.get(name) ?? []) {
      this.pinnedNames.delete(field.variable.name);
    }
    this.setValue(name, normalized);
  }

  /** Changes display units only; stored values keep their base units. */
  setDisplayUnit(name: string, unit: UnitSymbol): void {
    const variable = this.requireVariable(name);
    if (!isNumberVariable(variable)) {
      throw new RangeError(`${variable.label} does not have a display unit.`);
    }
    const choices = this.choicesByVariable.get(name) ?? [];
    if (!choices.includes(unit)) {
      throw new RangeError(
        `Unit "${unit}" is not available for ${variable.label}.`,
      );
    }
    if (measureOf(unit) !== measureOf(variable.unit)) {
      throw new RangeError(
        `Unit "${unit}" is not compatible with ${variable.label}.`,
      );
    }
    this.displayUnits.set(name, unit);
    this.emit();
  }

  /**
   * Solves for one variable. It moves to the front of the compute order; every
   * other populated value is held fixed so the answer is derived from them.
   */
  calculate(name: string): void {
    const variable = this.requireVariable(name);
    if (!this.isComputable(name)) {
      throw new Error(`${variable.label} is not computable.`);
    }

    this.order = [name, ...this.order.filter((entry) => entry !== name)];
    this.lastTouchedName = name;
    const pinned = new Set<string>();
    for (const [otherName, value] of Object.entries(this.values)) {
      if (otherName !== name && value !== null) {
        pinned.add(otherName);
      }
    }
    this.pinnedNames = pinned;
    this.recompute();
  }

  /**
   * Runs the definition's `computeState` against a private, frozen copy of the
   * current values and merges whatever it returns. Derived values are never
   * recomputed from edits in this mode; the state only changes when this method
   * runs. Rejects a concurrent call. Cancelling resolves without an error.
   */
  async computeState(): Promise<void> {
    const compute = this.definition.computeState;
    if (compute === undefined) {
      throw new Error(`${this.definition.title} has no computeState.`);
    }
    if (this.runController !== null) {
      throw new Error('A calculation is already running.');
    }

    const controller = new AbortController();
    this.runController = controller;
    this.clearDisplay();
    this.errorMessages = [];
    this.emit();

    const snapshot = Object.freeze({ ...this.values });
    const context: ComputeStateContext = {
      signal: controller.signal,
      display: (content, dispose) => {
        this.addDisplayItem(controller, content, dispose);
      },
    };

    try {
      const result = await compute(snapshot, context);
      if (!controller.signal.aborted) {
        this.applyComputedState(result);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        this.addError(
          `${this.definition.title} failed: ${errorMessage(error)}`,
        );
      }
    } finally {
      if (this.runController === controller) {
        this.runController = null;
      }
      this.emit();
    }
  }

  /** Cancels the in-flight `computeState` run, if any. */
  cancelComputeState(): void {
    this.runController?.abort();
  }

  /**
   * Recomputes the state in three phases. First every table select and table
   * column is refreshed from the values already present, then equivalent
   * variables fill one another from a single known member, and finally the
   * computable variables are solved. Within the last phase a change to an
   * input starts another pass; more than `MAX_REFINEMENT_ROUNDS` passes raises
   * a visible error. Table lookups and equivalents are settled once and never
   * take part in the refinement rounds.
   */
  recompute(): void {
    this.errorMessages = [];
    this.missingNeeds.clear();

    this.applyTableLookups();
    this.applyEquivalents();

    let settled = false;
    for (let round = 0; round < MAX_REFINEMENT_ROUNDS; round += 1) {
      let restart = false;
      for (const name of this.order) {
        if (this.pinnedNames.has(name) || !this.isRecalcVariable(name)) {
          continue;
        }
        if (this.computeVariable(name)) {
          restart = true;
        }
        /*
         * Move wired values to their destinations right after each solve, so
         * a value exported by an earlier step is visible to the later steps
         * that take from it within the same round. A change still starts
         * another round, which is what restarts a take-from that reaches an
         * earlier step.
         */
        if (this.applyWires()) {
          restart = true;
        }
      }
      if (this.applyWires()) {
        restart = true;
      }
      if (!restart) {
        settled = true;
        break;
      }
    }

    this.converged = settled;
    if (!settled) {
      this.addError(
        `Calculation did not settle after ${MAX_REFINEMENT_ROUNDS} rounds. ` +
          'Choose one value to calculate and try again.',
      );
    }

    this.runValidators();
    this.reportConflictingValues();
    this.emit();
  }

  /** Clears every value, display unit, and compute-order change. */
  reset(): void {
    this.cancelComputeState();
    this.clearDisplay();
    for (const variable of this.variableList) {
      this.values[variable.name] = this.initialValue(variable);
      if (isNumberVariable(variable)) {
        this.displayUnits.set(variable.name, initialDisplayUnit(variable));
      }
    }
    this.pinnedNames = new Set();
    this.applyTableDefaults();
    this.order = [...this.derivedNames];
    this.lastTouchedName = null;
    this.recompute();
  }

  /**
   * Applies a saved state. Every populated value is pinned, so loading a
   * bookmark never silently rewrites the values the user saved.
   */
  loadState(
    state: CalcState,
    units?: Readonly<Record<string, UnitSymbol>>,
  ): void {
    this.assertValidState(state);
    this.cancelComputeState();
    this.clearDisplay();

    const displayUnits = new Map<string, UnitSymbol>();
    for (const variable of this.variableList) {
      if (isNumberVariable(variable)) {
        displayUnits.set(variable.name, initialDisplayUnit(variable));
      }
    }
    if (units !== undefined) {
      for (const [name, unit] of Object.entries(units)) {
        const variable = this.variablesByName.get(name);
        if (variable === undefined) {
          throw new StateLoadError(
            `Saved state has unknown variable "${name}".`,
          );
        }
        if (!isNumberVariable(variable)) {
          throw new StateLoadError(
            `Saved unit for "${name}" is not valid for this variable.`,
          );
        }
        if (measureOf(unit) !== measureOf(variable.unit)) {
          throw new StateLoadError(
            `Saved unit "${unit}" does not match ${variable.label}.`,
          );
        }
        displayUnits.set(name, unit);
      }
    }

    this.values = { ...state };
    this.displayUnits.clear();
    for (const [name, unit] of displayUnits) {
      this.displayUnits.set(name, unit);
    }
    this.pinnedNames = new Set(
      Object.entries(this.values)
        .filter(([, value]) => value !== null)
        .map(([name]) => name),
    );
    this.order = [...this.derivedNames];
    this.lastTouchedName = null;
    this.recompute();
  }

  /** Captures the current values and display units for bookmarking. */
  snapshot(): CalculatorSnapshot {
    return {
      state: { ...this.values },
      units: Object.fromEntries(this.displayUnits),
    };
  }

  /**
   * Starts a sweep that reads `target` while `axis` takes hypothetical values,
   * holding every other value at its current amount. Sampling runs on an
   * isolated copy, so the live state is never disturbed. Call `stop` on the
   * returned sampler when finished.
   */
  beginSample(axis: string, target: string): RuntimeSampler {
    this.requireVariable(axis);
    const targetVariable = this.requireVariable(target);
    if (axis === target) {
      throw new RangeError('A plot needs two different variables.');
    }
    if (!this.isComputable(target)) {
      throw new RangeError(`${targetVariable.label} is not computable.`);
    }

    const probe = new CalculatorRuntime(this.definition, this.tables);
    probe.values = { ...this.values };
    probe.pinnedNames = new Set(this.pinnedNames);
    probe.pinnedNames.add(axis);
    probe.pinnedNames.delete(target);
    probe.order = [...this.order];
    probe.missingNeeds.clear();
    probe.errorMessages = [];
    probe.issues = [];
    probe.converged = true;

    let stopped = false;
    return {
      axis,
      target,
      sample(axisValue: number): number | null {
        if (stopped) {
          throw new Error('This plot session has already stopped.');
        }
        if (!Number.isFinite(axisValue)) {
          return null;
        }
        probe.values[axis] = axisValue;
        probe.pinnedNames.add(axis);
        probe.missingNeeds.delete(axis);
        probe.recompute();
        const value = probe.values[target];
        return typeof value === 'number' ? value : null;
      },
      stop(): void {
        stopped = true;
      },
    };
  }

  /** Subscribes to state changes. Returns an unsubscribe function. */
  subscribe(listener: RuntimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private bindTables(tables: TableResolver | undefined): void {
    for (const variable of this.variableList) {
      if (!isTableSelectVariable(variable)) {
        continue;
      }
      const table = this.resolveTable(variable, tables);
      this.tableSelects.set(variable.name, { variable, table });
    }

    for (const variable of this.variableList) {
      if (!isNumberVariable(variable) || !isTableFieldVariable(variable)) {
        continue;
      }
      const selectName = variable.tableSelect;
      const fieldKey = variable.tableField;
      if (selectName === undefined || fieldKey === undefined) {
        throw new CalculatorDefinitionError(
          `${variable.label} must name both a table select and a column.`,
        );
      }
      const select = this.tableSelects.get(selectName);
      if (select === undefined) {
        throw new CalculatorDefinitionError(
          `${variable.label} references unknown table select "${selectName}".`,
        );
      }
      const column = findColumn(select.table, fieldKey);
      if (column === undefined) {
        throw new CalculatorDefinitionError(
          `${variable.label} references unknown column "${fieldKey}" in ` +
            `table "${select.table.id}".`,
        );
      }
      if (!isNumericColumn(column) || column.unit === undefined) {
        throw new CalculatorDefinitionError(
          `${variable.label} must reference a numeric column; ` +
            `"${fieldKey}" is text.`,
        );
      }
      if (measureOf(column.unit) !== measureOf(variable.unit)) {
        throw new CalculatorDefinitionError(
          `${variable.label} uses "${variable.unit}" but column ` +
            `"${fieldKey}" uses "${column.unit}".`,
        );
      }

      const binding: TableFieldBinding = {
        variable,
        table: select.table,
        column,
        columnUnit: column.unit,
        selectName,
      };
      this.tableFields.set(variable.name, binding);
      const siblings = this.tableFieldsBySelect.get(selectName) ?? [];
      siblings.push(binding);
      this.tableFieldsBySelect.set(selectName, siblings);
    }
  }

  /**
   * Applies the declared default of every standalone table select. A select
   * that is driven by referencing table fields derives its own row, so only a
   * select without fields honours a default. The chosen row is pinned, because
   * the recompute pass has nothing to derive it from and would otherwise clear
   * it. A default that names no row is ignored.
   */
  private applyTableDefaults(): void {
    for (const variable of this.variableList) {
      if (!isTableSelectVariable(variable)) {
        continue;
      }
      const key = variable.default;
      if (key === undefined) {
        continue;
      }
      if ((this.tableFieldsBySelect.get(variable.name) ?? []).length > 0) {
        continue;
      }
      const binding = this.tableSelects.get(variable.name);
      if (binding === undefined || findRow(binding.table, key) === undefined) {
        continue;
      }
      this.values[variable.name] = key;
      this.pinnedNames.add(variable.name);
    }
  }

  private resolveTable(
    variable: TableSelectVariableDefinition,
    tables: TableResolver | undefined,
  ): TableDefinition {
    if (tables === undefined) {
      throw new CalculatorDefinitionError(
        `${variable.label} references table "${variable.table}", but no ` +
          'table registry was supplied to the runtime.',
      );
    }
    const table = tables.getTable(variable.table);
    if (table === undefined) {
      throw new CalculatorDefinitionError(
        `${variable.label} references unknown table "${variable.table}".`,
      );
    }
    return table;
  }

  private isDerived(variable: VariableDefinition): boolean {
    if (variable.takeFrom !== undefined) {
      return true;
    }
    if (isTableSelectVariable(variable)) {
      return true;
    }
    if (variable.computable !== undefined) {
      return true;
    }
    return isNumberVariable(variable) && isTableFieldVariable(variable);
  }

  /**
   * Starting value for a variable. Plain numeric variables use their default
   * here; table selects and other derived variables start empty, and
   * `applyTableDefaults` later layers a standalone select's default on top.
   */
  private initialValue(variable: VariableDefinition): CalcValue {
    if (variable.takeFrom !== undefined) {
      // A wired variable takes its value from its source, not a default.
      return null;
    }
    if (isTableSelectVariable(variable)) {
      return null;
    }
    if (variable.computable !== undefined) {
      return null;
    }
    if (isNumberVariable(variable) && isTableFieldVariable(variable)) {
      return null;
    }
    return variable.default ?? null;
  }

  private computeVariable(name: string): boolean {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      return this.computeTableSelect(variable);
    }
    if (isTextVariable(variable)) {
      return this.computeText(name, variable);
    }
    const field = this.tableFields.get(name);
    if (field !== undefined) {
      return this.computeTableField(name, field);
    }
    return this.computeNumber(name, variable);
  }

  /** True for a table select or a variable that reads one of its columns. */
  private isTableDerived(name: string): boolean {
    return (
      isTableSelectVariable(this.requireVariable(name)) ||
      this.tableFields.has(name)
    );
  }

  /** True for a variable solved from the state by a `computable` function. */
  private isRecalcVariable(name: string): boolean {
    const variable = this.requireVariable(name);
    if (variable.takeFrom !== undefined) {
      // A wired variable is filled by `applyWires`, not by its computable.
      return false;
    }
    if (isTableSelectVariable(variable)) {
      return false;
    }
    return (
      this.tableFields.get(name) === undefined &&
      variable.computable !== undefined
    );
  }

  /**
   * Settles the table selects and their columns before anything else. A select
   * only moves when exactly one row matches its populated columns, so a partial
   * or ambiguous set leaves it alone. Runs to a fixed point because a select
   * derives from its columns and the columns derive back from the select.
   */
  private applyTableLookups(): void {
    for (let round = 0; round < MAX_REFINEMENT_ROUNDS; round += 1) {
      let restart = false;
      for (const name of this.order) {
        if (this.pinnedNames.has(name) || !this.isTableDerived(name)) {
          continue;
        }
        if (this.computeVariable(name)) {
          restart = true;
        }
      }
      if (!restart) {
        break;
      }
    }
  }

  /**
   * Fills variables that describe the same quantity as one another from
   * whichever single member of their equivalent group already holds a value.
   * Two or more known members make the group ambiguous, so it is left alone.
   * A one-shot conversion, these values never drive a refinement round.
   */
  private applyEquivalents(): void {
    for (const group of this.equivalentGroups) {
      let source: NumberVariableDefinition | undefined;
      let knownCount = 0;
      for (const name of group) {
        const value = this.values[name];
        const variable = this.variablesByName.get(name);
        if (
          typeof value === 'number' &&
          Number.isFinite(value) &&
          variable !== undefined &&
          isNumberVariable(variable)
        ) {
          knownCount += 1;
          source = variable;
        }
      }
      if (knownCount !== 1 || source === undefined) {
        continue;
      }
      const value = this.values[source.name];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        continue;
      }
      for (const [targetName, convert] of Object.entries(
        source.equivalent ?? {},
      )) {
        if (targetName === source.name || this.pinnedNames.has(targetName)) {
          continue;
        }
        const target = this.variablesByName.get(targetName);
        if (target === undefined) {
          continue;
        }
        let next: number;
        try {
          next = convert(value);
        } catch (error) {
          this.addError(
            `${source.label} could not convert to ${target.label}: ` +
              `${errorMessage(error)}`,
          );
          continue;
        }
        if (!Number.isFinite(next)) {
          continue;
        }
        const current = this.values[targetName] ?? null;
        if (typeof current === 'number' && nearlyEqual(current, next)) {
          continue;
        }
        this.values[targetName] = next;
        this.missingNeeds.delete(targetName);
      }
    }
  }

  /**
   * Moves every wired value from its source to its destination, converting
   * units for numbers. Returns true when any value changed, which starts
   * another refinement round. `takeFrom` names the source; the source may
   * carry the matching `sendTo`, but only `takeFrom` drives the transfer.
   */
  private applyWires(): boolean {
    let changed = false;
    for (const variable of this.variableList) {
      const sourceName = variable.takeFrom;
      if (sourceName === undefined) {
        continue;
      }
      const source = this.variablesByName.get(sourceName);
      if (source === undefined) {
        continue;
      }
      const raw = this.values[sourceName] ?? null;
      const next = wireValue(source, raw, variable);
      const current = this.values[variable.name] ?? null;
      if (nearlyEqual(current, next)) {
        continue;
      }
      this.values[variable.name] = next;
      this.missingNeeds.delete(variable.name);
      changed = true;
    }
    return changed;
  }

  private computeNumber(
    name: string,
    variable: NumberVariableDefinition,
  ): boolean {
    const computable = variable.computable;
    if (computable === undefined) {
      return false;
    }

    let result: unknown;
    try {
      result = computable(Object.freeze({ ...this.values }));
    } catch (error) {
      this.addError(`${variable.label} failed: ${errorMessage(error)}`);
      return false;
    }

    if (isUnchanged(result)) {
      return false;
    }

    let next: CalcValue;
    if (isMissing(result)) {
      this.missingNeeds.set(name, [...result.needs]);
      next = null;
    } else if (typeof result !== 'number' || !Number.isFinite(result)) {
      this.addError(`${variable.label} produced a non-finite value.`);
      return false;
    } else {
      next = result;
    }

    const current = this.values[name] ?? null;
    if (nearlyEqual(current, next)) {
      return false;
    }
    this.values[name] = next;
    return variable.input !== false;
  }

  private computeText(name: string, variable: TextVariableDefinition): boolean {
    const computable = variable.computable;
    if (computable === undefined) {
      return false;
    }

    let result: unknown;
    try {
      result = computable(Object.freeze({ ...this.values }));
    } catch (error) {
      this.addError(`${variable.label} failed: ${errorMessage(error)}`);
      return false;
    }

    if (isUnchanged(result)) {
      return false;
    }

    let next: CalcValue;
    if (isMissing(result)) {
      this.missingNeeds.set(name, [...result.needs]);
      next = null;
    } else if (typeof result !== 'string') {
      this.addError(`${variable.label} produced a non-text value.`);
      return false;
    } else {
      next = result;
    }

    const current = this.values[name] ?? null;
    if (current === next) {
      return false;
    }
    this.values[name] = next;
    return variable.input !== false;
  }

  private computeTableSelect(variable: TableSelectVariableDefinition): boolean {
    const binding = this.tableSelects.get(variable.name);
    if (binding === undefined) {
      return false;
    }
    const next = this.deriveSelectionKey(binding);
    const current = this.values[variable.name] ?? null;
    if (current === next) {
      return false;
    }
    this.values[variable.name] = next;
    this.missingNeeds.delete(variable.name);
    return variable.input !== false;
  }

  private computeTableField(name: string, binding: TableFieldBinding): boolean {
    const next = this.deriveTableFieldValue(binding);
    if (next === null) {
      return false;
    }
    const current = this.values[name] ?? null;
    if (nearlyEqual(current, next)) {
      return false;
    }
    this.values[name] = next;
    this.missingNeeds.delete(name);
    return binding.variable.input !== false;
  }

  /**
   * Brute-force search for the single row matching every referencing field
   * that currently has a value. No matches or several matches select nothing.
   */
  private deriveSelectionKey(binding: TableSelectBinding): string | null {
    const constraints = (
      this.tableFieldsBySelect.get(binding.variable.name) ?? []
    )
      .map((field) => ({
        field,
        value: this.values[field.variable.name],
      }))
      .filter(
        (entry): entry is { field: TableFieldBinding; value: number } =>
          typeof entry.value === 'number' && Number.isFinite(entry.value),
      );
    if (constraints.length === 0) {
      return null;
    }

    const matches = binding.table.rows.filter((row) =>
      constraints.every(({ field, value }) => {
        const cell = numericCell(row[field.column.key]);
        if (cell === null) {
          return false;
        }
        const converted = convertUnit(
          value,
          field.variable.unit,
          field.columnUnit,
        );
        return nearlyEqual(cell, converted);
      }),
    );
    if (matches.length !== 1) {
      return null;
    }
    const [match] = matches;
    return match === undefined ? null : rowKey(binding.table, match);
  }

  private deriveTableFieldValue(binding: TableFieldBinding): number | null {
    const selected = this.tableSelects.get(binding.selectName);
    if (selected === undefined) {
      return null;
    }
    const key = this.selectedKey(binding.selectName);
    if (key === null) {
      return null;
    }
    const row = findRow(selected.table, key);
    if (row === undefined) {
      this.addError(
        `Row "${key}" is missing from table "${selected.table.id}".`,
      );
      return null;
    }
    const cell = numericCell(row[binding.column.key]);
    if (cell === null) {
      this.addError(`${binding.column.label} is empty for row "${key}".`);
      return null;
    }
    return convertUnit(cell, binding.columnUnit, binding.variable.unit);
  }

  private setValue(name: string, value: CalcValue): void {
    this.values[name] = value;
    this.pinnedNames.add(name);
    this.missingNeeds.delete(name);
    this.lastTouchedName = name;
    if (value !== null) {
      this.resolvePinnedDeadlock();
    }
    this.recompute();
  }

  /**
   * A user edit of one table column makes the other derived columns stale.
   * Clear them and unpin the select so the edited value alone decides which
   * row matches.
   */
  private prepareTableFieldEdit(name: string, value: number | null): void {
    const binding = this.tableFields.get(name);
    if (binding === undefined) {
      return;
    }
    this.pinnedNames.delete(binding.selectName);
    if (value === null) {
      return;
    }
    for (const sibling of this.tableFieldsBySelect.get(binding.selectName) ??
      []) {
      if (sibling.variable.name === name) {
        continue;
      }
      this.values[sibling.variable.name] = null;
      this.pinnedNames.delete(sibling.variable.name);
      this.missingNeeds.delete(sibling.variable.name);
    }
  }

  /**
   * A user edit of one equivalent variable makes the rest of its group stale.
   * Clear and unpin the siblings so the edited value is the only known member
   * and the others refill from it during the next recompute.
   */
  private prepareEquivalentEdit(name: string, value: number | null): void {
    if (value === null) {
      return;
    }
    const variable = this.variablesByName.get(name);
    if (variable === undefined || !isNumberVariable(variable)) {
      return;
    }
    if (variable.equivalent === undefined) {
      return;
    }
    const group = this.equivalentGroups.find((members) =>
      members.includes(name),
    );
    if (group === undefined) {
      return;
    }
    for (const member of group) {
      if (member === name) {
        continue;
      }
      this.values[member] = null;
      this.pinnedNames.delete(member);
      this.missingNeeds.delete(member);
    }
  }

  /**
   * If every derived value is pinned, a change would leave the state
   * untouched. Unpin one value so the runtime recomputes it from the user's
   * inputs instead of displaying contradictory values.
   *
   * The candidate is the first variable in compute order that can actually be
   * computed from the current values. Falling back to a variable with missing
   * dependencies would clear it and leave the state incomplete, which looks
   * like a valid calculation but is not. If nothing is computable, the most
   * recently used variable is used instead.
   *
   * When the touched variable is the only computable one there is nothing to
   * solve, so the typed value is kept as is instead of being recomputed from
   * sources that may not exist.
   */
  private resolvePinnedDeadlock(): void {
    if (this.hasComputeState) {
      return;
    }
    const allPinned = this.derivedNames.every((name) =>
      this.pinnedNames.has(name),
    );
    if (!allPinned) {
      return;
    }
    const candidates = this.order.filter(
      (name) => name !== this.lastTouchedName,
    );
    if (candidates.length === 0) {
      return;
    }
    const candidate =
      candidates.find((name) => this.canCompute(name)) ?? candidates[0];
    if (candidate !== undefined) {
      this.pinnedNames.delete(candidate);
    }
  }

  /**
   * True when the variable can produce a value from the current state. Used to
   * avoid unpinning a variable that would only report missing dependencies.
   */
  private canCompute(name: string): boolean {
    const variable = this.requireVariable(name);
    if (variable.takeFrom !== undefined) {
      return false;
    }
    if (isTableSelectVariable(variable)) {
      const binding = this.tableSelects.get(name);
      return binding !== undefined && this.deriveSelectionKey(binding) !== null;
    }
    if (isTextVariable(variable)) {
      const compute = variable.computable;
      if (compute === undefined) {
        return false;
      }
      try {
        const result: unknown = compute(Object.freeze({ ...this.values }));
        return (
          !isUnchanged(result) && !isMissing(result) && typeof result === 'string'
        );
      } catch {
        return false;
      }
    }
    const field = this.tableFields.get(name);
    if (field !== undefined) {
      return this.deriveTableFieldValue(field) !== null;
    }
    const computable = variable.computable;
    if (computable === undefined) {
      return false;
    }
    try {
      const result: unknown = computable(Object.freeze({ ...this.values }));
      if (isUnchanged(result) || isMissing(result)) {
        return false;
      }
      return typeof result === 'number' && Number.isFinite(result);
    } catch {
      return false;
    }
  }

  /**
   * A pinned value must agree with what the rest of the state implies. A
   * contradictory set (a hand-edited bookmark or a stale table row) would
   * otherwise look like a valid result because nothing is left to compute.
   */
  private reportConflictingValues(): void {
    const conflicting: string[] = [];
    for (const name of this.derivedNames) {
      if (!this.pinnedNames.has(name)) {
        continue;
      }
      const variable = this.requireVariable(name);
      const current = this.values[name] ?? null;
      if (current === null) {
        continue;
      }
      if (this.valueDisagrees(name, variable, current)) {
        conflicting.push(variable.label);
      }
    }
    if (conflicting.length === 0) {
      return;
    }
    const subject = joinWithAnd(conflicting);
    const verdict =
      conflicting.length === 1
        ? 'does not match the other values.'
        : 'cannot all hold at once.';
    this.addError(
      `${subject} ${verdict} ` +
        'Press Calculate on the value you trust to solve for the rest.',
    );
  }

  private valueDisagrees(
    name: string,
    variable: VariableDefinition,
    current: CalcValue,
  ): boolean {
    if (variable.takeFrom !== undefined) {
      // A wired value is defined by its source, not by a formula.
      return false;
    }
    if (isTableSelectVariable(variable)) {
      const binding = this.tableSelects.get(name);
      if (binding === undefined) {
        return false;
      }
      const derived = this.deriveSelectionKey(binding);
      return derived !== null && derived !== current;
    }

    if (isTextVariable(variable)) {
      const compute = variable.computable;
      if (compute === undefined) {
        return false;
      }
      let result: unknown;
      try {
        result = compute(Object.freeze({ ...this.values, [name]: null }));
      } catch {
        return false;
      }
      if (
        isUnchanged(result) ||
        isMissing(result) ||
        typeof result !== 'string'
      ) {
        return false;
      }
      return current !== result;
    }

    const field = this.tableFields.get(name);
    if (field !== undefined) {
      const derived = this.deriveTableFieldValue(field);
      if (derived === null) {
        return false;
      }
      return typeof current !== 'number' || !nearlyEqual(current, derived);
    }

    const computable = variable.computable;
    if (computable === undefined) {
      return false;
    }
    let result: unknown;
    try {
      result = computable(Object.freeze({ ...this.values, [name]: null }));
    } catch {
      return false;
    }
    if (isUnchanged(result) || isMissing(result)) {
      return false;
    }
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return false;
    }
    return typeof current !== 'number' || !nearlyEqual(current, result);
  }

  private runValidators(): void {
    const issues: ValidationIssue[] = [];
    for (const variable of this.variableList) {
      const validate = variable.validate;
      if (validate === undefined) {
        continue;
      }
      let result: readonly string[] | string | void;
      try {
        result = validate(Object.freeze({ ...this.values }));
      } catch (error) {
        issues.push({
          variable: variable.name,
          label: variable.label,
          message: `Validation failed: ${errorMessage(error)}`,
        });
        continue;
      }
      for (const message of normalizeMessages(result)) {
        const trimmed = message.trim();
        if (trimmed !== '') {
          issues.push({
            variable: variable.name,
            label: variable.label,
            message: trimmed,
          });
        }
      }
    }
    this.issues = issues;
  }

  private assertValidState(state: CalcState): void {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) {
      throw new StateLoadError('Saved state must be an object.');
    }
    for (const key of Object.keys(state)) {
      if (!this.variablesByName.has(key)) {
        throw new StateLoadError(`Saved state has unknown variable "${key}".`);
      }
    }
    for (const variable of this.variableList) {
      if (!Object.hasOwn(state, variable.name)) {
        throw new StateLoadError(
          `Saved state is missing variable "${variable.name}".`,
        );
      }
      const value = state[variable.name] ?? null;
      if (value === null) {
        continue;
      }
      if (isTableSelectVariable(variable)) {
        const binding = this.tableSelects.get(variable.name);
        if (
          typeof value !== 'string' ||
          binding === undefined ||
          findRow(binding.table, value) === undefined
        ) {
          throw new StateLoadError(
            `Saved value for "${variable.name}" is not a valid table row.`,
          );
        }
        continue;
      }
      if (isTextVariable(variable)) {
        if (typeof value !== 'string') {
          throw new StateLoadError(
            `Saved value for "${variable.name}" must be text.`,
          );
        }
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new StateLoadError(
          `Saved value for "${variable.name}" must be a finite number.`,
        );
      }
    }
  }

  private addError(message: string): void {
    if (!this.errorMessages.includes(message)) {
      this.errorMessages.push(message);
    }
  }

  /** Removes every display item, running its dispose hook. */
  private clearDisplay(): void {
    const items = this.displayItems;
    this.displayItems = [];
    for (const item of items) {
      item.dispose?.();
    }
  }

  /** Adds one display item for the current run, ignoring late callbacks. */
  private addDisplayItem(
    controller: AbortController,
    content: OutputDisplayContent,
    dispose: (() => void) | undefined,
  ): void {
    if (controller.signal.aborted || this.runController !== controller) {
      dispose?.();
      return;
    }
    this.displayItems.push(
      dispose === undefined ? { content } : { content, dispose },
    );
    this.emit();
  }

  /**
   * Merges the state returned by `computeState`. Unknown keys and values of
   * the wrong type are ignored so a faulty calculation cannot corrupt the
   * runtime.
   */
  private applyComputedState(result: CalcState): void {
    if (
      typeof result !== 'object' ||
      result === null ||
      Array.isArray(result)
    ) {
      this.addError('Calculation returned an invalid state.');
      return;
    }
    for (const [name, value] of Object.entries(result)) {
      if (!this.variablesByName.has(name)) {
        continue;
      }
      const candidate: unknown = value;
      if (
        candidate !== null &&
        typeof candidate !== 'number' &&
        typeof candidate !== 'string'
      ) {
        continue;
      }
      this.values[name] = value;
    }
    this.recompute();
  }

  private requireVariable(name: string): VariableDefinition {
    const variable = this.variablesByName.get(name);
    if (variable === undefined) {
      throw new RangeError(`Unknown variable "${name}".`);
    }
    return variable;
  }

  private requireTableSelect(name: string): TableSelectBinding {
    const binding = this.tableSelects.get(name);
    if (binding === undefined) {
      throw new RangeError(`Variable "${name}" is not a table select.`);
    }
    return binding;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function normalizeMessages(
  result: readonly string[] | string | void,
): readonly string[] {
  if (typeof result === 'string') {
    return [result];
  }
  if (Array.isArray(result)) {
    return result.map((entry) => String(entry));
  }
  return [];
}

function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Collects the numeric variables joined by their `equivalent` links into
 * connected components. Every component names one quantity expressed several
 * ways (area, diameter, and radius), so the runtime can fill the group from
 * whichever single member already holds a value.
 */
function buildEquivalentGroups(
  variables: readonly VariableDefinition[],
): readonly (readonly string[])[] {
  const neighbours = new Map<string, Set<string>>();
  const link = (from: string, to: string): void => {
    const links = neighbours.get(from) ?? new Set<string>();
    links.add(to);
    neighbours.set(from, links);
  };
  for (const variable of variables) {
    if (!isNumberVariable(variable)) {
      continue;
    }
    for (const target of Object.keys(variable.equivalent ?? {})) {
      link(variable.name, target);
    }
  }

  const groups: string[][] = [];
  const seen = new Set<string>();
  for (const name of neighbours.keys()) {
    if (seen.has(name)) {
      continue;
    }
    const group: string[] = [];
    const stack = [name];
    seen.add(name);
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) {
        continue;
      }
      group.push(current);
      for (const next of neighbours.get(current) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    groups.push(group);
  }
  return groups;
}

/** Resolves a definition's config, filling defaults for missing entries. */
function resolveConfig(
  definition: CalculatorDefinition,
  config: CalculatorConfig | undefined,
): CalculatorConfig {
  const resolved: Record<string, ConfigValue> = {};
  for (const field of definition.config ?? []) {
    resolved[field.name] = normalizeConfigValue(field, config?.[field.name]);
  }
  return resolved;
}

/** Coerces one provided config value to the field's kind and range. */
function normalizeConfigValue(
  field: ConfigFieldDefinition,
  value: ConfigValue | undefined,
): ConfigValue {
  switch (field.kind) {
    case 'number': {
      const fallback = typeof field.default === 'number' ? field.default : 0;
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return clampToRange(fallback, field);
      }
      return clampToRange(value, field);
    }
    case 'boolean':
      return typeof value === 'boolean' ? value : field.default === true;
    case 'select': {
      const options = field.options ?? [];
      if (typeof value === 'string' && options.includes(value)) {
        return value;
      }
      const fallback = String(field.default ?? '');
      return options.includes(fallback) ? fallback : (options[0] ?? '');
    }
    case 'string':
      return typeof value === 'string' ? value : String(field.default ?? '');
  }
}

function clampToRange(value: number, field: ConfigFieldDefinition): number {
  let bounded = value;
  if (field.min !== undefined && bounded < field.min) {
    bounded = field.min;
  }
  if (field.max !== undefined && bounded > field.max) {
    bounded = field.max;
  }
  return bounded;
}

/**
 * Builds the variable list for a config. When the definition supplies a
 * builder its result is validated here; a plain definition reuses the list it
 * already declares.
 */
function buildVariableList(
  definition: CalculatorDefinition,
  config: CalculatorConfig,
): readonly VariableDefinition[] {
  const build = definition.buildVariables;
  if (build === undefined) {
    return definition.variables;
  }
  let variables: readonly VariableDefinition[];
  try {
    variables = build(config);
  } catch (error) {
    throw new CalculatorDefinitionError(
      `${definition.title} could not build its variables: ` +
        `${errorMessage(error)}`,
    );
  }
  validateVariableList(variables);
  return variables;
}

/** True when two configs hold the same entries. */
function configEquals(
  left: CalculatorConfig,
  right: CalculatorConfig,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Converts a source value for transport over a wire. Numbers are converted
 * from the source's base unit into the destination's; text and table keys are
 * copied unchanged (two wired selects are required to share a table).
 */
function wireValue(
  source: VariableDefinition,
  raw: CalcValue,
  target: VariableDefinition,
): CalcValue {
  if (
    typeof raw === 'number' &&
    isNumberVariable(source) &&
    isNumberVariable(target)
  ) {
    return convertUnit(raw, source.unit, target.unit);
  }
  return raw;
}
