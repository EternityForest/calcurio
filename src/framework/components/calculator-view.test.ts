// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookmarkStore } from '../bookmarks.js';
import type { KeyValueStorage } from '../bookmarks.js';
import { missing } from '../missing.js';
import { CalculatorRuntime } from '../runtime.js';
import { TableRegistry } from '../tables.js';
import type { CalculatorDefinition, TableDefinition } from '../types.js';
import { unchanged } from '../unchanged.js';
import { CalculatorView } from './calculator-view.js';
import { BookmarksDialog } from './bookmarks-dialog.js';
import { GraphDialog } from './graph-dialog.js';

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

function doublingDefinition(): CalculatorDefinition {
  return {
    id: 'doubling',
    title: 'Doubling',
    description: 'Doubles a value.',
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

function cycleDefinition(): CalculatorDefinition {
  return {
    id: 'cycle',
    title: 'Cycle',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: (state) =>
          (state['b'] === null ? 0 : (state['b'] as number)) + 1,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
        computable: (state) =>
          (state['a'] === null ? 0 : (state['a'] as number)) + 1,
      },
    ],
  };
}

async function mount(
  runtime: CalculatorRuntime,
  bookmarks: BookmarkStore | null,
): Promise<CalculatorView> {
  const view = new CalculatorView();
  view.runtime = runtime;
  view.globalId = 'basic.doubling';
  view.bookmarks = bookmarks;
  document.body.append(view);
  await view.updateComplete;
  return view;
}

describe('CalculatorView', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders the title, description, and one field per variable', async () => {
    const view = await mount(new CalculatorRuntime(doublingDefinition()), null);
    expect(view.textContent).toContain('Doubling');
    expect(view.textContent).toContain('Doubles a value.');
    expect(view.querySelectorAll('calc-variable-field')).toHaveLength(2);
  });

  it('renders compute errors', async () => {
    const view = await mount(new CalculatorRuntime(cycleDefinition()), null);
    expect(view.textContent).toContain('did not settle');
  });

  it('disables bookmarks without a store', async () => {
    const view = await mount(new CalculatorRuntime(doublingDefinition()), null);
    const button = view.querySelector<HTMLButtonElement>(
      '[data-testid="open-bookmarks"]',
    );
    expect(button?.disabled).toBe(true);
  });

  it('opens the bookmarks dialog', async () => {
    const view = await mount(
      new CalculatorRuntime(doublingDefinition()),
      new BookmarkStore(new MemoryStorage()),
    );
    const button = view.querySelector<HTMLButtonElement>(
      '[data-testid="open-bookmarks"]',
    );
    const dialog = view.querySelector<BookmarksDialog>('calc-bookmarks-dialog');
    if (button === null || dialog === null) {
      throw new Error('Missing bookmarks controls.');
    }
    button.click();
    await dialog.updateComplete;
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });

  it('opens the graph dialog from a plot button', async () => {
    const view = await mount(new CalculatorRuntime(doublingDefinition()), null);
    const button = view.querySelector<HTMLButtonElement>(
      '[data-testid="plot-a"]',
    );
    const dialog = view.querySelector<GraphDialog>('calc-graph-dialog');
    if (button === null || dialog === null) {
      throw new Error('Missing graph controls.');
    }
    button.click();
    await dialog.updateComplete;
    expect(dialog.querySelector('dialog')?.open).toBe(true);
  });

  it('reports a loaded bookmark', async () => {
    const view = await mount(
      new CalculatorRuntime(doublingDefinition()),
      new BookmarkStore(new MemoryStorage()),
    );
    const dialog = view.querySelector<BookmarksDialog>('calc-bookmarks-dialog');
    if (dialog === null) {
      throw new Error('Missing bookmarks dialog.');
    }
    dialog.dispatchEvent(
      new CustomEvent<string>('bookmark-loaded', {
        detail: 'Saved state',
        bubbles: true,
        composed: true,
      }),
    );
    await view.updateComplete;
    expect(view.textContent).toContain('Loaded "Saved state".');
  });

  it('requires a second click to reset', async () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.setDisplayText('a', '2');
    const view = await mount(runtime, null);
    const reset = vi.spyOn(runtime, 'reset');
    const button = view.querySelector<HTMLButtonElement>(
      '[data-testid="reset"]',
    );
    if (button === null) {
      throw new Error('Missing reset button.');
    }

    button.click();
    await view.updateComplete;
    expect(reset).not.toHaveBeenCalled();
    expect(view.textContent).toContain('Press Reset again');

    button.click();
    await view.updateComplete;
    expect(reset).toHaveBeenCalledTimes(1);
    expect(view.textContent).toContain('Calculator reset.');
  });

  it('updates when the runtime changes', async () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    const view = await mount(runtime, null);
    runtime.setDisplayText('a', '2');
    await view.updateComplete;
    const input = view.querySelector<HTMLInputElement>(
      '[data-testid="value-b"]',
    );
    expect(input?.value).toBe('1');
  });
});

