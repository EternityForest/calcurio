import { TableDefinitionError } from './errors.js';
import type {
  TableCell,
  TableColumn,
  TableDefinition,
  TableProvider,
  TableResolver,
  TableRow,
  TableSource,
} from './types.js';
import { isValidIdentifier } from './validate.js';
import { parseCompositeUnit, tryDescribeUnit } from './units.js';
import type { UnitSymbol } from './units.js';
import { lookupCellOf } from './interpolate.js';

const COLUMN_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Narrows a registration to an on-demand table provider. */
function isTableProvider(source: TableSource): source is TableProvider {
  return 'build' in source;
}

/**
 * In-memory collection of tables keyed by id. Categories own one registry so a
 * calculator can only resolve tables that were registered with it. A table may
 * be registered directly or as a provider that builds it on first use.
 */
export class TableRegistry implements TableResolver {
  private readonly tables = new Map<string, TableDefinition>();
  private readonly providers = new Map<string, TableProvider>();

  constructor(tables: readonly TableSource[] = []) {
    for (const table of tables) {
      this.add(table);
    }
  }

  get size(): number {
    return this.tables.size + this.providers.size;
  }

  get all(): readonly TableDefinition[] {
    for (const id of [...this.providers.keys()]) {
      this.materialize(id);
    }
    return [...this.tables.values()];
  }

  getTable(id: string): TableDefinition | undefined {
    return this.materialize(id);
  }

  requireTable(id: string): TableDefinition {
    const table = this.getTable(id);
    if (table === undefined) {
      throw new TableDefinitionError(`Unknown table "${id}".`);
    }
    return table;
  }

  /**
   * Registers a table directly or as a provider built on first use.
   * Registering the identical definition twice is a no-op, which makes lazy
   * module loading safe to retry.
   */
  add(source: TableSource): TableSource {
    const existing =
      this.tables.get(source.id) ?? this.providers.get(source.id);
    if (existing !== undefined) {
      if (existing === source) {
        return existing;
      }
      throw new TableDefinitionError(
        `Table "${source.id}" is already registered.`,
      );
    }

    if (isTableProvider(source)) {
      if (!isValidIdentifier(source.id)) {
        throw new TableDefinitionError(
          `Table provider id "${source.id}" must use lowercase letters, ` +
            'digits, and hyphens.',
        );
      }
      this.providers.set(source.id, source);
      return source;
    }

    validateTableDefinition(source);
    this.tables.set(source.id, source);
    return source;
  }

  /**
   * Returns the table for an id, building and caching a provider on first use.
   * The built table is validated, and its id must match the provider's.
   */
  private materialize(id: string): TableDefinition | undefined {
    const cached = this.tables.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const provider = this.providers.get(id);
    if (provider === undefined) {
      return undefined;
    }
    const table = provider.build();
    validateTableDefinition(table);
    if (table.id !== provider.id) {
      throw new TableDefinitionError(
        `Table provider "${provider.id}" built a table with id "${table.id}".`,
      );
    }
    this.providers.delete(id);
    this.tables.set(id, table);
    return table;
  }
}

