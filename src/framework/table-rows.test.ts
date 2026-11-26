import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from './bookmarks.js';
import { TableRowsStorageError } from './errors.js';
import {
  MAX_CUSTOM_ROWS_PER_TABLE,
  TABLE_ROWS_STORAGE_KEY,
  TableRowStore,
  applyTableRows,
  browserLocalStorage,
  exportTableRowsMarkdown,
  parseTableRowsMarkdown,
} from './table-rows.js';
import type { TableDefinition, TableRow } from './types.js';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function sampleTable(): TableDefinition {
  return {
    id: 'materials',
    title: 'Materials',
    keyColumn: 'id',
    labelColumn: 'name',
    columns: [
      { key: 'id', label: 'ID', kind: 'text' },
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'density', label: 'Density', unit: 'kg/m3', kind: 'number' },
      { key: 'solid', label: 'Solid', kind: 'boolean' },
      {
        key: 'specificHeat',
        label: 'Specific heat',
        unit: 'J/(kg·K)@°C',
        kind: 'lookup',
      },
    ],
    rows: [
      {
        id: 'steel',
        name: 'Steel',
        density: 7850,
        solid: true,
        specificHeat: '460@20; 600@500',
      },
      {
        id: 'water',
        name: 'Water',
        density: 998,
        solid: false,
        specificHeat: '4182@20; 4200@100',
      },
    ],
  };
}

function customRow(overrides: Partial<TableRow> = {}): TableRow {
  return {
    id: 'brass',
    name: 'Brass',
    density: 8500,
    solid: true,
    specificHeat: '380@20; 400@200',
    ...overrides,
  };
}

describe('TableRowStore', () => {
  it('starts empty', () => {
    const store = new TableRowStore(new MemoryStorage());
    expect(store.list('materials')).toEqual([]);
  });

  it('saves rows and lists them in insertion order', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    store.save(table, customRow());
    store.save(table, customRow({ id: 'copper', name: 'Copper' }));
    expect(store.list('materials').map((row) => row['id'])).toEqual([
      'brass',
      'copper',
    ]);
  });

  it('returns a copy so callers cannot mutate stored rows', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    store.save(table, customRow());
    const listed = store.list('materials')[0]!;
    (listed as Record<string, unknown>)['name'] = 'Changed';
    expect(store.list('materials')[0]!['name']).toBe('Brass');
  });

  it('upserts a row with the same key', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    store.save(table, customRow());
    store.save(table, customRow({ name: 'Brass (edited)' }));
    const rows = store.list('materials');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['name']).toBe('Brass (edited)');
  });

  it('reports membership and deletes by key', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    store.save(table, customRow());
    expect(store.has(table, 'brass')).toBe(true);
    expect(store.has(table, 'steel')).toBe(false);
    store.delete(table, 'brass');
    expect(store.has(table, 'brass')).toBe(false);
  });

  it('rejects deleting a row that is not there', () => {
    const store = new TableRowStore(new MemoryStorage());
    expect(() => store.delete(sampleTable(), 'missing')).toThrow(
      TableRowsStorageError,
    );
  });

  it('rejects a row with a blank key', () => {
    const store = new TableRowStore(new MemoryStorage());
    expect(() => store.save(sampleTable(), customRow({ id: '' }))).toThrow(
      TableRowsStorageError,
    );
  });

  it('rejects a row with a malformed lookup cell', () => {
    const store = new TableRowStore(new MemoryStorage());
    expect(() =>
      store.save(sampleTable(), customRow({ specificHeat: 'not-a-lookup' })),
    ).toThrow(TableRowsStorageError);
  });

  it('accepts a plain number in a lookup column', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    store.save(table, customRow({ specificHeat: 4182 }));
    expect(store.list('materials')[0]!['specificHeat']).toBe(4182);
  });

  it('caps the number of custom rows per table', () => {
    const store = new TableRowStore(new MemoryStorage());
    const table = sampleTable();
    for (let index = 0; index < MAX_CUSTOM_ROWS_PER_TABLE; index += 1) {
      store.save(table, customRow({ id: `row-${index}` }));
    }
    expect(() => store.save(table, customRow({ id: 'overflow' }))).toThrow(
      TableRowsStorageError,
    );
    // Replacing an existing row is still allowed at the cap.
    expect(() =>
      store.save(table, customRow({ id: 'row-0', name: 'Updated' })),
    ).not.toThrow();
  });

  it('raises on corrupted stored JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(TABLE_ROWS_STORAGE_KEY, '{not json');
    const store = new TableRowStore(storage);
    expect(() => store.list('materials')).toThrow(TableRowsStorageError);
  });

  it('raises on an unsupported stored version', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      TABLE_ROWS_STORAGE_KEY,
      JSON.stringify({ version: 2, byTable: {} }),
    );
    const store = new TableRowStore(storage);
    expect(() => store.list('materials')).toThrow(TableRowsStorageError);
  });
});

