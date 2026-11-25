import type { MissingValue } from './missing.js';
import type { UnitSymbol } from './units.js';

/** A calculator value in its variable's declared (base) unit. */
export type CalcValue = number | null;

/** The complete internal state of one calculator. */
export type CalcState = Record<string, CalcValue>;

/**
 * One value in a calculator. Values are always stored internally in `unit`;
 * display and input units are converted at the edges.
 */
export interface VariableDefinition {
  /** Identifier used as a key in the state object. */
  readonly name: string;
  /** Human readable name shown in the UI and in messages. */
  readonly label: string;
  /** Unit that the internal state is stored in. */
  readonly unit: UnitSymbol;
  /**
   * Units offered in the unit selector. The base unit is always available,
   * even when it is not listed. Defaults to every unit of the same kind.
   */
  readonly unitOptions?: readonly UnitSymbol[];
  /** Whether the user may type a value. Defaults to true. */
  readonly editable?: boolean;
  /**
   * Whether a change to this value should start another round of
   * recomputation. Defaults to true. Set to false for derived values that
   * should not destabilize the compute order.
   */
  readonly input?: boolean;
  /** Explanation shown under the field. */
  readonly description?: string;
  /**
   * Computes the value from the state, or returns `missing([...])` when the
   * inputs it needs are not available.
   */
  readonly computable?: (state: Readonly<CalcState>) => number | MissingValue;
  /** Returns a message (or messages) when the value is not acceptable. */
  readonly validate?: (
    state: Readonly<CalcState>,
  ) => readonly string[] | string | void;
}

/** A calculator is pure data; all UI lives elsewhere. */
export interface CalculatorDefinition {
  /** URL-safe identifier, unique within its category. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variables: readonly VariableDefinition[];
  /** Complete states used to verify that every computable variable can be
   * solved for. Values are expressed in each variable's base unit. */
  readonly testCases?: readonly Readonly<CalcState>[];
}

/** Shape of a lazily imported category module. */
export interface CategoryModule {
  readonly calculators: readonly CalculatorDefinition[];
}

/** Entry in the application manifest describing one lazy category. */
export interface CategoryManifestEntry {
  readonly title: string;
  readonly description: string;
  readonly load: () => Promise<CategoryModule>;
}

/** Manifest of every category the widget knows how to load. */
export type CategoryManifest = Readonly<Record<string, CategoryManifestEntry>>;

/** A validation message attached to a specific variable. */
export interface ValidationIssue {
  readonly variable: string;
  readonly label: string;
  readonly message: string;
}
