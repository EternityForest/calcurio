import { describe, expect, it } from 'vitest';
import { TableDefinitionError } from './errors.js';
import {
  TableRegistry,
  booleanCell,
  isBooleanColumn,
  isNumericColumn,
  isTextColumn,
  numericCell,
  requireNumber,
  textCell,
  validateTableDefinition,
} from './tables.js';
import type { TableColumn, TableDefinition } from './types.js';

describe('column kinds', () => {
  it('infers numeric columns from a unit', () => {
    const column: TableColumn = { key: 'r', label: 'R', unit: 'ohm' };
    expect(isNumericColumn(column)).toBe(true);
    expect(isTextColumn(column)).toBe(false);
    expect(isBooleanColumn(column)).toBe(false);
  });

  it('treats unitless columns as text by default', () => {
    const column: TableColumn = { key: 'c', label: 'Class' };
    expect(isTextColumn(column)).toBe(true);
    expect(isNumericColumn(column)).toBe(false);
  });

  it('honours an explicit number kind for unitless columns', () => {
    const column: TableColumn = {
      key: 'drop',
      label: 'Drop',
      kind: 'number',
    };
    expect(isNumericColumn(column)).toBe(true);
    expect(isTextColumn(column)).toBe(false);
  });

  it('honours an explicit boolean kind', () => {
    const column: TableColumn = {
      key: 'nonlinear',
      label: 'Nonlinear',
      kind: 'boolean',
    };
    expect(isBooleanColumn(column)).toBe(true);
    expect(isNumericColumn(column)).toBe(false);
    expect(isTextColumn(column)).toBe(false);
  });
});

describe('validateTableDefinition', () => {
  function table(columns: readonly TableColumn[]): TableDefinition {
    return {
      id: 'sample',
      title: 'Sample',
      keyColumn: 'id',
      labelColumn: 'label',
      columns,
      rows: [],
    };
  }

  const baseColumns: readonly TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
  ];

  it('accepts unitless numeric and boolean columns', () => {
    const definition: TableDefinition = {
      id: 'parts',
      title: 'Parts',
      keyColumn: 'id',
      labelColumn: 'label',
      columns: [
        ...baseColumns,
        { key: 'drop', label: 'Drop', kind: 'number' },
        { key: 'nonlinear', label: 'Nonlinear', kind: 'boolean' },
      ],
      rows: [
        { id: 'a', label: 'A', drop: 0.2, nonlinear: true },
        { id: 'b', label: 'B', drop: null, nonlinear: false },
      ],
    };
    expect(() => validateTableDefinition(definition)).not.toThrow();
  });

  it('rejects a boolean column with a unit', () => {
    expect(() =>
      validateTableDefinition(
        table([
          ...baseColumns,
          { key: 'flag', label: 'Flag', kind: 'boolean', unit: 'V' },
        ]),
      ),
    ).toThrow(TableDefinitionError);
  });

  it('rejects a text column with a unit', () => {
    expect(() =>
      validateTableDefinition(
        table([
          ...baseColumns,
          { key: 'kind', label: 'Kind', kind: 'text', unit: 'V' },
        ]),
      ),
    ).toThrow(TableDefinitionError);
  });

  it('rejects an unknown kind', () => {
    const column = {
      key: 'x',
      label: 'X',
      kind: 'yes',
    } as unknown as TableColumn;
    expect(() =>
      validateTableDefinition(table([...baseColumns, column])),
    ).toThrow(TableDefinitionError);
  });

  it('rejects a numeric cell in a boolean column', () => {
    const definition: TableDefinition = {
      ...table([
        ...baseColumns,
        { key: 'flag', label: 'Flag', kind: 'boolean' },
      ]),
      rows: [{ id: 'a', label: 'A', flag: 1 }],
    };
    expect(() => validateTableDefinition(definition)).toThrow(
      TableDefinitionError,
    );
  });

  it('rejects a string cell in a numeric column', () => {
    const definition: TableDefinition = {
      ...table([...baseColumns, { key: 'n', label: 'N', kind: 'number' }]),
      rows: [{ id: 'a', label: 'A', n: 'big' }],
    };
    expect(() => validateTableDefinition(definition)).toThrow(
      TableDefinitionError,
    );
  });
});

describe('cell helpers', () => {
  it('reads numbers, booleans, and text', () => {
    expect(numericCell(3)).toBe(3);
    expect(numericCell('x')).toBeNull();
    expect(numericCell(Number.NaN)).toBeNull();
    expect(booleanCell(true)).toBe(true);
    expect(booleanCell('yes')).toBeNull();
    expect(textCell('a')).toBe('a');
    expect(textCell(2)).toBeNull();
  });

  it('requireNumber throws for a missing column', () => {
    expect(requireNumber({ a: 1 }, 'a')).toBe(1);
    expect(() => requireNumber({ a: 1 }, 'b')).toThrow(/numeric column/);
  });
});

describe('TableRegistry', () => {
  const table: TableDefinition = {
    id: 'sample',
    title: 'Sample',
    keyColumn: 'id',
    labelColumn: 'label',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'label', label: 'Label' },
    ],
    rows: [{ id: 'a', label: 'A' }],
  };

  it('registers and resolves tables', () => {
    const registry = new TableRegistry([table]);
    expect(registry.getTable('sample')).toBe(table);
    expect(registry.requireTable('sample')).toBe(table);
    expect(registry.size).toBe(1);
  });

  it('throws for an unknown table', () => {
    const registry = new TableRegistry();
    expect(() => registry.requireTable('missing')).toThrow(
      TableDefinitionError,
    );
  });
});