describe('applyTableRows', () => {
  it('returns the base table when there is nothing to overlay', () => {
    const table = sampleTable();
    expect(applyTableRows(table, [])).toBe(table);
  });

  it('overrides a built-in row in place and appends the rest', () => {
    const table = sampleTable();
    const merged = applyTableRows(table, [
      customRow({ id: 'steel', name: 'Steel (alloy)' }),
      customRow({ id: 'brass' }),
    ]);
    expect(merged.rows.map((row) => row['id'])).toEqual([
      'steel',
      'water',
      'brass',
    ]);
    expect(merged.rows[0]!['name']).toBe('Steel (alloy)');
    // The base table is untouched.
    expect(table.rows[0]!['name']).toBe('Steel');
  });

  it('ignores rows without a usable key', () => {
    const table = sampleTable();
    const merged = applyTableRows(table, [customRow({ id: '' })]);
    expect(merged.rows).toHaveLength(2);
  });
});

describe('exportTableRowsMarkdown', () => {
  it('writes a GitHub-flavoured table with units in the headers', () => {
    const markdown = exportTableRowsMarkdown(sampleTable(), [customRow()]);
    expect(markdown).toBe(
      [
        '| ID | Name | Density (kg/m3) | Solid | Specific heat (J/(kg·K)@°C) |',
        '| --- | --- | --- | --- | --- |',
        '| brass | Brass | 8500 | yes | 380@20; 400@200 |',
        '',
      ].join('\n'),
    );
  });

  it('leaves empty cells blank', () => {
    const markdown = exportTableRowsMarkdown(sampleTable(), [
      customRow({ density: null, solid: null, specificHeat: null }),
    ]);
    const row = markdown.split('\n')[2]!;
    expect(row).toBe('| brass | Brass |  |  |  |');
  });

  it('writes a numeric lookup cell verbatim', () => {
    const markdown = exportTableRowsMarkdown(sampleTable(), [
      customRow({ specificHeat: 4182 }),
    ]);
    const row = markdown.split('\n')[2]!;
    expect(row).toBe('| brass | Brass | 8500 | yes | 4182 |');
  });
});

describe('parseTableRowsMarkdown', () => {
  it('round-trips exported rows', () => {
    const table = sampleTable();
    const rows = [customRow(), customRow({ id: 'copper', name: 'Copper' })];
    const parsed = parseTableRowsMarkdown(
      table,
      exportTableRowsMarkdown(table, rows),
    );
    expect(parsed).toEqual(rows);
  });

  it('round-trips a numeric lookup cell as a number', () => {
    const table = sampleTable();
    const rows = [customRow({ specificHeat: 4182 })];
    const parsed = parseTableRowsMarkdown(
      table,
      exportTableRowsMarkdown(table, rows),
    );
    expect(parsed).toEqual(rows);
  });

  it('accepts blank cells as null', () => {
    const parsed = parseTableRowsMarkdown(
      sampleTable(),
      [
        '| ID | Name | Density | Solid | Specific heat |',
        '| --- | --- | --- | --- | --- |',
        '| brass | Brass |  |  |  |',
      ].join('\n'),
    );
    expect(parsed).toEqual([
      {
        id: 'brass',
        name: 'Brass',
        density: null,
        solid: null,
        specificHeat: null,
      },
    ]);
  });

  it('rejects an unknown column', () => {
    expect(() =>
      parseTableRowsMarkdown(
        sampleTable(),
        ['| ID | Mystery |', '| --- | --- |', '| brass | 1 |'].join('\n'),
      ),
    ).toThrow(TableRowsStorageError);
  });

  it('rejects a missing separator row', () => {
    expect(() =>
      parseTableRowsMarkdown(
        sampleTable(),
        ['| ID | Name |', '| brass | Brass |'].join('\n'),
      ),
    ).toThrow(TableRowsStorageError);
  });

  it('rejects a non-numeric value in a numeric column', () => {
    expect(() =>
      parseTableRowsMarkdown(
        sampleTable(),
        [
          '| ID | Name | Density | Solid | Specific heat |',
          '| --- | --- | --- | --- | --- |',
          '| brass | Brass | heavy | yes | 380@20 |',
        ].join('\n'),
      ),
    ).toThrow(TableRowsStorageError);
  });

  it('rejects a malformed lookup cell', () => {
    expect(() =>
      parseTableRowsMarkdown(
        sampleTable(),
        [
          '| ID | Name | Density | Solid | Specific heat |',
          '| --- | --- | --- | --- | --- |',
          '| brass | Brass | 8500 | yes | nope |',
        ].join('\n'),
      ),
    ).toThrow(TableRowsStorageError);
  });

  it('unescapes pipes inside cells', () => {
    const parsed = parseTableRowsMarkdown(
      sampleTable(),
      [
        '| ID | Name | Density | Solid | Specific heat |',
        '| --- | --- | --- | --- | --- |',
        '| brass | A \\| B | 8500 | yes | 380@20 |',
      ].join('\n'),
    );
    expect(parsed[0]!['name']).toBe('A | B');
  });
});

describe('browserLocalStorage', () => {
  it('returns null when localStorage is unavailable', () => {
    expect(browserLocalStorage()).toBeNull();
  });
});
