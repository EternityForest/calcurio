import type { MissingValue } from './missing.js';
import type { ComputeStateContext } from './output.js';
import type { UnchangedValue } from './unchanged.js';
import type { UnitSymbol } from './units.js';

/** A calculator value in its variable's declared (base) unit. */
export type CalcValue = number | string | null;

/** The complete internal state of one calculator. */
export type CalcState = Record<string, CalcValue>;

/** Fields shared by every kind of calculator variable. */
export interface VariableBase {
  /** Identifier used as a key in the state object. */
  readonly name: string;
  /** Human readable name shown in the UI and in messages. */
  readonly label: string;
  /** Whether the user may type or select a value. Defaults to true. */
  readonly editable?: boolean;
  /**
   * Whether a change to this value should start another round of
   * recomputation. Defaults to true. Set to false for derived values that
   * should not destabilize the compute order.
   */
  readonly input?: boolean;
  /** Explanation shown under the field. */
  readonly description?: string;
  /** Returns a message (or messages) when the value is not acceptable. */
  readonly validate?: (
    state: Readonly<CalcState>,
  ) => readonly string[] | string | void;
}

/**
 * One numeric value in a calculator. Values are always stored internally in
 * `unit`; display and input units are converted at the edges.
 */
export interface NumberVariableDefinition extends VariableBase {
  /** Unit that the internal state is stored in. */
  readonly unit: UnitSymbol;
  /**
   * Units offered in the unit selector. The base unit is always available,
   * even when it is not listed. Defaults to every unit of the same kind.
   */
  readonly unitOptions?: readonly UnitSymbol[];
  /**
   * Computes the value from the state, or returns `missing([...])` when the
   * inputs it needs are not available. Returns `unchanged()` to leave the
   * current value alone, which a `computeState` calculator requires. Omit
   * this on variables derived from a table column via
   * `tableSelect`/`tableField`.
   */
  readonly computable?: (
    state: Readonly<CalcState>,
  ) => number | MissingValue | UnchangedValue;
  /** Name of a table-select variable whose selected row supplies this value. */
  readonly tableSelect?: string;
  /** Column in that table. Requires `tableSelect`. */
  readonly tableField?: string;
  /**
   * Value the variable starts at when no value has been stored yet. Ignored
   * for variables that can be computed from the state.
   */
  readonly default?: number;
}

/**
 * A dropdown that selects one row of a table. The stored value is the row's
 * key, or null when no row is selected.
 */
export interface TableSelectVariableDefinition extends VariableBase {
  /** ID of the table whose rows this variable selects. */
  readonly table: string;
}

/** One value in a calculator: numeric, or a table row selection. */
export type VariableDefinition =
  NumberVariableDefinition | TableSelectVariableDefinition;

/** Narrows a variable to a table-select dropdown. */
export function isTableSelectVariable(
  variable: VariableDefinition,
): variable is TableSelectVariableDefinition {
  return 'table' in variable;
}

/** True when a numeric variable reads one column of a table selection. */
export function isTableFieldVariable(
  variable: NumberVariableDefinition,
): boolean {
  return variable.tableSelect !== undefined;
}

/** A cell value in a table row. */
export type TableCell = string | number | boolean | null;

/** One row of a table, keyed by column key. */
export type TableRow = Readonly<Record<string, TableCell>>;

/** How a table column stores its cells when it has no unit to imply one. */
export type TableColumnKind = 'text' | 'number' | 'boolean';

/**
 * One column in a table. A column is numeric when it has a unit or declares
 * `kind: "number"`, and stores text otherwise. Declare `kind: "boolean"` for
 * yes/no flags.
 */
export interface TableColumn {
  readonly key: string;
  readonly label: string;
  /** Numeric columns store values in this unit. Omit for text columns. */
  readonly unit?: UnitSymbol;
  /**
   * Overrides the cell type implied by `unit`. Use "number" for dimensionless
   * numeric columns and "boolean" for yes/no flags.
   */
  readonly kind?: TableColumnKind;
  readonly description?: string;
}

/**
 * A plain data table. Rows are dictionaries keyed by column key. The table
 * itself has no UI; views and calculators read the data.
 */
export interface TableDefinition {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  /** Text column with unique values used as the stored selection. */
  readonly keyColumn: string;
  /** Text column shown in the selector and table view. */
  readonly labelColumn: string;
  readonly columns: readonly TableColumn[];
  readonly rows: readonly TableRow[];
}

/** Looks tables up by id for a calculator runtime. */
export interface TableResolver {
  getTable(id: string): TableDefinition | undefined;
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
  /**
   * Computes every computable variable at once from a copy of the state.
   * When set, this replaces the incremental solver: the runtime never
   * recomputes values on change, and every `computable` variable must return
   * `unchanged()` so the editor knows the real value is produced here. The
   * returned state is merged over the given copy, and `context.display(...)`
   * may render arbitrary content for this run.
   */
  readonly computeState?: (
    state: Readonly<CalcState>,
    context: ComputeStateContext,
  ) => Promise<CalcState> | CalcState;
}

/** Shape of a lazily imported category module. */
export interface CategoryModule {
  readonly tables?: readonly TableDefinition[];
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
