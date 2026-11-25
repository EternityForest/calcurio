import { errorMessage, StateLoadError } from './errors.js';
import { formatNumber, parseNumberText } from './format.js';
import { isMissing } from './missing.js';
import type { MissingValue } from './missing.js';
import type {
  CalcState,
  CalcValue,
  CalculatorDefinition,
  ValidationIssue,
  VariableDefinition,
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

/** Everything needed to restore a calculator exactly. */
export interface CalculatorSnapshot {
  readonly state: CalcState;
  readonly units: Record<string, UnitSymbol>;
}

/** Called after every state or display-unit change. */
export type RuntimeListener = () => void;

/**
 * Compares two calculator values, treating very small differences as equal so
 * that decimal conversions and repeated formulas do not cause extra compute
 * rounds.
 */
export function nearlyEqual(
  left: number | null,
  right: number | null,
  relativeTolerance = DEFAULT_RELATIVE_TOLERANCE,
  absoluteTolerance = DEFAULT_ABSOLUTE_TOLERANCE,
): boolean {
  if (left === null || right === null) {
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
  private readonly computableNames: readonly string[];
  private readonly missingNeeds = new Map<string, readonly string[]>();

  private values: CalcState = {};
  private pinnedNames = new Set<string>();
  private order: string[] = [];
  private errorMessages: string[] = [];
  private issues: ValidationIssue[] = [];

  constructor(definition: CalculatorDefinition) {
    validateCalculatorDefinition(definition);
    this.definition = definition;

    for (const variable of definition.variables) {
      this.variablesByName.set(variable.name, variable);
      this.choicesByVariable.set(
        variable.name,
        choicesForUnit(variable.unit, variable.unitOptions),
      );
      this.values[variable.name] = null;
      this.displayUnits.set(variable.name, variable.unit);
    }

    this.computableNames = definition.variables
      .filter((variable) => variable.computable !== undefined)
      .map((variable) => variable.name);
    this.order = [...this.computableNames];
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

  get validationIssues(): readonly ValidationIssue[] {
    return [...this.issues];
  }

  /** Computable variables in the order they are solved. */
  get computeOrder(): readonly string[] {
    return [...this.order];
  }

  variable(name: string): VariableDefinition {
    return this.requireVariable(name);
  }

  isComputable(name: string): boolean {
    return this.requireVariable(name).computable !== undefined;
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
    const needs = this.missingNeedsFor(name);
    if (needs.length === 0) {
      return '';
    }
    const labels = needs.map(
      (dependency) => this.variablesByName.get(dependency)?.label ?? dependency,
    );
    return `Needs ${joinWithAnd(labels)}`;
  }

  displayUnitFor(name: string): UnitSymbol {
    const variable = this.requireVariable(name);
    return this.displayUnits.get(name) ?? variable.unit;
  }

  unitChoices(name: string): readonly UnitSymbol[] {
    this.requireVariable(name);
    return [...(this.choicesByVariable.get(name) ?? [])];
  }

  /** Value converted to its display unit and formatted for the field. */
  formattedValue(name: string): string {
    const variable = this.requireVariable(name);
    const value = this.values[name] ?? null;
    if (value === null) {
      return '';
    }
    const displayUnit = this.displayUnitFor(name);
    return formatNumber(convertUnit(value, variable.unit, displayUnit));
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
    if (!this.isEditable(name)) {
      return { ok: false, message: `${variable.label} is read-only.` };
    }

    let parsed: number | null;
    try {
      parsed = parseNumberText(text);
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }

    const displayUnit = this.displayUnitFor(name);
    const baseValue =
      parsed === null ? null : convertUnit(parsed, displayUnit, variable.unit);
    this.setValue(name, baseValue);
    return { ok: true };
  }

  /** Changes only how a variable is displayed; stored values keep base units. */
  setDisplayUnit(name: string, unit: UnitSymbol): void {
    const variable = this.requireVariable(name);
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
    if (variable.computable === undefined) {
      throw new Error(`${variable.label} is not computable.`);
    }

    this.order = [name, ...this.order.filter((entry) => entry !== name)];
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

    if (!settled) {
      this.addError(
        `Calculation did not settle after ${MAX_REFINEMENT_ROUNDS} rounds. ` +
          'Choose one value to calculate and try again.',
      );
    }

    this.runValidators();
    this.emit();
  }

  /** Clears every value, display unit, and compute-order change. */
  reset(): void {
    for (const variable of this.definition.variables) {
      this.values[variable.name] = null;
      this.displayUnits.set(variable.name, variable.unit);
    }
    this.pinnedNames = new Set();
    this.order = [...this.computableNames];
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
      displayUnits.set(variable.name, variable.unit);
    }
    if (units !== undefined) {
      for (const [name, unit] of Object.entries(units)) {
        const variable = this.variablesByName.get(name);
        if (variable === undefined) {
          throw new StateLoadError(
            `Saved state has unknown variable "${name}".`,
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
    this.order = [...this.computableNames];
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

  private computeVariable(name: string): boolean {
    const variable = this.requireVariable(name);
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

  private setValue(name: string, value: CalcValue): void {
    this.values[name] = value;
    this.pinnedNames.add(name);
    this.missingNeeds.delete(name);
    this.recompute();
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
      const value = state[variable.name];
      if (value === null) {
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
