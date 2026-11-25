import type { UnitSymbol } from '../framework/units.js';
import type { CalculatorConfig, CalcState } from '../framework/types.js';

/** Version of the saved custom-calculator format. */
export const CUSTOM_VERSION = 1;

/** Variable name used by a standalone value or text step. */
export const STEP_VALUE_NAME = 'value';

/** Which kind of thing a step is. */
export type StepKind = 'subcalc' | 'variable' | 'text';

/**
 * Wiring and visibility shared by every variable of a step. A wire path is
 * written "<stepId>.<variableName>" and always names a variable, never a whole
 * step, so a wire joins exactly two fields. `takeFrom` is the single source of
 * truth for a wire; a "send to" is expressed by the target's `takeFrom`, so a
 * source may feed any number of targets.
 */
export interface StepVariable {
  /** Wire path this variable takes its value from, if any. */
  readonly takeFrom?: string;
  /** Whether the field is hidden outside the editor. Defaults to false. */
  readonly hidden?: boolean;
}

interface StepBase {
  /** Slug that prefixes every variable this step contributes. */
  readonly id: string;
  /** Human readable name shown as the step's title. */
  readonly label: string;
  /** Whether every field of this step is hidden outside the editor. */
  readonly hidden?: boolean;
}

/**
 * One instance of a catalog calculator. Two steps may share a calculator id
 * while keeping separate settings and values.
 */
export interface SubcalcStep extends StepBase {
  readonly kind: 'subcalc';
  /** Id of the catalog entry this step instantiates. */
  readonly calculatorId: string;
  /** Settings that shape the step's variable list. */
  readonly config: CalculatorConfig;
  /** Starting values, keyed by the subcalculator's local variable names. */
  readonly values: CalcState;
  /** Per-variable wiring and visibility, keyed by local variable name. */
  readonly variables: Readonly<Record<string, StepVariable>>;
}

/** A custom numeric output with a unit. */
export interface VariableStep extends StepBase {
  readonly kind: 'variable';
  readonly unit: UnitSymbol;
  readonly default?: number;
  readonly variable: StepVariable;
}

/** A custom text output. */
export interface TextStep extends StepBase {
  readonly kind: 'text';
  readonly default?: string;
  readonly variable: StepVariable;
}

/** One step in a custom calculator. */
export type CustomStep = SubcalcStep | VariableStep | TextStep;

/**
 * A user-built multistep calculation. Steps run in the order they are listed;
 * values flow along wires between their fields.
 */
export interface CustomDefinition {
  readonly version: typeof CUSTOM_VERSION;
  /** Slug used as the calculator id within the Custom category. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly steps: readonly CustomStep[];
}

/** A wire path split into the step it belongs to and the variable within it. */
export interface WireTarget {
  readonly stepId: string;
  readonly variable: string;
}

/** Builds the wire path naming one variable of one step. */
export function wirePath(stepId: string, variable: string): string {
  return `${stepId}.${variable}`;
}

/**
 * Splits a wire path into its step and variable. Returns null when the path is
 * not of the form "<stepId>.<variable>".
 */
export function parseWirePath(path: string): WireTarget | null {
  const dot = path.indexOf('.');
  if (dot <= 0 || dot === path.length - 1) {
    return null;
  }
  const stepId = path.slice(0, dot);
  const variable = path.slice(dot + 1);
  if (variable.includes('.')) {
    return null;
  }
  return { stepId, variable };
}

/**
 * Global variable name a step contributes. Step ids hold no underscore and
 * variable names hold no underscore-separated step id, so the joined name is
 * unique and matches the framework's variable-name pattern.
 */
export function globalVariableName(stepId: string, variable: string): string {
  return `${stepId}_${variable}`;
}

/** True when a step contributes exactly one variable named `value`. */
export function isSingleVariableStep(
  step: CustomStep,
): step is VariableStep | TextStep {
  return step.kind === 'variable' || step.kind === 'text';
}
