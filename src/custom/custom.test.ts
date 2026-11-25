import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from '../framework/bookmarks.js';
import {
  CustomDefinitionError,
  CustomStorageError,
} from '../framework/errors.js';
import { CalculatorRuntime } from '../framework/runtime.js';
import { CalculatorCatalog } from './catalog.js';
import { compileCustom } from './compile.js';
import { customFromJson, customToJson, parseCustom } from './serialize.js';
import { CUSTOM_STORAGE_KEY, CustomStore, MAX_CUSTOMS } from './store.js';
import { globalVariableName, parseWirePath, wirePath } from './types.js';
import type { CustomDefinition, CustomStep, SubcalcStep } from './types.js';
import { customProblems, validateCustom } from './validate.js';

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

const catalog = CalculatorCatalog.standard();

/** The step at `index`, raising when it is missing. */
function stepAt(custom: CustomDefinition, index: number): CustomStep {
  const step = custom.steps[index];
  if (step === undefined) {
    throw new Error(`Custom has no step at index ${index}.`);
  }
  return step;
}

/** The subcalculator step at `index`, raising when it is another kind. */
function subcalcAt(custom: CustomDefinition, index: number): SubcalcStep {
  const step = stepAt(custom, index);
  if (step.kind !== 'subcalc') {
    throw new Error(`Step ${index} is not a subcalculator.`);
  }
  return step;
}

/** Multiply (2, 3) then add its product to 4. */
function multiplyThenAdd(): CustomDefinition {
  return {
    version: 1,
    id: 'double-add',
    title: 'Double then add',
    steps: [
      {
        kind: 'subcalc',
        id: 'a',
        label: 'Product',
        calculatorId: 'multiply',
        config: { slots: 2 },
        values: { value1: 2, value2: 3 },
        variables: {},
      },
      {
        kind: 'subcalc',
        id: 'b',
        label: 'Sum',
        calculatorId: 'add',
        config: { slots: 2 },
        values: { value2: 4 },
        variables: { value1: { takeFrom: 'a.product' } },
      },
    ],
  };
}

describe('custom wire paths', () => {
  it('builds and splits wire paths', () => {
    expect(wirePath('a', 'value')).toBe('a.value');
    expect(parseWirePath('a.value')).toEqual({
      stepId: 'a',
      variable: 'value',
    });
  });

  it('rejects paths without exactly one separator', () => {
    expect(parseWirePath('value')).toBeNull();
    expect(parseWirePath('.value')).toBeNull();
    expect(parseWirePath('a.')).toBeNull();
    expect(parseWirePath('a.b.c')).toBeNull();
  });

  it('namespaces a step id and variable without collision', () => {
    expect(globalVariableName('a', 'value1')).toBe('a_value1');
  });
});

describe('custom serialization', () => {
  it('round-trips a custom through JSON', () => {
    const custom = multiplyThenAdd();
    const restored = customFromJson(customToJson(custom));
    expect(restored).toEqual(custom);
  });

  it('rejects text that is not JSON', () => {
    expect(() => customFromJson('not json')).toThrow(CustomDefinitionError);
  });

  it('rejects a non-object', () => {
    expect(() => parseCustom(42)).toThrow(/must be an object/);
  });

  it('rejects an unsupported version', () => {
    expect(() => parseCustom({ ...multiplyThenAdd(), version: 2 })).toThrow(
      /version/,
    );
  });

  it('rejects an invalid id', () => {
    expect(() => parseCustom({ ...multiplyThenAdd(), id: 'Bad Id' })).toThrow(
      /lowercase/,
    );
  });

  it('rejects a non-array steps field', () => {
    expect(() => parseCustom({ ...multiplyThenAdd(), steps: 'no' })).toThrow(
      /steps/,
    );
  });

  it('rejects an unknown step kind', () => {
    const custom = multiplyThenAdd();
    const broken = {
      ...custom,
      steps: [{ ...subcalcAt(custom, 0), kind: 'widget' }],
    };
    expect(() => parseCustom(broken)).toThrow(/unknown kind/);
  });

  it('rejects an unknown unit on a variable step', () => {
    const base = multiplyThenAdd();
    const custom: CustomDefinition = {
      ...base,
      steps: [
        subcalcAt(base, 0),
        {
          kind: 'variable',
          id: 'x',
          label: 'X',
          unit: 'parsecs' as never,
          variable: {},
        },
      ],
    };
    expect(() => parseCustom(custom)).toThrow(/unknown unit/);
  });

  it('rejects a non-finite stored value', () => {
    const custom = multiplyThenAdd();
    const first = subcalcAt(custom, 0);
    const broken = {
      ...custom,
      steps: [
        { ...first, values: { value1: Number.POSITIVE_INFINITY } },
        stepAt(custom, 1),
      ],
    };
    expect(() => parseCustom(broken)).toThrow(/finite/);
  });

  it('rejects an invalid config value', () => {
    const custom = multiplyThenAdd();
    const first = subcalcAt(custom, 0);
    const broken = {
      ...custom,
      steps: [{ ...first, config: { slots: null } }, stepAt(custom, 1)],
    };
    expect(() => parseCustom(broken)).toThrow(/must be a number/);
  });
});

