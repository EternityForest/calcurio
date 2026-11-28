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
   * Name of another variable in the same calculator that supplies this one's
   * value. A wired variable is read-only and follows its source. Its unit must
   * measure the same kind as the source, and two table selects joined by a
   * wire must select from the same table.
   */
  readonly takeFrom?: string;
  /**
   * Names of other variables in the same calculator that this one's value is
   * sent to. The value flows to every target when the state is computed.
   */
  readonly sendTo?: readonly string[];

  /**
   * Whether a change to this value should start another round of
   * recomputation. Defaults to true. Set to false for derived values that
   * should not destabilize the compute order.
   */
  readonly input?: boolean;
  /**
   * Whether the field is left out of the calculator's visible fields. A hidden
   * variable still takes part in computation; only its field is suppressed.
   * Defaults to false.
   */
  readonly hidden?: boolean;
  /** Explanation shown under the field. */
  readonly description?: string;
  /**
   * Whether the value should update automatically when its inputs change.
   * Defaults to true. When false, the value only changes when the user presses
   * Calculate on the field.
   */
  readonly autoUpdate?: boolean;
  /**
   * Buttons that instantly set this variable to a computed value. The setter
   * callback receives the current state and returns the new value.
   */
  readonly setterButtons?: readonly SetterButton[];
  /** Returns a message (or messages) when the value is not acceptable. */
  readonly validate?: (
    state: Readonly<CalcState>,
  ) => readonly string[] | string | void;
}

/**
 * A button that instantly sets a variable to a computed value. The callback
 * receives the current state and returns the new value.
 */
export interface SetterButton {
  /** Label shown on the button. */
  readonly label: string;
  /**
   * Computes the new value for the variable. Called with the current state.
   * Return the value to set.
   */
  readonly setter: (state: Readonly<CalcState>) => CalcValue;
}

/**
 * One numeric value in a calculator. Values are always stored internally in
 * `unit`; display and input units are converted at the edges.
 */
export interface NumberVariableDefinition extends VariableBase {
  /** Unit that the internal state is stored in. */
  readonly unit: UnitSymbol;
  /**
   * Unit the field starts in. Defaults to `unit`, so set it when the value is
   * stored internally in one unit but is easier to enter in another (farads
   * stored, microfarads shown). Must measure the same kind as `unit`.
   */
  readonly defaultDisplayUnit?: UnitSymbol;
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
   * Name of the numeric variable (or variables) that supply the axis value for
   * a lookup column. The column's unit must be a composite unit such as
   * `kg/m3@°C` or `kg/m3@°C,kPa`, listing one axis per name in the same order.
   * An axis may be omitted; the column's standard for it is then used.
   */
  readonly tableAxis?: string | readonly string[];
  /**
   * Other numeric variables that hold the same quantity in a different form,
   * each mapped to a function that converts this variable's value into that
   * one. Declared in both directions (`area` names `diameter` and `diameter`
   * names `area`), the entries form a group the runtime can use to fill in
   * whichever members a table lookup leaves blank. Only consulted when no
   * unambiguous table row matches.
   */
  readonly equivalent?: Readonly<Record<string, (value: number) => number|string>>;
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
  /**
   * Column key that must have a non-null value for a row to appear in the
   * selector. Use it to hide rows that lack a property the calculator needs.
   */
  readonly filter?: string;
  /**
   * Name of another table-select variable whose selected row supplies this
   * select's key, read from the text column named by `tableField`. This binds
   * one select to another: the parent row sets this key, and choosing this
   * row in turn clears the parent so a custom value stands. Requires
   * `tableField`.
   */
  readonly tableSelect?: string;
  /**
   * Text column of the parent select's table that holds this select's row
   * key. Requires `tableSelect`.
   */
  readonly tableField?: string;

  readonly default?: string;
}

/**
 * A free text value. Unlike a number it carries no unit, and unlike a table
 * select it is not tied to a table. Used for labels and other string outputs
 * a calculator produces.
 */
export interface TextVariableDefinition extends VariableBase {
  /**
   * Computes the text from the state, or returns `missing([...])` when the
   * inputs it needs are not available. Omit for a plain text input.
   */
  readonly computable?: (
    state: Readonly<CalcState>,
  ) => string | MissingValue | UnchangedValue;
  /** Text the variable starts with when no value has been stored yet. */
  readonly default?: string;
  readonly pattern?: string;
  readonly equivalent?: Readonly<Record<string, (value: string) => number|string>>;
}

/** One value in a calculator: numeric, text, or a table row selection. */
export type VariableDefinition =
  | NumberVariableDefinition
  | TableSelectVariableDefinition
  | TextVariableDefinition;

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

/** True when a table select reads its key from another select's row. */
export function isSelectFieldVariable(
  variable: TableSelectVariableDefinition,
): boolean {
  return variable.tableSelect !== undefined;
}

/** Normalizes a variable's `tableAxis` to an ordered list of axis names. */
export function tableAxisNames(
  variable: NumberVariableDefinition,
): readonly string[] {
  const axis = variable.tableAxis;
  if (axis === undefined) {
    return [];
  }
  return typeof axis === 'string' ? [axis] : axis;
}

/** Narrows a variable to a free text value. */
export function isTextVariable(
  variable: VariableDefinition,
): variable is TextVariableDefinition {
  return !('table' in variable) && !('unit' in variable);
}

