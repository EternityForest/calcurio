// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TableColumn } from '../types.js';
import { LookupDialog } from './lookup-dialog.js';

const heatColumn: TableColumn = {
  key: 'specificHeat',
  label: 'Specific heat',
  unit: 'J/(kg·K)@°C',
  kind: 'lookup',
};

const densityColumn: TableColumn = {
  key: 'density',
  label: 'Density',
  unit: 'kg/m3@°C,kPa',
  kind: 'lookup',
  standards: { '°C': 20, kPa: 101.325 },
};

async function mount(): Promise<LookupDialog> {
  const dialog = new LookupDialog();
  document.body.append(dialog);
  await dialog.updateComplete;
  return dialog;
}

async function open(
  column: TableColumn,
  cellText: string,
  rowText = 'Steel',
): Promise<LookupDialog> {
  const dialog = await mount();
  dialog.open(column, cellText, rowText);
  await vi.waitFor(() => {
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });
  return dialog;
}

function axisInput(dialog: LookupDialog): HTMLInputElement {
  const input = dialog.querySelector<HTMLInputElement>(
    '[data-testid="lookup-axis"]',
  );
  if (input === null) {
    throw new Error('Missing axis input.');
  }
  return input;
}

function axisInputAt(dialog: LookupDialog, index: number): HTMLInputElement {
  const input = dialog.querySelector<HTMLInputElement>(
    `[data-testid="lookup-axis-${index}"]`,
  );
  if (input === null) {
    throw new Error(`Missing axis input ${index}.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

describe('LookupDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders nothing until it is opened', async () => {
    const dialog = await mount();
    expect(dialog.querySelector('dialog')).toBeNull();
  });

  it('starts at the first sample and interpolates as the axis changes', async () => {
    const dialog = await open(heatColumn, '460@20; 600@500');

    expect(axisInput(dialog).value).toBe('20');
    expect(dialog.textContent).toContain('Specific heat: 460 J/(kg·K)');

    typeInto(axisInput(dialog), '500');
    await dialog.updateComplete;
    expect(dialog.textContent).toContain('600 J/(kg·K)');
  });

  it('shows the sampled points in a table', async () => {
    const dialog = await open(heatColumn, '460@20; 600@500');
    const rows = dialog.querySelectorAll('.calc-lookup-points tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain('20');
    expect(rows[1]?.textContent).toContain('600');
  });

  it('explains a column with no axis unit', async () => {
    const dialog = await open(
      { key: 'plain', label: 'Plain', unit: 'mm' },
      '460@20; 600@500',
    );
    expect(dialog.textContent).toContain('no axis unit');
    expect(dialog.querySelector('[data-testid="lookup-axis"]')).toBeNull();
  });

  it('explains a malformed cell', async () => {
    const dialog = await open(heatColumn, 'not a lookup');
    expect(dialog.textContent).toContain('malformed');
  });

  it('interpolates a two-dimensional cell from both axes', async () => {
    const dialog = await open(
      densityColumn,
      '10@0,0; 20@10,0; 30@0,10; 40@10,10',
    );

    expect(axisInputAt(dialog, 0).value).toBe('0');
    expect(axisInputAt(dialog, 1).value).toBe('0');
    expect(dialog.textContent).toContain('Density: 10 kg/m3');

    typeInto(axisInputAt(dialog, 0), '5');
    typeInto(axisInputAt(dialog, 1), '5');
    await dialog.updateComplete;
    expect(dialog.textContent).toContain('Density: 25 kg/m3');
  });

  it('fills an omitted coordinate from the column standard', async () => {
    const dialog = await open(densityColumn, '100@25; 200@75');
    expect(axisInputAt(dialog, 0).value).toBe('25');
    expect(axisInputAt(dialog, 1).value).toBe('101.325');
    expect(dialog.textContent).toContain('Density: 100 kg/m3');
  });

  it('shows the standard coordinate for a sample that omits it', async () => {
    const dialog = await open(densityColumn, '100@25; 200@75');
    const rows = dialog.querySelectorAll('.calc-lookup-points tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain('101.325');
  });

  it('shows a single value for a numeric cell at the standard point', async () => {
    const dialog = await open(heatColumn, '4182', 'Water');
    expect(dialog.querySelector('[data-testid="lookup-axis"]')).toBeNull();
    expect(dialog.textContent).toContain('standard point');
    const result = dialog.querySelector('[data-testid="lookup-result"]');
    expect(result?.textContent?.replace(/\s+/g, ' ')).toContain(
      'Specific heat: 4182 J/(kg·K)',
    );
  });
});
