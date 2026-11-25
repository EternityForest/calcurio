// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookmarkStore } from '../bookmarks.js';
import type { KeyValueStorage } from '../bookmarks.js';
import { missing } from '../missing.js';
import { CalculatorRuntime } from '../runtime.js';
import type { CalculatorDefinition } from '../types.js';
import { CalculatorView } from './calculator-view.js';
import { BookmarksDialog } from './bookmarks-dialog.js';

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
