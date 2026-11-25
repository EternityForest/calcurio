// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { missing } from '../missing.js';
import { CalculatorRuntime } from '../runtime.js';
import type { CalculatorDefinition } from '../types.js';
import { GraphDialog } from './graph-dialog.js';

function doublingDefinition(): CalculatorDefinition {
  return {
    id: 'doubling',
    title: 'Doubling',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: (state) =>
          state['b'] === null ? missing(['b']) : (state['b'] as number) * 2,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
        computable: (state) =>
          state['a'] === null ? missing(['a']) : (state['a'] as number) / 2,
      },
    ],
  };
}

async function mount(runtime: CalculatorRuntime): Promise<GraphDialog> {
  const dialog = new GraphDialog();
  dialog.runtime = runtime;
  document.body.append(dialog);
  await dialog.updateComplete;
  return dialog;
}

async function openDialog(
  runtime: CalculatorRuntime,
  axis: string,
): Promise<GraphDialog> {
  const dialog = await mount(runtime);
  dialog.open(axis);
  await vi.waitFor(() => {
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });
  return dialog;
}

function inputOf(dialog: GraphDialog, testId: string): HTMLInputElement {
  const input = dialog.querySelector<HTMLInputElement>(
    `[data-testid="${testId}"]`,
  );
  if (input === null) {
    throw new Error(`Missing input ${testId}.`);
  }
  return input;
}

function selectOf(dialog: GraphDialog, testId: string): HTMLSelectElement {
  const select = dialog.querySelector<HTMLSelectElement>(
    `[data-testid="${testId}"]`,
  );
  if (select === null) {
    throw new Error(`Missing select ${testId}.`);
  }
  return select;
}

function buttonOf(dialog: GraphDialog, testId: string): HTMLButtonElement {
  const button = dialog.querySelector<HTMLButtonElement>(
    `[data-testid="${testId}"]`,
  );
  if (button === null) {
    throw new Error(`Missing button ${testId}.`);
  }
  return button;
}

/** Types `text` into a plot input and fires the change the dialog listens for. */
function typeInto(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

describe('GraphDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders nothing until it is opened', async () => {
    const dialog = await mount(new CalculatorRuntime(doublingDefinition()));
    expect(dialog.querySelector('dialog')).toBeNull();
  });

  it('opens with a range around the current value', async () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.setDisplayText('a', '10');
    const dialog = await openDialog(runtime, 'a');

    expect(selectOf(dialog, 'graph-target').value).toBe('b');
    expect(selectOf(dialog, 'graph-unit').value).toBe('V');
    expect(inputOf(dialog, 'graph-min').value).toBe('0');
    expect(inputOf(dialog, 'graph-max').value).toBe('20');
    expect(inputOf(dialog, 'graph-steps').value).toBe('100');
  });

  it('lists the other computable value as the Y axis', async () => {
    const dialog = await openDialog(
      new CalculatorRuntime(doublingDefinition()),
      'a',
    );
    const options = selectOf(dialog, 'graph-target').options;
    expect(options).toHaveLength(1);
    expect(options[0]?.value).toBe('b');
  });

  it('reports bad limits without starting a run', async () => {
    const dialog = await openDialog(
      new CalculatorRuntime(doublingDefinition()),
      'a',
    );

    typeInto(inputOf(dialog, 'graph-min'), '10');
    typeInto(inputOf(dialog, 'graph-max'), '5');
    buttonOf(dialog, 'graph-run').click();

    await vi.waitFor(() => {
      expect(dialog.textContent).toContain('greater than the minimum');
    });
    expect(buttonOf(dialog, 'graph-stop').disabled).toBe(true);
  });

  it('explains when the browser cannot draw', async () => {
    const dialog = await openDialog(
      new CalculatorRuntime(doublingDefinition()),
      'a',
    );
    buttonOf(dialog, 'graph-run').click();

    await vi.waitFor(() => {
      expect(dialog.textContent).toContain(
        'Plotting is not available in this browser.',
      );
    });
    expect(buttonOf(dialog, 'graph-stop').disabled).toBe(true);
  });

  it('closes the modal', async () => {
    const dialog = await openDialog(
      new CalculatorRuntime(doublingDefinition()),
      'a',
    );
    dialog.close();
    expect(dialog.querySelector('dialog')?.open).toBe(false);
  });
});
