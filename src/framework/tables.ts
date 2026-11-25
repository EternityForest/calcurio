import { TableDefinitionError } from './errors.js';
import type {
  TableCell,
  TableColumn,
  TableDefinition,
  TableResolver,
  TableRow,
} from './types.js';
import { isValidIdentifier } from './validate.js';
import { tryDescribeUnit } from './units.js';

const COLUMN_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/**
 * In-memory collection of tables keyed by id. Categories own one registry so a
 * calculator can only resolve tables that were registered with it.
 */
export class TableRegistry implements TableResolver {
  private readonly tables = new Map<string, TableDefinition>();

  constructor(tables: readonly TableDefinition[] = []) {
    for (const table of tables) {
      this.add(table);
    }
  }

  get size(): number {
    return this.tables.size;
  }

  get all(): readonly TableDefinition[] {
    return [...this.tables.values()];
  }

  getTable(id: string): TableDefinition | undefined {
    return this.tables.get(id);
  }

  requireTable(id: string): TableDefinition {
    const table = this.tables.get(id);
    if (table === undefined) {
      throw new TableDefinitionError(`Unknown table "${id}".`);
    }
    return table;
  }

  /**
   * Registers a table. Registering the identical definition twice is a no-op,
   * which makes lazy module loading safe to retry.
   */
  add(table: TableDefinition): TableDefinition {
    validateTableDefinition(table);
    const existing = this.tables.get(table.id);
    if (existing !== undefined) {
      if (existing === table) {
        return existing;
      }
      throw new TableDefinitionError(
        `Table "${table.id}" is already registered.`,
      );
    }
    this.tables.set(table.id, table);
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
    if (column.unit !== undefined && tryDescribeUnit(column.unit) === null) {
      problems.push(`${where}: unknown unit "${column.unit}".`);
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
    const where = `row ${index + 1}`;
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
      if (isTextColumn(column)) {
        if (typeof value !== 'string') {
          problems.push(`${where}: text column "${column.key}" must be text.`);
        }
      } else if (typeof value !== 'number' || !Number.isFinite(value)) {
        problems.push(
          `${where}: numeric column "${column.key}" must be a finite number.`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new TableDefinitionError(
      `Invalid table "${table.id}":\n- ${problems.join('\n- ')}`,
    );
  }
}

/** True for columns without a unit, which store text. */
export function isTextColumn(column: TableColumn): boolean {
  return column.unit === undefined;
}

/** True for columns with a unit, which store numbers. */
export function isNumericColumn(column: TableColumn): boolean {
  return column.unit !== undefined;
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

/** Narrows an unknown table cell to a finite number. */
export function numericCell(value: TableCell | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}