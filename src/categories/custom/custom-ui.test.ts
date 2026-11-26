// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CATEGORY_MANIFEST } from '../../app.js';
import { CalculatorApp, CategoryHandle } from '../../framework/app.js';
import type { KeyValueStorage } from '../../framework/bookmarks.js';
import { CustomStorageError } from '../../framework/errors.js';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { CalculatorCatalog } from '../../custom/catalog.js';
import { customToJson } from '../../custom/serialize.js';
import { CustomStore } from '../../custom/store.js';
import type { CustomDefinition } from '../../custom/types.js';
import type { CalculatorBrowserDialog } from './browser-dialog.js';
import type { CustomEditorDialog } from './editor.js';
import type { CustomExportDialog } from './export-dialog.js';
import { CustomHub } from './hub.js';
import type { CustomImportDialog } from './import-dialog.js';
import { CustomLibrary } from './library.js';
import type { CustomStepDialog } from './step-dialog.js';

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

/** A storage that always fails to read, to exercise the error path. */
class UnreadableStorage implements KeyValueStorage {
  getItem(): string | null {
    throw new Error('storage unavailable');
  }

  setItem(): void {}

  removeItem(): void {}
}

const app = new CalculatorApp(CATEGORY_MANIFEST);
const catalog = new CalculatorCatalog(app);

beforeAll(async () => {
  await catalog.load('math');
});

function makeHandle(): CategoryHandle {
  return new CategoryHandle('custom', 'Custom', 'Build your own.', () =>
    Promise.resolve({ calculators: [] }),
  );
}

/** Multiply (2, 3) then add its product to 4, as the editor would build it. */
function sampleCustom(): CustomDefinition {
  return {
    version: 2,
    id: 'double-add',
    title: 'Double add',
    steps: [
      {
        kind: 'subcalc',
        id: 'multiply',
        label: 'Multiply',
        calculatorRef: 'math:multiply',
        config: { slots: 2 },
        values: { value1: 2, value2: 3 },
        variables: {},
      },
      {
        kind: 'subcalc',
        id: 'add',
        label: 'Add',
        calculatorRef: 'math:add',
        config: { slots: 2 },
        values: { value2: 4 },
        variables: { value1: { takeFrom: 'multiply.product' } },
      },
    ],
  };
}

