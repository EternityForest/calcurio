// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage } from '../bookmarks.js';
import { TableRowStore } from '../table-rows.js';
import type { TableDefinition, TableRow } from '../types.js';
import { LookupDialog } from './lookup-dialog.js';
import { TableRowDialog } from './table-row-dialog.js';
import { TableRowsDialog } from './table-rows-dialog.js';
import { TableView } from './table-view.js';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

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

function brassRow(): TableRow {
  return {
    id: 'brass',
    name: 'Brass',
    density: 8500,
    solid: true,
    specificHeat: '380@20; 400@200',
  };
}

async function mount(
  table: TableDefinition,
  store: TableRowStore | null,
): Promise<TableView> {
  const view = new TableView();
  view.table = table;
  view.store = store;
  document.body.append(view);
  await view.updateComplete;
  return view;
}

function button(view: TableView, testId: string): HTMLButtonElement {
  const found = view.querySelector<HTMLButtonElement>(
    `[data-testid="${testId}"]`,
  );
  if (found === null) {
    throw new Error(`Missing button ${testId}.`);
  }
  return found;
}

function typeInto(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

function rowInput(dialog: TableRowDialog, key: string): HTMLInputElement {
  const input = dialog.querySelector<HTMLInputElement>(
    `[data-testid="row-${key}"]`,
  );
  if (input === null) {
    throw new Error(`Missing row field ${key}.`);
  }
  return input;
}

describe('TableView', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('offers a lookup button that interpolates the cell', async () => {
    const view = await mount(sampleTable(), null);
    button(view, 'lookup-specificHeat-steel').click();
    await view.updateComplete;

    const dialog = view.querySelector('calc-lookup-dialog');
    if (!(dialog instanceof LookupDialog)) {
      throw new Error('Missing lookup dialog.');
    }
    await vi.waitFor(() => {
      expect(dialog.querySelector('dialog')?.open).toBe(true);
    });
    expect(dialog.textContent).toContain('460 J/(kg·K)');
  });

  it('offers a lookup button for a numeric lookup cell', async () => {
    const table: TableDefinition = {
      id: 'fluids',
      title: 'Fluids',
      keyColumn: 'id',
      labelColumn: 'name',
      columns: [
        { key: 'id', label: 'ID', kind: 'text' },
        { key: 'name', label: 'Name', kind: 'text' },
        {
          key: 'specificHeat',
          label: 'Specific heat',
          unit: 'J/(kg·K)@°C',
          kind: 'lookup',
        },
      ],
      rows: [{ id: 'water', name: 'Water', specificHeat: 4182 }],
    };
    const view = await mount(table, null);
    button(view, 'lookup-specificHeat-water').click();
    await view.updateComplete;

    const dialog = view.querySelector('calc-lookup-dialog');
    if (!(dialog instanceof LookupDialog)) {
      throw new Error('Missing lookup dialog.');
    }
    await vi.waitFor(() => {
      expect(dialog.querySelector('dialog')?.open).toBe(true);
    });
    expect(dialog.textContent).toContain('4182 J/(kg·K)');
  });

  it('hides the custom-row toolbar without a store', async () => {
    const view = await mount(sampleTable(), null);
    expect(view.querySelector('[data-testid="add-row"]')).toBeNull();
    expect(view.querySelector('[data-testid="override-steel"]')).toBeNull();
  });

  it('shows the custom-row toolbar with a store', async () => {
    const view = await mount(
      sampleTable(),
      new TableRowStore(new MemoryStorage()),
    );
    expect(view.querySelector('[data-testid="add-row"]')).not.toBeNull();
    expect(view.querySelector('[data-testid="export-rows"]')).not.toBeNull();
    expect(view.querySelector('[data-testid="override-steel"]')).not.toBeNull();
  });

  it('overrides a built-in row through the row dialog', async () => {
    const table = sampleTable();
    const store = new TableRowStore(new MemoryStorage());
    const view = await mount(table, store);
    const onChanged = vi.fn();
    view.onChanged = onChanged;

    button(view, 'override-steel').click();
    await view.updateComplete;

    const dialog = view.querySelector('calc-table-row-dialog');
    if (!(dialog instanceof TableRowDialog)) {
      throw new Error('Missing row dialog.');
    }
    await dialog.updateComplete;
    typeInto(rowInput(dialog, 'density'), '9000');
    await dialog.updateComplete;
    dialog
      .querySelector<HTMLButtonElement>('[data-testid="row-save"]')
      ?.click();
    await view.updateComplete;

    expect(store.has(table, 'steel')).toBe(true);
    expect(onChanged).toHaveBeenCalled();
    expect(view.textContent).toContain('9000');
    expect(view.querySelector('[data-testid="edit-steel"]')).not.toBeNull();
  });

  it('deletes a custom row only after a second click', async () => {
    const table = sampleTable();
    const store = new TableRowStore(new MemoryStorage());
    store.save(table, brassRow());
    const view = await mount(table, store);

    button(view, 'delete-brass').click();
    await view.updateComplete;
    expect(view.textContent).toContain('Confirm delete');
    expect(store.has(table, 'brass')).toBe(true);

    button(view, 'delete-brass').click();
    await view.updateComplete;
    expect(store.has(table, 'brass')).toBe(false);
  });

  it('exports custom rows as a markdown table', async () => {
    const table = sampleTable();
    const store = new TableRowStore(new MemoryStorage());
    store.save(table, brassRow());
    const view = await mount(table, store);

    button(view, 'export-rows').click();
    await view.updateComplete;

    const dialog = view.querySelector('calc-table-rows-dialog');
    if (!(dialog instanceof TableRowsDialog)) {
      throw new Error('Missing rows dialog.');
    }
    await dialog.updateComplete;
    const textarea = dialog.querySelector<HTMLTextAreaElement>(
      '[data-testid="rows-markdown"]',
    );
    expect(textarea?.value).toContain('| brass | Brass | 8500 |');
  });

  it('imports custom rows from pasted markdown', async () => {
    const table = sampleTable();
    const store = new TableRowStore(new MemoryStorage());
    const view = await mount(table, store);
    const onChanged = vi.fn();
    view.onChanged = onChanged;

    button(view, 'import-rows').click();
    await view.updateComplete;

    const dialog = view.querySelector('calc-table-rows-dialog');
    if (!(dialog instanceof TableRowsDialog)) {
      throw new Error('Missing rows dialog.');
    }
    await dialog.updateComplete;
    const textarea = dialog.querySelector<HTMLTextAreaElement>(
      '[data-testid="rows-markdown"]',
    );
    if (textarea === null) {
      throw new Error('Missing markdown textarea.');
    }
    const markdown = [
      '| ID | Name | Density (kg/m3) | Solid | Specific heat (J/(kg·K)@°C) |',
      '| --- | --- | --- | --- | --- |',
      '| brass | Brass | 8500 | yes | 380@20; 400@200 |',
      '',
    ].join('\n');
    typeIntoTextArea(textarea, markdown);
    dialog
      .querySelector<HTMLButtonElement>('[data-testid="import-markdown"]')
      ?.click();
    await dialog.updateComplete;

    expect(store.has(table, 'brass')).toBe(true);
    expect(onChanged).toHaveBeenCalled();
  });
});

function typeIntoTextArea(textarea: HTMLTextAreaElement, text: string): void {
  textarea.value = text;
  textarea.dispatchEvent(new Event('input'));
}