describe('custom validation', () => {
  it('accepts a well-formed custom', () => {
    expect(customProblems(multiplyThenAdd(), catalog)).toEqual([]);
  });

  it('requires at least one subcalculator step', () => {
    const custom: CustomDefinition = {
      version: 1,
      id: 'only-text',
      title: 'Only text',
      steps: [{ kind: 'text', id: 'note', label: 'Note', variable: {} }],
    };
    expect(customProblems(custom, catalog).join('\n')).toMatch(
      /at least one subcalculator/,
    );
  });

  it('reports an unknown subcalculator', () => {
    const custom = multiplyThenAdd();
    const first = subcalcAt(custom, 0);
    const broken: CustomDefinition = {
      ...custom,
      steps: [{ ...first, calculatorId: 'nope' }, stepAt(custom, 1)],
    };
    expect(customProblems(broken, catalog).join('\n')).toMatch(
      /unknown subcalculator/,
    );
  });

  it('reports a wire that measures a different kind', () => {
    const custom: CustomDefinition = {
      version: 1,
      id: 'mismatch',
      title: 'Mismatch',
      steps: [
        {
          kind: 'subcalc',
          id: 's',
          label: 'Add',
          calculatorId: 'add',
          config: { slots: 2 },
          values: {},
          variables: {},
        },
        { kind: 'variable', id: 'x', label: 'Volts', unit: 'V', variable: {} },
        {
          kind: 'variable',
          id: 'y',
          label: 'Amps',
          unit: 'A',
          variable: { takeFrom: 'x.value' },
        },
      ],
    };
    expect(customProblems(custom, catalog).join('\n')).toMatch(
      /measures a different kind/,
    );
  });

  it('reports wire sources that select a different table', () => {
    const step = (id: string, gaugeFrom?: string) => ({
      kind: 'subcalc' as const,
      id,
      label: id,
      calculatorId: 'wire-resistance',
      config: {},
      values: {},
      variables:
        gaugeFrom === undefined ? {} : { gauge: { takeFrom: gaugeFrom } },
    });
    const custom: CustomDefinition = {
      version: 1,
      id: 'tables',
      title: 'Tables',
      steps: [step('s1'), step('s2', 's1.metal')],
    };
    expect(customProblems(custom, catalog).join('\n')).toMatch(
      /selects from table "wire-metals" but the field selects from "wire-gauge"/,
    );
  });

  it('accepts a wire between matching table selects', () => {
    const step = (id: string, metalFrom?: string) => ({
      kind: 'subcalc' as const,
      id,
      label: id,
      calculatorId: 'wire-resistance',
      config: {},
      values: {},
      variables:
        metalFrom === undefined ? {} : { metal: { takeFrom: metalFrom } },
    });
    const custom: CustomDefinition = {
      version: 1,
      id: 'tables-ok',
      title: 'Tables OK',
      steps: [step('s1'), step('s2', 's1.metal')],
    };
    expect(customProblems(custom, catalog)).toEqual([]);
  });

  it('raises with a summary from validateCustom', () => {
    const custom = { ...multiplyThenAdd(), title: '  ' };
    expect(() => validateCustom(custom, catalog)).toThrow(
      CustomDefinitionError,
    );
  });
});