/** Narrows a variable to a numeric value with a unit. */
export function isNumberVariable(
  variable: VariableDefinition,
): variable is NumberVariableDefinition {
  return 'unit' in variable;
}

/** A cell value in a table row. */
export type TableCell = string | number | boolean | null;

/** One row of a table, keyed by column key. */
export type TableRow = Readonly<Record<string, TableCell>>;

/** How a table column stores its cells when it has no unit to imply one. */
export type TableColumnKind = 'text' | 'number' | 'boolean' | 'lookup';

/**
 * A unit paired with the axis it varies along, written as `unit@axis` such as
 * `kg/m3@°C`. A lookup column stores sampled pairs in this unit and
 * interpolates against the axis. A plain string is accepted so tables can write
 * the composite unit directly; `parseCompositeUnit` validates it at runtime.
 */
export type CompositeUnit = string & { readonly __compositeUnit?: never };

/**
 * One column in a table. A column is numeric when it has a unit or declares
 * `kind: "number"`, and stores text otherwise. Declare `kind: "boolean"` for
 * yes/no flags.
 */
export interface TableColumn {
  readonly key: string;
  readonly label: string;
  /**
   * Numeric columns store values in this unit. Omit for text columns. A
   * lookup column uses a composite unit such as `kg/m3@°C`.
   */
  readonly unit?: UnitSymbol | CompositeUnit;
  /**
   * Overrides the cell type implied by `unit`. Use "number" for dimensionless
   * numeric columns and "boolean" for yes/no flags. A "lookup" column stores
   * text cells such as `100@25; 39@844`.
   */
  readonly kind?: TableColumnKind;
  /**
   * Default axis values for a lookup column, keyed by axis unit (such as
   * `{ '°C': 20, kPa: 101.325 }`). They fill in an axis the lookup leaves
   * unset, and a sample that omits a trailing coordinate.
   */
  readonly standards?: Readonly<Record<string, number>>;
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

/**
 * A table that is built the first time it is requested. Categories register
 * providers for large or programmatically generated tables (such as the
 * E-series value lists) so they are not constructed until something needs
 * them.
 */
export interface TableProvider {
  /** Stable identifier the built table must also use. */
  readonly id: string;
  /** Builds the table. Called once, then the result is cached. */
  build(): TableDefinition;
}

/** A table registered directly, or one that is built on first use. */
export type TableSource = TableDefinition | TableProvider;

/** Looks tables up by id for a calculator runtime. */
export interface TableResolver {
  getTable(id: string): TableDefinition | undefined;
}

/** A primitive value a config field can hold. */
export type ConfigValue = number | string | boolean;

/** A calculator's current settings, keyed by config field name. */
export type CalculatorConfig = Readonly<Record<string, ConfigValue>>;

/**
 * One user-adjustable setting that shapes a calculator's variable list. Config
 * is fixed when the calculator is built: the number and identity of variables
 * may depend on it, but never on the runtime values themselves.
 */
export interface ConfigFieldDefinition {
  readonly name: string;
  readonly label: string;
  readonly kind: 'number' | 'string' | 'boolean' | 'select';
  readonly description?: string;
  /** Value used when the caller supplies none. */
  readonly default: ConfigValue;
  /** Choices for a `select` field. Ignored for other kinds. */
  readonly options?: readonly string[];
  /** Smallest accepted value for a `number` field. */
  readonly min?: number;
  /** Largest accepted value for a `number` field. */
  readonly max?: number;
}

/** A calculator is pure data; all UI lives elsewhere. */
export interface CalculatorDefinition {
  /** URL-safe identifier, unique within its category. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  /**
   * Arbitrary HTML shown in the page heading after the description. Use it for
   * attribution links or other small notes.
   */
  readonly headerHtml?: string;
  /** Variables for the default config. */
  readonly variables: readonly VariableDefinition[];
  /** Settings a caller may adjust before the variable list is built. */
  readonly config?: readonly ConfigFieldDefinition[];
  /**
   * Builds the variable list for a config. Omit for a calculator whose
   * variables never change. The result must use the same names the config
   * keeps stable so values survive a config change.
   */
  readonly buildVariables?: (
    config: CalculatorConfig,
  ) => readonly VariableDefinition[];
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
  /**
   * When true alongside `computeState`, the runtime automatically re-runs
   * `computeState` after every editable input change, debounced by 300 ms.
   * In-flight runs are cancelled before each new trigger. The Run/Cancel
   * buttons are hidden. Defaults to false so manual-async calculators keep
   * their existing behaviour.
   */
  readonly autoComputeState?: boolean;
}

/** Shape of a lazily imported category module. */
export interface CategoryModule {
  readonly tables?: readonly TableSource[];
  readonly calculators: readonly CalculatorDefinition[];
}

/** Entry in the application manifest describing one lazy category. */
export interface CategoryManifestEntry {
  readonly title: string;
  readonly description: string;
  readonly load: () => Promise<CategoryModule>;
  /**
   * Tag name of the element that lists this category's calculators in place
   * of the usual tiles. Use it for categories whose calculators are created
   * by the user at runtime. The category module must define the element.
   */
  readonly hub?: string;
}

/** Manifest of every category the widget knows how to load. */
export type CategoryManifest = Readonly<Record<string, CategoryManifestEntry>>;

/** A validation message attached to a specific variable. */
export interface ValidationIssue {
  readonly variable: string;
  readonly label: string;
  readonly message: string;
}
