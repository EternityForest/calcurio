// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TableDefinition } from '../types.js';
import { TableRowsDialog } from './table-rows-dialog.js';

function sampleTable(): TableDefinition {
  return {
    id: 'materials',
    title: 'Materials',
    keyColumn: 'id',
    labelColumn: 'name',
    columns: [
      { key: 'id', label: 'ID', kind: 'text' },
      { key: 'name', label: 'Name', kind: 'text' },
    ],
    rows: [{ id: 'steel', name: 'Steel' }],
  };
}

async function mount(): Promise<TableRowsDialog> {
  const dialog = new TableRowsDialog();
  dialog.table = sampleTable();
  document.body.append(dialog);
  await dialog.updateComplete;
  return dialog;
}

async function open(
  mode: 'export' | 'import',
  content = '',
): Promise<TableRowsDialog> {
  const dialog = await mount();
  dialog.open(mode, content);
  await vi.waitFor(() => {
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });
  return dialog;
}

function textarea(dialog: TableRowsDialog): HTMLTextAreaElement {
  const found = dialog.querySelector<HTMLTextAreaElement>(
    '[data-testid="rows-markdown"]',
  );
  if (found === null) {
    throw new Error('Missing markdown textarea.');
  }
  return found;
}

describe('TableRowsDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('shows exported markdown read-only', async () => {
    const dialog = await open('export', '| ID |\n| --- |\n| steel |\n');
    expect(textarea(dialog).readOnly).toBe(true);
    expect(textarea(dialog).value).toContain('| steel |');
    expect(
      dialog.querySelector('[data-testid="copy-markdown"]'),
    ).not.toBeNull();
    expect(
      dialog.querySelector('[data-testid="download-markdown"]'),
    ).not.toBeNull();
  });

  it('accepts pasted markdown when importing', async () => {
    const dialog = await open('import');
    expect(textarea(dialog).readOnly).toBe(false);
    expect(
      dialog.querySelector('[data-testid="import-markdown"]'),
    ).not.toBeNull();
  });

  it('imports the pasted text and reports the result', async () => {
    const dialog = await open('import');
    const onImport = vi.fn(() => ({ ok: true, message: 'Imported 1 row.' }));
    dialog.onImport = onImport;

    textarea(dialog).value = '| ID | Name |\n| --- | --- |\n| brass | Brass |';
    textarea(dialog).dispatchEvent(new Event('input'));
    dialog
      .querySelector<HTMLButtonElement>('[data-testid="import-markdown"]')
      ?.click();
    await dialog.updateComplete;

    expect(onImport).toHaveBeenCalledWith(
      '| ID | Name |\n| --- | --- |\n| brass | Brass |',
    );
    expect(dialog.textContent).toContain('Imported 1 row.');
  });

  it('reports an import that fails', async () => {
    const dialog = await open('import');
    dialog.onImport = () => ({ ok: false, message: 'Unknown column.' });

    dialog
      .querySelector<HTMLButtonElement>('[data-testid="import-markdown"]')
      ?.click();
    await dialog.updateComplete;

    expect(dialog.textContent).toContain('Unknown column.');
  });

  it('copies the markdown to the clipboard', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const dialog = await open('export', '| ID |\n| --- |\n| steel |\n');

    dialog
      .querySelector<HTMLButtonElement>('[data-testid="copy-markdown"]')
      ?.click();
    await vi.waitFor(() => {
      expect(dialog.textContent).toContain('Copied');
    });
    expect(writeText).toHaveBeenCalledWith('| ID |\n| --- |\n| steel |\n');
  });

  it('downloads the markdown as a file', async () => {
    const createObjectURL = vi.fn(() => 'blob:markdown');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    const dialog = await open('export', '| ID |\n| --- |\n| steel |\n');

    dialog
      .querySelector<HTMLButtonElement>('[data-testid="download-markdown"]')
      ?.click();
    await dialog.updateComplete;

    expect(createObjectURL).toHaveBeenCalled();
    expect(dialog.textContent).toContain('Downloaded materials.md');
  });
});