/** Lets every pending microtask and render settle. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function queryOne<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing element "${selector}".`);
  }
  return element;
}

function byTestId<T extends Element>(root: ParentNode, testId: string): T {
  return queryOne<T>(root, `[data-testid="${testId}"]`);
}

function clickTestId(root: ParentNode, testId: string): void {
  byTestId<HTMLElement>(root, testId).click();
}

function typeInto(root: ParentNode, testId: string, value: string): void {
  const field = byTestId<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(root, testId);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

interface MountedHub {
  readonly hub: CustomHub;
  readonly handle: CategoryHandle;
  readonly store: CustomStore;
  readonly opened: string[];
}

async function mountHub(
  options: { custom?: CustomDefinition } = {},
): Promise<MountedHub> {
  const handle = makeHandle();
  const store = new CustomStore(new MemoryStorage());
  if (options.custom !== undefined) {
    store.save(options.custom);
  }
  const hub = new CustomHub();
  const opened: string[] = [];
  hub.app = app;
  hub.handle = handle;
  hub.store = store;
  hub.openCalculator = (id) => {
    opened.push(id);
  };
  document.body.append(hub);
  await flush();
  return { hub, handle, store, opened };
}

describe('CustomLibrary', () => {
  it('registers saved customs with the category handle', async () => {
    const handle = makeHandle();
    const store = new CustomStore(new MemoryStorage());
    store.save(sampleCustom());
    const library = new CustomLibrary(handle, store, catalog);

    await library.refresh();

    expect(handle.get('double-add')).toBeDefined();
    expect(library.entries()).toHaveLength(1);
    expect(library.entries()[0]?.problem).toBeNull();
  });

  it('lists a broken custom with its problem and does not register it', async () => {
    const handle = makeHandle();
    const store = new CustomStore(new MemoryStorage());
    const broken: CustomDefinition = {
      version: 2,
      id: 'broken',
      title: 'Broken',
      steps: [
        {
          kind: 'subcalc',
          id: 'x',
          label: 'X',
          calculatorRef: 'math:nope',
          config: {},
          values: {},
          variables: {},
        },
      ],
    };
    store.save(broken);
    const library = new CustomLibrary(handle, store, catalog);

    await library.refresh();

    expect(handle.get('broken')).toBeUndefined();
    expect(library.entries()[0]?.problem).toMatch(/unknown subcalculator/i);
  });

  it('imports a custom under a unique id', async () => {
    const handle = makeHandle();
    const store = new CustomStore(new MemoryStorage());
    store.save(sampleCustom());
    const library = new CustomLibrary(handle, store, catalog);
    await library.refresh();

    const created = await library.create(sampleCustom());

    expect(created.id).toBe('double-add-2');
    expect(handle.get('double-add-2')).toBeDefined();
    expect(store.list()).toHaveLength(2);
  });

  it('unregisters a removed custom', async () => {
    const handle = makeHandle();
    const store = new CustomStore(new MemoryStorage());
    store.save(sampleCustom());
    const library = new CustomLibrary(handle, store, catalog);
    await library.refresh();

    await library.remove('double-add');

    expect(handle.get('double-add')).toBeUndefined();
    expect(store.list()).toEqual([]);
  });

  it('surfaces a storage read error without throwing', async () => {
    const library = new CustomLibrary(
      makeHandle(),
      new CustomStore(new UnreadableStorage()),
      catalog,
    );

    await library.refresh();

    expect(library.error).toMatch(/storage unavailable/);
    expect(library.entries()).toEqual([]);
  });

  it('offers nothing and refuses to save without a store', async () => {
    const library = new CustomLibrary(makeHandle(), null, catalog);
    await library.refresh();

    expect(library.entries()).toEqual([]);
    expect(library.error).toBeNull();
    await expect(library.create(sampleCustom())).rejects.toThrow(
      CustomStorageError,
    );
  });
});

describe('CustomHub', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows the empty state when nothing is saved', async () => {
    const { hub } = await mountHub();
    expect(byTestId(hub, 'custom-empty')).toBeDefined();
  });

  it('lists a saved custom and opens it', async () => {
    const { hub, opened } = await mountHub({ custom: sampleCustom() });

    expect(byTestId(hub, 'custom-double-add')).toBeDefined();
    clickTestId(hub, 'custom-open-double-add');

    expect(opened).toEqual(['double-add']);
  });

  it('deletes a custom only after a confirming click', async () => {
    const { hub, store } = await mountHub({ custom: sampleCustom() });

    clickTestId(hub, 'custom-delete-double-add');
    await flush();
    expect(store.list()).toHaveLength(1);

    clickTestId(hub, 'custom-delete-double-add');
    await flush();
    expect(store.list()).toHaveLength(0);
  });

  it('opens the editor from the New custom button', async () => {
    const { hub } = await mountHub();

    clickTestId(hub, 'new-custom');
    await flush();

    const editor = queryOne<CustomEditorDialog>(hub, 'calc-custom-editor');
    expect(byTestId(editor, 'custom-title')).toBeDefined();
    expect(editor.querySelector('dialog')?.open).toBe(true);
  });

  it('imports a custom from pasted JSON', async () => {
    const { hub, store } = await mountHub();

    clickTestId(hub, 'import-custom');
    await flush();
    const dialog = queryOne<CustomImportDialog>(hub, 'calc-custom-import');
    typeInto(dialog, 'import-json', customToJson(sampleCustom()));
    await flush();
    clickTestId(dialog, 'import-submit');
    await flush();

    expect(store.list().map((custom) => custom.id)).toContain('double-add');
  });

  it('exports a custom as copyable JSON', async () => {
    const { hub } = await mountHub({ custom: sampleCustom() });

    clickTestId(hub, 'custom-export-double-add');
    await flush();

    const dialog = queryOne<CustomExportDialog>(hub, 'calc-custom-export');
    const json = byTestId<HTMLTextAreaElement>(dialog, 'export-json');
    expect(json.value).toContain('"double-add"');
  });
});

describe('custom editor', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('blocks saving until the custom is valid', async () => {
    const { hub } = await mountHub();
    clickTestId(hub, 'new-custom');
    await flush();

    const save = byTestId<HTMLButtonElement>(hub, 'save-custom');
    expect(save.disabled).toBe(true);

    typeInto(hub, 'custom-title', 'Double add');
    await flush();
    expect(byTestId<HTMLButtonElement>(hub, 'save-custom').disabled).toBe(true);
  });

  it('builds and saves a two-step custom end to end', async () => {
    const { hub, handle, opened } = await mountHub();

    clickTestId(hub, 'new-custom');
    await flush();
    typeInto(hub, 'custom-title', 'Double add');
    await flush();

    // First step: multiply two values.
    clickTestId(hub, 'add-subcalc');
    await flush();
    const browser = queryOne<CalculatorBrowserDialog>(
      hub,
      'calc-calculator-browser',
    );
    clickTestId(browser, 'choose-category-math');
    await flush();
    clickTestId(browser, 'choose-multiply');
    await flush();

    const stepDialog = queryOne<CustomStepDialog>(
      hub,
      'calc-custom-step-dialog',
    );
    typeInto(stepDialog, 'value-value1', '2');
    typeInto(stepDialog, 'value-value2', '3');
    clickTestId(stepDialog, 'apply-step');
    await flush();

    // Second step: add 4 to the product wired from the first step.
    clickTestId(hub, 'add-subcalc');
    await flush();
    const secondBrowser = queryOne<CalculatorBrowserDialog>(
      hub,
      'calc-calculator-browser',
    );
    clickTestId(secondBrowser, 'choose-category-math');
    await flush();
    clickTestId(secondBrowser, 'choose-add');
    await flush();

    typeInto(stepDialog, 'value-value2', '4');
    typeInto(stepDialog, 'take-from-value1', 'multiply.product');
    await flush();

    const wired = byTestId(stepDialog, 'step-field-value1');
    expect(wired.classList.contains('highlight')).toBe(true);
    expect(wired.textContent).toContain('Taken from');
    expect(wired.textContent).toContain('Multiply: Product');

    clickTestId(stepDialog, 'apply-step');
    await flush();
    clickTestId(hub, 'save-custom');
    await flush();

    expect(opened).toEqual(['double-add']);
    const registered = handle.get('double-add');
    expect(registered).toBeDefined();
    if (registered === undefined) {
      throw new Error('Custom was not registered.');
    }
    const runtime = new CalculatorRuntime(registered.definition, catalog);
    expect(runtime.isConverged).toBe(true);
    expect(runtime.errors).toEqual([]);
    expect(runtime.state['multiply_product']).toBeCloseTo(6);
    expect(runtime.state['add_sum']).toBeCloseTo(10);
  });
});