/** Rejects table data that would make selection or display unreliable. */
export function validateTableDefinition(table: TableDefinition): void {
  const problems: string[] = [];

  if (!isValidIdentifier(table.id)) {
    problems.push(
      `id "${table.id}" must use lowercase letters, digits, and hyphens.`,
    );
  }
  if (table.title.trim() === '') {
    problems.push('title must not be empty.');
  }
  if (table.columns.length === 0) {
    problems.push('at least one column is required.');
  }

  const columnsByKey = new Map<string, TableColumn>();
  for (const [index, column] of table.columns.entries()) {
    const where = `column ${index + 1} ("${column.key}")`;
    if (!COLUMN_KEY_PATTERN.test(column.key)) {
      problems.push(
        `${where}: key must start with a letter and contain only ` +
          'letters, digits, and underscores.',
      );
    } else if (columnsByKey.has(column.key)) {
      problems.push(`${where}: duplicate key.`);
    }
    columnsByKey.set(column.key, column);

    if (column.label.trim() === '') {
      problems.push(`${where}: label must not be empty.`);
    }
    if (
      column.kind !== undefined &&
      column.kind !== 'text' &&
      column.kind !== 'number' &&
      column.kind !== 'boolean' &&
      column.kind !== 'lookup'
    ) {
      problems.push(`${where}: unknown kind "${column.kind}".`);
    }
    if (column.unit !== undefined) {
      if (parseCompositeUnit(column.unit) === null) {
        if (tryDescribeUnit(column.unit) === null) {
          problems.push(`${where}: unknown unit "${column.unit}".`);
        }
      }
    }
    if (column.unit !== undefined && column.kind !== undefined) {
      if (column.kind === 'number') {
        if (parseCompositeUnit(column.unit) !== null) {
          problems.push(
            `${where}: a number column must not have a composite unit.`,
          );
        }
      } else if (column.kind === 'lookup') {
        if (parseCompositeUnit(column.unit) === null) {
          problems.push(
            `${where}: a lookup column must have a composite unit such as ` +
              '"kg/m3@°C".',
          );
        }
      } else {
        problems.push(
          `${where}: a ${column.kind} column must not have a unit.`,
        );
      }
    }
    if (column.standards !== undefined) {
      if (!isLookupColumn(column)) {
        problems.push(
          `${where}: standards are only allowed on a lookup column.`,
        );
      }
      const composite =
        column.unit === undefined ? null : parseCompositeUnit(column.unit);
      for (const [axis, value] of Object.entries(column.standards)) {
        if (
          composite === null ||
          !composite.axes.includes(axis as UnitSymbol)
        ) {
          problems.push(
            `${where}: standard "${axis}" is not one of the column's axes.`,
          );
        }
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          problems.push(
            `${where}: standard "${axis}" must be a finite number.`,
          );
        }
      }
    }
  }

  const keyColumn = columnsByKey.get(table.keyColumn);
  if (keyColumn === undefined) {
    problems.push(`key column "${table.keyColumn}" does not exist.`);
  } else if (!isTextColumn(keyColumn)) {
    problems.push(`key column "${table.keyColumn}" must be text.`);
  }

  const labelColumn = columnsByKey.get(table.labelColumn);
  if (labelColumn === undefined) {
    problems.push(`label column "${table.labelColumn}" does not exist.`);
  } else if (!isTextColumn(labelColumn)) {
    problems.push(`label column "${table.labelColumn}" must be text.`);
  }

  if (table.rows.length === 0) {
    problems.push('at least one row is required.');
  }

  const seenKeys = new Set<string>();
  for (const [index, row] of table.rows.entries()) {
    problems.push(
      ...tableRowProblems(table, row, `row ${index + 1}`, seenKeys),
    );
  }

  if (problems.length > 0) {
    throw new TableDefinitionError(
      `Invalid table "${table.id}":\n- ${problems.join('\n- ')}`,
    );
  }
}

/**
 * Returns the problems that make one row unusable, each labelled with `where`.
 * Pass the same `seenKeys` set for every row of a table so duplicate key values
 * are reported across rows; the set gains each accepted key as a side effect.
 * Shared by table validation and by the custom-row store and importers, so a
 * user-added row is held to the same rules as a built-in one.
 */
