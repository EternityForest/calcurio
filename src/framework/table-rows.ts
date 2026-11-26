import type { KeyValueStorage } from './bookmarks.js';
import { TableRowsStorageError, errorMessage } from './errors.js';
import { formatNumber, parseNumberText } from './format.js';
import { parseLookupCell } from './interpolate.js';
import {
  isBooleanColumn,
  isLookupColumn,
  isNumericColumn,
  tableRowProblems,
} from './tables.js';
import type {
  TableCell,
  TableColumn,
  TableDefinition,
  TableRow,
} from './types.js';

/** localStorage key holding every user-added table row. */
export const TABLE_ROWS_STORAGE_KEY = 'calcurio.tableRows.v1';
/** Most custom rows a single table may keep. */
export const MAX_CUSTOM_ROWS_PER_TABLE = 500;
/** Longest text cell accepted from a stored or pasted row. */
export const MAX_TABLE_CELL_TEXT_LENGTH = 500;

interface StoredTableRows {
  readonly version: 1;
  readonly byTable: Record<string, TableRow[]>;
}

/**
 * Persists user-added table rows in localStorage, keyed by table id. A stored
 * row whose key column matches a built-in row overrides it; any other row is
 * appended. Every read re-parses the stored JSON, so corrupted data raises
 * instead of being silently discarded, mirroring `BookmarkStore`.
 */
