// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TableDefinition } from '../types.js';
import { TableRowDialog } from './table-row-dialog.js';

function sampleTable(): TableDefinition {
  return {
    id: 'materials',
    title: 'Materials',
    keyColumn: 'id',
    labelColumn: 'name',
    columns: [
      { key: 'id', label: 'ID', kind: 'text' },
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'density', label: 'Density', unit: 'kg/m^3', kind: 'number' },
      { key: 'solid', label: 'Solid', kind: 'boolean' },
      {
        key: 'specificHeat',
        label: 'Specific heat',
        unit: 'J/(kg K)@degC',
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
    ],
  };
}

async function mount(): Promise<TableRowDialog> {
  const dialog = new TableRowDialog();
  dialog.table = sampleTable();
  document.body.append(dialog);
  await dialog.updateComplete;
  return dialog;
}

async function open(
  mode: 'add' | 'edit' | 'override',
  row?: Record<string, string | number | boolean | null>,
): Promise<TableRowDialog> {
  const dialog = await mount();
  dialog.open(mode, row);
  await vi.waitFor(() => {
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });
  return dialog;
}

function field(
  dialog: TableRowDialog,
  key: string,
): HTMLInputElement | HTMLSelectElement {
  const found = dialog.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[data-testid="row-${key}"]`,
  );
  if (found === null) {
    throw new Error(`Missing field ${key}.`);
  }
  return found;
}

function save(dialog: TableRowDialog): void {
  dialog.querySelector<HTMLButtonElement>('[data-testid="row-save"]')?.click();
}

describe('TableRowDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('starts blank with an editable key when adding', async () => {
    const dialog = await open('add');
    expect(field(dialog, 'id').value).toBe('');
    expect(field(dialog, 'id').hasAttribute('readonly')).toBe(false);
  });

  it('prefills the row and locks the key when editing', async () => {
    const dialog = await open('edit', {
      id: 'steel',
      name: 'Steel',
      density: 7850,
      solid: true,
      specificHeat: '460@20; 600@500',
    });
    expect(field(dialog, 'id').value).toBe('steel');
    expect(field(dialog, 'id').hasAttribute('readonly')).toBe(true);
    expect(field(dialog, 'density').value).toBe('7850');
    expect(field(dialog, 'solid').value).toBe('yes');
  });

  it('submits the coerced row and closes on success', async () => {
    const dialog = await open('add');
    const onSubmit = vi.fn(() => ({ ok: true }));
    dialog.onSubmit = onSubmit;

    const id = field(dialog, 'id') as HTMLInputElement;
    id.value = 'brass';
    id.dispatchEvent(new Event('input'));
    const density = field(dialog, 'density') as HTMLInputElement;
    density.value = '8500';
    density.dispatchEvent(new Event('input'));
    await dialog.updateComplete;
    save(dialog);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'brass', density: 8500 }),
    );
    expect(dialog.querySelector('dialog')?.open).toBe(false);
  });

  it('keeps the dialog open and reports a rejected row', async () => {
    const dialog = await open('add');
    dialog.onSubmit = () => ({ ok: false, message: 'Nope.' });

    const id = field(dialog, 'id') as HTMLInputElement;
    id.value = 'brass';
    id.dispatchEvent(new Event('input'));
    await dialog.updateComplete;
    save(dialog);
    await dialog.updateComplete;

    expect(dialog.textContent).toContain('Nope.');
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });

  it('reports a malformed numeric cell without submitting', async () => {
    const dialog = await open('add');
    const onSubmit = vi.fn(() => ({ ok: true }));
    dialog.onSubmit = onSubmit;

    const id = field(dialog, 'id') as HTMLInputElement;
    id.value = 'brass';
    id.dispatchEvent(new Event('input'));
    const density = field(dialog, 'density') as HTMLInputElement;
    density.value = 'heavy';
    density.dispatchEvent(new Event('input'));
    await dialog.updateComplete;
    save(dialog);
    await dialog.updateComplete;

    expect(onSubmit).not.toHaveBeenCalled();
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });
});