function computeStateDefinition(
  computeState: NonNullable<CalculatorDefinition['computeState']>,
): CalculatorDefinition {
  return {
    id: 'compute-state',
    title: 'Compute state',
    variables: [
      { name: 'a', label: 'A', unit: 'V' },
      { name: 'b', label: 'B', unit: 'V' },
      { name: 'sum', label: 'Sum', unit: 'V', computable: () => unchanged() },
    ],
    computeState,
  };
}

function sampleTable(): TableDefinition {
  return {
    id: 'materials',
    title: 'Materials',
    keyColumn: 'id',
    labelColumn: 'name',
    columns: [
      { key: 'id', label: 'Id', kind: 'text' },
      { key: 'name', label: 'Name', kind: 'text' },
    ],
    rows: [
      { id: 'air', name: 'Air' },
      { id: 'iron', name: 'Iron' },
    ],
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function requireButton(
  view: CalculatorView,
  testId: string,
): HTMLButtonElement {
  const button = view.querySelector<HTMLButtonElement>(
    `[data-testid="${testId}"]`,
  );
  if (button === null) {
    throw new Error(`Missing ${testId} button.`);
  }
  return button;
}

function readyRuntime(
  computeState: NonNullable<CalculatorDefinition['computeState']>,
): CalculatorRuntime {
  const runtime = new CalculatorRuntime(computeStateDefinition(computeState));
  runtime.setDisplayText('a', '1');
  runtime.setDisplayText('b', '2');
  return runtime;
}

describe('CalculatorView computeState', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('hides calculate and plot controls in computeState mode', async () => {
    const view = await mount(
      readyRuntime((state) => ({ ...state })),
      null,
    );
    expect(view.querySelectorAll('calc-variable-field')).toHaveLength(3);
    expect(view.querySelector('[data-testid="plot-a"]')).toBeNull();
    expect(view.querySelector('[data-testid="calculate-a"]')).toBeNull();
    expect(view.querySelector('[data-testid="run"]')).not.toBeNull();
    expect(requireButton(view, 'cancel').disabled).toBe(true);
  });

  it('keeps a table select editable in computeState mode', async () => {
    const runtime = new CalculatorRuntime(
      {
        id: 'compute-state-select',
        title: 'Compute state select',
        variables: [
          { name: 'a', label: 'A', unit: 'V' },
          { name: 'material', label: 'Material', table: 'materials' },
          {
            name: 'sum',
            label: 'Sum',
            unit: 'V',
            computable: () => unchanged(),
          },
        ],
        computeState: (state) => ({ ...state }),
      },
      new TableRegistry([sampleTable()]),
    );

    const view = await mount(runtime, null);
    const select = view.querySelector<HTMLSelectElement>(
      '[data-testid="value-material"]',
    );
    if (select === null) {
      throw new Error('The material select was not rendered.');
    }
    expect(select.disabled).toBe(false);
    // Placeholder plus the two rows.
    expect(select.options).toHaveLength(3);

    select.value = 'iron';
    select.dispatchEvent(new Event('change'));
    expect(runtime.selectedKey('material')).toBe('iron');
  });

  it('runs computeState from the Run button and merges the result', async () => {
    const view = await mount(
      readyRuntime((state) => ({ ...state, sum: 3 })),
      null,
    );
    requireButton(view, 'run').click();
    await vi.waitFor(() => {
      const input = view.querySelector<HTMLInputElement>(
        '[data-testid="value-sum"]',
      );
      expect(input?.value).toBe('3');
    });
  });

  it('shows output items and replaces them on the next run', async () => {
    let message = 'Run one';
    const runtime = readyRuntime((state, context) => {
      context.display(message);
      return { ...state };
    });
    const view = await mount(runtime, null);

    requireButton(view, 'run').click();
    await vi.waitFor(() => {
      expect(view.textContent).toContain('Run one');
    });
    expect(view.querySelectorAll('.calc-output > *')).toHaveLength(1);

    await vi.waitFor(() => {
      expect(requireButton(view, 'run').disabled).toBe(false);
    });
    message = 'Run two';
    requireButton(view, 'run').click();
    await vi.waitFor(() => {
      expect(view.textContent).toContain('Run two');
    });
    expect(view.textContent).not.toContain('Run one');
    expect(view.querySelectorAll('.calc-output > *')).toHaveLength(1);
  });

  it('cancels a running computeState from the Cancel button', async () => {
    const gate = deferred<void>();
    const runtime = readyRuntime(async (state, context) => {
      context.display('Started');
      await gate.promise;
      return { ...state, sum: 99 };
    });
    const view = await mount(runtime, null);

    requireButton(view, 'run').click();
    await vi.waitFor(() => {
      expect(runtime.isRunning).toBe(true);
    });
    await view.updateComplete;
    expect(requireButton(view, 'run').disabled).toBe(true);
    expect(requireButton(view, 'cancel').disabled).toBe(false);

    requireButton(view, 'cancel').click();
    gate.resolve();
    await vi.waitFor(() => {
      expect(runtime.isRunning).toBe(false);
    });
    await view.updateComplete;
    expect(requireButton(view, 'cancel').disabled).toBe(true);
    expect(runtime.state['sum']).toBeNull();
  });
});