describe('compileCustom', () => {
  it('namespaces variables in step order and links wires', () => {
    const definition = compileCustom(multiplyThenAdd(), catalog);
    const names = definition.variables.map((variable) => variable.name);
    expect(names).toEqual([
      'a_value1',
      'a_value2',
      'a_product',
      'b_value1',
      'b_value2',
      'b_sum',
    ]);
    expect(definition.config?.map((field) => field.name)).toEqual([
      'a_slots',
      'b_slots',
    ]);
    const bValue1 = definition.variables.find(
      (variable) => variable.name === 'b_value1',
    );
    expect(bValue1?.takeFrom).toBe('a_product');
    expect(bValue1?.label).toBe('Sum: Value 1');
  });

  it('solves the whole custom through the runtime', () => {
    const definition = compileCustom(multiplyThenAdd(), catalog);
    const runtime = new CalculatorRuntime(definition, catalog);
    expect(runtime.isConverged).toBe(true);
    expect(runtime.errors).toEqual([]);
    expect(runtime.state['a_product']).toBeCloseTo(6);
    expect(runtime.state['b_value1']).toBeCloseTo(6);
    expect(runtime.state['b_sum']).toBeCloseTo(10);
  });

  it('hides a step’s fields outside the editor', () => {
    const custom = multiplyThenAdd();
    const steps = custom.steps.map((step) =>
      step.id === 'a' ? { ...step, hidden: true } : step,
    );
    const definition = compileCustom({ ...custom, steps }, catalog);
    for (const variable of definition.variables) {
      expect(variable.hidden === true).toBe(variable.name.startsWith('a_'));
    }
  });

  it('drops a wire whose source disappears with the config', () => {
    const custom: CustomDefinition = {
      version: 1,
      id: 'shrink',
      title: 'Shrink',
      steps: [
        {
          kind: 'subcalc',
          id: 'a',
          label: 'Add',
          calculatorId: 'add',
          config: { slots: 3 },
          values: {},
          variables: {},
        },
        {
          kind: 'variable',
          id: 'out',
          label: 'Out',
          unit: '1',
          variable: { takeFrom: 'a.value3' },
        },
      ],
    };
    const definition = compileCustom(custom, catalog);
    const out = (config: Record<string, number>) =>
      definition
        .buildVariables?.(config)
        .find((variable) => variable.name === 'out_value');
    expect(out({ a_slots: 3 })?.takeFrom).toBe('a_value3');
    expect(out({ a_slots: 2 })?.takeFrom).toBeUndefined();
  });
});

describe('CustomStore', () => {
  it('starts empty', () => {
    const store = new CustomStore(new MemoryStorage());
    expect(store.list()).toEqual([]);
  });

  it('saves, lists, and reads a custom', () => {
    const store = new CustomStore(new MemoryStorage());
    const saved = store.save(multiplyThenAdd());
    expect(store.list()).toEqual([saved]);
    expect(store.get('double-add')).toEqual(saved);
    expect(store.has('double-add')).toBe(true);
  });

  it('replaces a custom with the same id without growing the list', () => {
    const store = new CustomStore(new MemoryStorage());
    store.save(multiplyThenAdd());
    const updated = store.save({ ...multiplyThenAdd(), title: 'Renamed' });
    expect(store.list()).toEqual([updated]);
    expect(store.get('double-add')?.title).toBe('Renamed');
  });

  it('trims the title and falls back to Untitled', () => {
    const store = new CustomStore(new MemoryStorage());
    expect(store.save({ ...multiplyThenAdd(), title: '  ' }).title).toBe(
      'Untitled',
    );
    expect(
      store.save({ ...multiplyThenAdd(), id: 'spaced', title: '  Hi  ' }).title,
    ).toBe('Hi');
  });

  it('deletes a custom and rejects a missing one', () => {
    const store = new CustomStore(new MemoryStorage());
    store.save(multiplyThenAdd());
    store.delete('double-add');
    expect(store.list()).toEqual([]);
    expect(() => store.delete('double-add')).toThrow(CustomStorageError);
  });

  it('assigns a unique id when importing a duplicate', () => {
    const store = new CustomStore(new MemoryStorage());
    store.importCustom(multiplyThenAdd());
    const second = store.importCustom(multiplyThenAdd());
    expect(second.id).toBe('double-add-2');
    expect(store.list().map((entry) => entry.id)).toEqual([
      'double-add',
      'double-add-2',
    ]);
  });

  it('imports a custom from JSON text', () => {
    const store = new CustomStore(new MemoryStorage());
    const imported = store.importJson(customToJson(multiplyThenAdd()));
    expect(imported.id).toBe('double-add');
    expect(store.list()).toHaveLength(1);
  });

  it('enforces the customs limit on new saves', () => {
    const storage = new MemoryStorage();
    const store = new CustomStore(storage);
    const customs = Array.from({ length: MAX_CUSTOMS }, (_unused, index) => ({
      ...multiplyThenAdd(),
      id: `custom-${index}`,
    }));
    for (const custom of customs) {
      store.save(custom);
    }
    expect(() => store.save({ ...multiplyThenAdd(), id: 'one-more' })).toThrow(
      /already have/,
    );
  });

  it('raises on corrupt stored JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(CUSTOM_STORAGE_KEY, '{ not json');
    const store = new CustomStore(storage);
    expect(() => store.list()).toThrow(/not valid JSON/);
  });

  it('raises on an unsupported stored version', () => {
    const storage = new MemoryStorage();
    storage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify({ version: 2 }));
    const store = new CustomStore(storage);
    expect(() => store.list()).toThrow(/unsupported version/);
  });

  it('raises on an invalid stored custom', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CUSTOM_STORAGE_KEY,
      JSON.stringify({ version: 1, customs: [{ version: 1, id: 'x' }] }),
    );
    const store = new CustomStore(storage);
    expect(() => store.list()).toThrow(/invalid/);
  });
});