export class TableRowStore {
  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
  }

  /** Custom rows for one table, in the order they were added. */
  list(tableId: string): readonly TableRow[] {
    return (this.readIndex().byTable[tableId] ?? []).map(cloneRow);
  }

  /** True when a custom row already uses this key column value. */
  has(table: TableDefinition, key: string): boolean {
    return (this.readIndex().byTable[table.id] ?? []).some(
      (row) => row[table.keyColumn] === key,
    );
  }

  /**
   * Inserts or replaces a custom row by its key column value. The row is
   * validated against the table before anything is written.
   */
  save(table: TableDefinition, row: TableRow): TableRow {
    assertValidRow(table, row, 'Custom row');
    const key = requireKey(table, row);
    const index = this.readIndex();
    const rows = index.byTable[table.id] ?? [];
    const existing = rows.findIndex((entry) => entry[table.keyColumn] === key);
    if (existing === -1 && rows.length >= MAX_CUSTOM_ROWS_PER_TABLE) {
      throw new TableRowsStorageError(
        `"${table.title}" already has ${MAX_CUSTOM_ROWS_PER_TABLE} custom ` +
          'rows. Delete one before adding another.',
      );
    }

    const next = [...rows];
    const stored = cloneRow(row);
    if (existing === -1) {
      next.push(stored);
    } else {
      next[existing] = stored;
    }
    this.writeIndex({
      version: 1,
      byTable: { ...index.byTable, [table.id]: next },
    });
    return cloneRow(row);
  }

  /** Removes one custom row by its key column value. */
  delete(table: TableDefinition, key: string): void {
    const index = this.readIndex();
    const rows = index.byTable[table.id] ?? [];
    const remaining = rows.filter((row) => row[table.keyColumn] !== key);
    if (remaining.length === rows.length) {
      throw new TableRowsStorageError('That custom row no longer exists.');
    }
    this.writeIndex({
      version: 1,
      byTable: { ...index.byTable, [table.id]: remaining },
    });
  }

  private readIndex(): StoredTableRows {
    let raw: string | null;
    try {
      raw = this.storage.getItem(TABLE_ROWS_STORAGE_KEY);
    } catch (error) {
      throw new TableRowsStorageError(
        `Could not read table rows: ${errorMessage(error)}`,
        { cause: error },
      );
    }
    if (raw === null || raw === '') {
      return { version: 1, byTable: {} };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new TableRowsStorageError(
        'Table row data is not valid JSON and was not changed.',
        { cause: error },
      );
    }
    return parseIndex(parsed);
  }

  private writeIndex(index: StoredTableRows): void {
    try {
      this.storage.setItem(TABLE_ROWS_STORAGE_KEY, JSON.stringify(index));
    } catch (error) {
      throw new TableRowsStorageError(
        `Could not save table rows: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }
}

/** Returns localStorage when the browser allows it, otherwise null. */
export function browserLocalStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Overlays custom rows onto a table. A custom row whose key column value
 * matches a built-in row replaces it in place; the rest are appended in order.
 * Returns the table unchanged when there is nothing to overlay.
 */
export function applyTableRows(
  base: TableDefinition,
  custom: readonly TableRow[],
): TableDefinition {
  if (custom.length === 0) {
    return base;
  }

  const baseKeys = new Set<string>();
  for (const row of base.rows) {
    const key = row[base.keyColumn];
    if (typeof key === 'string') {
      baseKeys.add(key);
    }
  }

  const overrides = new Map<string, TableRow>();
  const appended: TableRow[] = [];
  for (const row of custom) {
    const key = row[base.keyColumn];
    if (typeof key !== 'string' || key.trim() === '') {
      continue;
    }
    if (baseKeys.has(key)) {
      overrides.set(key, row);
    } else {
      appended.push(row);
    }
  }
  if (overrides.size === 0 && appended.length === 0) {
    return base;
  }

  const rows: TableRow[] = base.rows.map((row) => {
    const key = row[base.keyColumn];
    const override = typeof key === 'string' ? overrides.get(key) : undefined;
    return override ?? row;
  });
  rows.push(...appended);
  return { ...base, rows };
}

/**
 * Renders custom rows as a GitHub-flavoured markdown table. Header cells use
 * each column's label and unit; boolean cells become yes/no, lookup cells are
 * written verbatim, and empty cells stay empty.
 */
export function exportTableRowsMarkdown(
  table: TableDefinition,
  rows: readonly TableRow[],
): string {
  const headers = table.columns.map((column) => headerFor(column));
  const lines: string[] = [
    `| ${headers.join(' | ')} |`,
    `| ${table.columns.map(() => '---').join(' | ')} |`,
  ];
  for (const row of rows) {
    const cells = table.columns.map((column) =>
      formatCell(column, row[column.key]),
    );
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Parses a pasted GitHub-flavoured markdown table into rows for `table`.
 * Headers are matched by column key, label, or `label (unit)`. Every row is
 * validated before it is returned, so a bad paste raises with the reason.
 */
export function parseTableRowsMarkdown(
  table: TableDefinition,
  text: string,
): readonly TableRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (lines.length < 2) {
    throw invalid(
      'A markdown table needs a header row and a "---" separator row.',
    );
  }

  const headerCells = splitRow(lines[0]!);
  const columns = headerCells.map((cell) => resolveColumn(table, cell));
  const unknown = headerCells.filter(
    (_, index) => columns[index] === undefined,
  );
  if (unknown.length > 0) {
    throw invalid(`Unknown column(s): ${unknown.join(', ')}.`);
  }
  const keys = columns as TableColumn[];

  if (!isSeparatorRow(lines[1]!)) {
    throw invalid(
      'The second line must be a markdown separator such as "---".',
    );
  }

  const rows: TableRow[] = [];
  const problems: string[] = [];
  const seenKeys = new Set<string>();
  for (let index = 2; index < lines.length; index += 1) {
    const cells = splitRow(lines[index]!);
    const row: Record<string, TableCell> = {};
    for (const column of table.columns) {
      row[column.key] = null;
    }
    const where = `Row ${index - 1}`;
    for (let position = 0; position < keys.length; position += 1) {
      const column = keys[position]!;
      try {
        row[column.key] = coerceCell(column, cells[position] ?? '');
      } catch (error) {
        problems.push(`${where}: ${errorMessage(error)}`);
      }
    }
    problems.push(...tableRowProblems(table, row, where, seenKeys));
    rows.push(row);
  }

  if (problems.length > 0) {
    throw invalid(`The markdown table is invalid:\n- ${problems.join('\n- ')}`);
  }
  return rows;
}

function parseIndex(value: unknown): StoredTableRows {
  if (!isRecord(value)) {
    throw invalidStorage('Table row data must be an object.');
  }
  if (value['version'] !== 1) {
    throw invalidStorage(
      'Table row data has an unsupported version and was not changed.',
    );
  }
  const rawByTable = value['byTable'];
  if (!isRecord(rawByTable)) {
    throw invalidStorage('Table row data must contain a "byTable" object.');
  }

  const byTable: Record<string, TableRow[]> = {};
  for (const [tableId, rawRows] of Object.entries(rawByTable)) {
    if (!Array.isArray(rawRows)) {
      throw invalidStorage(`Rows for "${tableId}" must be an array.`);
    }
    byTable[tableId] = rawRows.map((raw, index) =>
      parseStoredRow(raw, tableId, index),
    );
  }
  return { version: 1, byTable };
}

function parseStoredRow(
  value: unknown,
  tableId: string,
  index: number,
): TableRow {
  const where = `Row ${index + 1} for table "${tableId}"`;
  if (!isRecord(value)) {
    throw invalidStorage(`${where} must be an object.`);
  }
  const row: Record<string, TableCell> = {};
  for (const [key, raw] of Object.entries(value)) {
    row[key] = parseStoredCell(raw, `${where} column "${key}"`);
  }
  return row;
}

function parseStoredCell(value: unknown, where: string): TableCell {
  if (value === null) {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalidStorage(`${where} must be a finite number.`);
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.length > MAX_TABLE_CELL_TEXT_LENGTH) {
      throw invalidStorage(`${where} is too long.`);
    }
    return value;
  }
  throw invalidStorage(`${where} must be text, a number, true/false, or null.`);
}

function requireKey(table: TableDefinition, row: TableRow): string {
  const key = row[table.keyColumn];
  if (typeof key !== 'string' || key.trim() === '') {
    throw invalid(`A custom row needs a non-empty "${table.keyColumn}" value.`);
  }
  return key;
}

function assertValidRow(
  table: TableDefinition,
  row: TableRow,
  where: string,
): void {
  const problems = tableRowProblems(table, row, where);
  if (problems.length > 0) {
    throw invalid(problems.join('\n'));
  }
}

function headerFor(column: TableColumn): string {
  const label = escapeCell(column.label);
  return column.unit === undefined
    ? label
    : `${label} (${escapeCell(String(column.unit))})`;
}

function formatCell(column: TableColumn, cell: TableCell | undefined): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  if (isBooleanColumn(column) && typeof cell === 'boolean') {
    return cell ? 'yes' : 'no';
  }
  if (isNumericColumn(column) && typeof cell === 'number') {
    return formatNumber(cell);
  }
  return escapeCell(String(cell));
}

function coerceCell(column: TableColumn, text: string): TableCell {
  const trimmed = text.trim();
  if (isBooleanColumn(column)) {
    if (trimmed === '') {
      return null;
    }
    const lower = trimmed.toLowerCase();
    if (['yes', 'true', '1', 'y'].includes(lower)) {
      return true;
    }
    if (['no', 'false', '0', 'n'].includes(lower)) {
      return false;
    }
    throw invalid(`"${trimmed}" is not a yes/no value.`);
  }
  if (trimmed === '') {
    return null;
  }
  if (isNumericColumn(column)) {
    try {
      return parseNumberText(trimmed);
    } catch (error) {
      throw invalid(errorMessage(error));
    }
  }
  if (isLookupColumn(column)) {
    if (parseLookupCell(trimmed) === null) {
      throw invalid(`"${trimmed}" is not a lookup value.`);
    }
    return trimmed;
  }
  return trimmed;
}

function resolveColumn(
  table: TableDefinition,
  header: string,
): TableColumn | undefined {
  const text = header.trim();
  for (const column of table.columns) {
    if (column.key === text || column.label === text) {
      return column;
    }
    if (
      column.unit !== undefined &&
      `${column.label} (${String(column.unit)})` === text
    ) {
      return column;
    }
  }
  return undefined;
}

function isSeparatorRow(line: string): boolean {
  const cells = splitRow(line);
  return (
    cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell.trim()))
  );
}

/** Splits a markdown row on unescaped pipes, unescaping `\|` and `\\`. */
function splitRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith('|')) {
    text = text.slice(1);
  }
  if (text.endsWith('|')) {
    text = text.slice(0, -1);
  }

  const cells: string[] = [];
  let current = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (char === '\\' && index + 1 < text.length) {
      const next = text[index + 1]!;
      current += next === '|' || next === '\\' ? next : `\\${next}`;
      index += 1;
      continue;
    }
    if (char === '|') {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function escapeCell(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function cloneRow(row: TableRow): TableRow {
  return { ...row };
}

function invalid(message: string): TableRowsStorageError {
  return new TableRowsStorageError(message);
}

function invalidStorage(message: string): TableRowsStorageError {
  return new TableRowsStorageError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
