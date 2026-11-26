// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookmarkStore } from '../bookmarks.js';
import type { KeyValueStorage } from '../bookmarks.js';
import { missing } from '../missing.js';
import { CalculatorRuntime } from '../runtime.js';
import type { CalculatorDefinition } from '../types.js';
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

interface Mounted {
  readonly element: BookmarksDialog;
  readonly runtime: CalculatorRuntime;
  readonly store: BookmarkStore;
}

async function mount(
  store: BookmarkStore | null = new BookmarkStore(new MemoryStorage()),
): Promise<Mounted> {
  const runtime = new CalculatorRuntime(doublingDefinition());
  runtime.setDisplayText('a', '2');
  const element = new BookmarksDialog();
  element.runtime = runtime;
  element.globalId = 'basic.doubling';
  element.bookmarks = store;
  document.body.append(element);
  await element.updateComplete;
  element.open();
  await element.updateComplete;
  return {
    element,
    runtime,
    store: store ?? new BookmarkStore(new MemoryStorage()),
  };
}

function modalOf(element: BookmarksDialog): HTMLDialogElement {
  const modal = element.querySelector<HTMLDialogElement>('dialog');
  if (modal === null) {
    throw new Error('Missing dialog.');
  }
  return modal;
}

function nameInputOf(element: BookmarksDialog): HTMLInputElement {
  const input = element.querySelector<HTMLInputElement>(
    'input.calc-bookmark-name',
  );
  if (input === null) {
    throw new Error('Missing bookmark name input.');
  }
  return input;
}

describe('BookmarksDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('opens the modal', async () => {
    const { element } = await mount();
    expect(modalOf(element).open).toBe(true);
  });

  it('saves a bookmark', async () => {
    const { element, store } = await mount();
    const input = nameInputOf(element);
    input.value = 'My state';
    input.dispatchEvent(new Event('input'));
    const save = element.querySelector<HTMLButtonElement>(
      '[data-testid="save-bookmark"]',
    );
    if (save === null) {
      throw new Error('Missing save button.');
    }
    save.click();
    await element.updateComplete;

    expect(store.list('basic.doubling')).toHaveLength(1);
    expect(store.list('basic.doubling')[0]?.name).toBe('My state');
    expect(element.textContent).toContain('Saved "My state".');
  });

  it('loads a bookmark and closes the dialog', async () => {
    const { element, runtime, store } = await mount();
    const bookmark = store.save('basic.doubling', 'Saved', runtime.snapshot());
    element.open();
    await element.updateComplete;

    const load = vi.spyOn(runtime, 'loadState');
    const event = vi.fn();
    element.addEventListener('bookmark-loaded', event);
    const button = element.querySelector<HTMLButtonElement>(
      `[data-testid="load-bookmark-${bookmark.id}"]`,
    );
    if (button === null) {
      throw new Error('Missing load button.');
    }
    button.click();
    await element.updateComplete;

    expect(load).toHaveBeenCalledWith(bookmark.state, bookmark.units, {
      includeDerived: false,
    });
    expect(event).toHaveBeenCalled();
    expect(modalOf(element).open).toBe(false);
  });

  it('requires a second click to delete', async () => {
    const { element, runtime, store } = await mount();
    const bookmark = store.save('basic.doubling', 'Saved', runtime.snapshot());
    element.open();
    await element.updateComplete;

    const deleteButton = element.querySelector<HTMLButtonElement>(
      `[data-testid="delete-bookmark-${bookmark.id}"]`,
    );
    if (deleteButton === null) {
      throw new Error('Missing delete button.');
    }
    deleteButton.click();
    await element.updateComplete;
    expect(store.list('basic.doubling')).toHaveLength(1);
    expect(element.textContent).toContain('Confirm delete');

    element
      .querySelector<HTMLButtonElement>(
        `[data-testid="delete-bookmark-${bookmark.id}"]`,
      )
      ?.click();
    await element.updateComplete;
    expect(store.list('basic.doubling')).toHaveLength(0);
    expect(element.textContent).toContain('Deleted "Saved".');
  });

  it('filters bookmarks by name', async () => {
    const { element, runtime, store } = await mount();
    store.save('basic.doubling', 'Alpha', runtime.snapshot());
    store.save('basic.doubling', 'Beta', runtime.snapshot());
    element.open();
    await element.updateComplete;

    expect(element.querySelectorAll('li.calc-bookmark')).toHaveLength(2);
    const filter = element.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );
    if (filter === null) {
      throw new Error('Missing filter input.');
    }
    filter.value = 'alp';
    filter.dispatchEvent(new Event('input'));
    await element.updateComplete;
    expect(element.querySelectorAll('li.calc-bookmark')).toHaveLength(1);
    expect(element.textContent).toContain('Alpha');
    expect(element.textContent).not.toContain('Beta');
  });

  it('reports when bookmarks are unavailable', async () => {
    const { element } = await mount(null);
    expect(element.textContent).toContain(
      'Bookmarks are not available in this browser.',
    );
    expect(element.querySelector('[data-testid="save-bookmark"]')).toBeNull();
  });

  it('closes without changing anything', async () => {
    const { element } = await mount();
    const close = element.querySelector<HTMLButtonElement>(
      '.calc-dialog-header button',
    );
    if (close === null) {
      throw new Error('Missing close button.');
    }
    close.click();
    await element.updateComplete;
    expect(modalOf(element).open).toBe(false);
  });
});
