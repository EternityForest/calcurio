import {
  CalculatorDefinitionError,
  errorMessage,
  StateLoadError,
} from './errors.js';
import { formatNumber, parseNumberText } from './format.js';
import { isMissing } from './missing.js';
import type { MissingValue } from './missing.js';
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
  CalculatorDefinition,
  NumberVariableDefinition,
  TableColumn,
  TableDefinition,
  TableResolver,
  TableSelectVariableDefinition,
  ValidationIssue,
  VariableDefinition,
} from './types.js';
import {
  isTableFieldVariable,
  isTableSelectVariable,
} from './types.js';
import { choicesForUnit, convertUnit, measureOf } from './units.js';
import type { UnitSymbol } from './units.js';
import { validateCalculatorDefinition } from './validate.js';

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
 * Owns the state of one calculator and the rules for recomputing it. No DOM
 * code lives here, so a calculator can be embedded in any UI.
 */
export class CalculatorRuntime {
  readonly definition: CalculatorDefinition;

  private readonly variablesByName = new Map<string, VariableDefinition>();
  private readonly choicesByVariable = new Map<string, UnitSymbol[]>();
  private readonly displayUnits = new Map<string, UnitSymbol>();
  private readonly listeners = new Set<RuntimeListener>();
  private readonly derivedNames: readonly string[];
  private readonly derivedNameSet: ReadonlySet<string>;
  private readonly missingNeeds = new Map<string, readonly string[]>();
  private readonly tableSelects = new Map<string, TableSelectBinding>();
  private readonly tableFields = new Map<string, TableFieldBinding>();
  private readonly tableFieldsBySelect = new Map<string, TableFieldBinding[]>();

  private values: CalcState = {};
  private pinnedNames = new Set<string>();
  private order: string[] = [];
  private lastTouchedName: string | null = null;
  private converged = true;
  private errorMessages: string[] = [];
  private issues: ValidationIssue[] = [];

  constructor(definition: CalculatorDefinition, tables?: TableResolver) {
    validateCalculatorDefinition(definition);
    this.definition = definition;

    for (const variable of definition.variables) {
      this.variablesByName.set(variable.name, variable);
      this.values[variable.name] = null;
      if (!isTableSelectVariable(variable)) {
        this.choicesByVariable.set(
          variable.name,
          choicesForUnit(variable.unit, variable.unitOptions),
        );
        this.displayUnits.set(variable.name, variable.unit);
      }
    }

    this.bindTables(tables);

    this.derivedNames = definition.variables
      .filter((variable) => this.isDerived(variable))
      .map((variable) => variable.name);
    this.derivedNameSet = new Set(this.derivedNames);
    this.order = [...this.derivedNames];
    this.recompute();
  }

  get variables(): readonly VariableDefinition[] {
    return this.definition.variables;
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

  /** Derived variables in the order they are solved. */
  get computeOrder(): readonly string[] {
    return [...this.order];
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

  isEditable(name: string): boolean {
    return this.requireVariable(name).editable !== false;
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

  /** Display unit for a numeric variable; null for table selects. */
  displayUnitFor(name: string): UnitSymbol | null {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      return null;
    }
    return this.displayUnits.get(name) ?? variable.unit;
  }

  unitChoices(name: string): readonly UnitSymbol[] {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
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
    if (isTableSelectVariable(variable)) {
      throw new RangeError(
        `${variable.label} does not have a display unit.`,
      );
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
   * Recomputes every unpinned variable in order. When a value changes and the
   * variable is an input, another pass starts. More than
   * `MAX_REFINEMENT_ROUNDS` passes raises a visible error.
   */
  recompute(): void {
    this.errorMessages = [];
    this.missingNeeds.clear();

    let settled = false;
    for (let round = 0; round < MAX_REFINEMENT_ROUNDS; round += 1) {
      let restart = false;
      for (const name of this.order) {
        if (this.pinnedNames.has(name)) {
          continue;
        }
        if (this.computeVariable(name)) {
          restart = true;
        }
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
    for (const variable of this.definition.variables) {
      this.values[variable.name] = null;
      if (!isTableSelectVariable(variable)) {
        this.displayUnits.set(variable.name, variable.unit);
      }
    }
    this.pinnedNames = new Set();
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

    const displayUnits = new Map<string, UnitSymbol>();
    for (const variable of this.definition.variables) {
      if (!isTableSelectVariable(variable)) {
        displayUnits.set(variable.name, variable.unit);
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
        if (isTableSelectVariable(variable)) {
          throw new StateLoadError(
            `Saved unit for "${name}" is not valid for a table select.`,
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

  /** Subscribes to state changes. Returns an unsubscribe function. */
  subscribe(listener: RuntimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private bindTables(tables: TableResolver | undefined): void {
    for (const variable of this.definition.variables) {
      if (!isTableSelectVariable(variable)) {
        continue;
      }
      const table = this.resolveTable(variable, tables);
      this.tableSelects.set(variable.name, { variable, table });
    }

    for (const variable of this.definition.variables) {
      if (isTableSelectVariable(variable) || !isTableFieldVariable(variable)) {
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
    if (isTableSelectVariable(variable)) {
      return true;
    }
    return (
      variable.computable !== undefined ||
      isTableFieldVariable(variable)
    );
  }

  private computeVariable(name: string): boolean {
    const variable = this.requireVariable(name);
    if (isTableSelectVariable(variable)) {
      return this.computeTableSelect(variable);
    }
    const field = this.tableFields.get(name);
    if (field !== undefined) {
      return this.computeTableField(name, field);
    }
    return this.computeNumber(name, variable);
  }

  private computeNumber(
    name: string,
    variable: NumberVariableDefinition,
  ): boolean {
    const computable = variable.computable;
    if (computable === undefined) {
      return false;
    }

    let result: number | MissingValue;
    try {
      result = computable(Object.freeze({ ...this.values }));
    } catch (error) {
      this.addError(`${variable.label} failed: ${errorMessage(error)}`);
      return false;
    }

    let next: CalcValue;
    if (isMissing(result)) {
      this.missingNeeds.set(name, [...result.needs]);
      next = null;
    } else if (!Number.isFinite(result)) {
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

  private computeTableSelect(
    variable: TableSelectVariableDefinition,
  ): boolean {
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

  private computeTableField(
    name: string,
    binding: TableFieldBinding,
  ): boolean {
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
    const constraints = (this.tableFieldsBySelect.get(binding.variable.name) ??
      [])
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

  private deriveTableFieldValue(
    binding: TableFieldBinding,
  ): number | null {
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
      this.addError(
        `${binding.column.label} is empty for row "${key}".`,
      );
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
    if (isTableSelectVariable(variable)) {
      const binding = this.tableSelects.get(name);
      return binding !== undefined && this.deriveSelectionKey(binding) !== null;
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
      const result = computable(Object.freeze({ ...this.values }));
      return !isMissing(result) && Number.isFinite(result);
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
    if (isTableSelectVariable(variable)) {
      const binding = this.tableSelects.get(name);
      if (binding === undefined) {
        return false;
      }
      const derived = this.deriveSelectionKey(binding);
      return derived !== null && derived !== current;
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
    let result: number | MissingValue;
    try {
      result = computable(Object.freeze({ ...this.values, [name]: null }));
    } catch {
      return false;
    }
    if (isMissing(result) || !Number.isFinite(result)) {
      return false;
    }
    return typeof current !== 'number' || !nearlyEqual(current, result);
  }

  private runValidators(): void {
    const issues: ValidationIssue[] = [];
    for (const variable of this.definition.variables) {
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
    for (const variable of this.definition.variables) {
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