export function tableRowProblems(
  table: TableDefinition,
  row: TableRow,
  where: string,
  seenKeys: Set<string> = new Set<string>(),
): readonly string[] {
  const problems: string[] = [];
  const columnsByKey = new Map(
    table.columns.map((column) => [column.key, column]),
  );

  for (const column of table.columns) {
    if (!Object.hasOwn(row, column.key)) {
      problems.push(`${where}: missing column "${column.key}".`);
    }
  }
  for (const key of Object.keys(row)) {
    if (!columnsByKey.has(key)) {
      problems.push(`${where}: unknown column "${key}".`);
    }
  }

  const keyValue = row[table.keyColumn];
  if (typeof keyValue !== 'string' || keyValue.trim() === '') {
    problems.push(`${where}: key column must contain a non-empty string.`);
  } else if (seenKeys.has(keyValue)) {
    problems.push(`${where}: duplicate key "${keyValue}".`);
  } else {
    seenKeys.add(keyValue);
  }

  for (const column of table.columns) {
    const value = row[column.key];
    if (value === null || value === undefined) {
      continue;
    }
    if (isBooleanColumn(column)) {
      if (typeof value !== 'boolean') {
        problems.push(
          `${where}: boolean column "${column.key}" must be true or false.`,
        );
      }
    } else if (isLookupColumn(column)) {
      if (lookupCellOf(value) === null) {
        problems.push(
          `${where}: lookup column "${column.key}" must hold samples such as ` +
            '"100@25; 39@844" or a plain number.',
        );
      }
    } else if (isTextColumn(column)) {
      if (typeof value !== 'string') {
        problems.push(`${where}: text column "${column.key}" must be text.`);
      }
    } else if (typeof value !== 'number' || !Number.isFinite(value)) {
      problems.push(
        `${where}: numeric column "${column.key}" must be a finite number.`,
      );
    }
  }

  return problems;
}

/** True for columns that store text. */
export function isTextColumn(column: TableColumn): boolean {
  if (column.kind !== undefined) {
    return column.kind === 'text';
  }
  return column.unit === undefined;
}

/** True for columns that store numbers, with or without a unit. */
export function isNumericColumn(column: TableColumn): boolean {
  if (column.kind !== undefined) {
    return column.kind === 'number';
  }
  return column.unit !== undefined;
}

/** True for columns that store boolean yes/no flags. */
export function isBooleanColumn(column: TableColumn): boolean {
  return column.kind === 'boolean';
}

/** True for columns that store sampled lookup pairs. */
export function isLookupColumn(column: TableColumn): boolean {
  return column.kind === 'lookup';
}

/** Finds a column by key, or returns undefined. */
export function findColumn(
  table: TableDefinition,
  key: string,
): TableColumn | undefined {
  return table.columns.find((column) => column.key === key);
}

/** Converts a row's key column to a string, or null when it is not text. */
export function rowKey(table: TableDefinition, row: TableRow): string | null {
  const value = row[table.keyColumn];
  return typeof value === 'string' ? value : null;
}

/** Text shown for a row in selectors and table views. */
export function rowLabel(table: TableDefinition, row: TableRow): string {
  const value = row[table.labelColumn];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return rowKey(table, row) ?? '';
}

/** Finds a row by its key column value. */
export function findRow(
  table: TableDefinition,
  key: string,
): TableRow | undefined {
  return table.rows.find((row) => rowKey(table, row) === key);
}

/**
 * True when a row has a value in the column named by a table-select filter.
 * A null, undefined, or empty cell means the property is not set, so the row
 * is hidden from selectors that require it.
 */
export function rowMatchesFilter(
  row: TableRow,
  filter: string | undefined,
): boolean {
  if (filter === undefined) {
    return true;
  }
  const value = row[filter];
  return value !== null && value !== undefined && value !== '';
}

/** Narrows an unknown table cell to a finite number. */
export function numericCell(value: TableCell | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Narrows an unknown table cell to a boolean flag. */
export function booleanCell(value: TableCell | undefined): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/** Narrows an unknown table cell to a string. */
export function textCell(value: TableCell | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

/** Reads a numeric column, rejecting rows whose value is missing or null. */
export function requireNumber(row: TableRow, key: string): number {
  const value = numericCell(row[key]);
  if (value === null) {
    throw new Error(`Table row is missing numeric column "${key}".`);
  }
  return value;
}
