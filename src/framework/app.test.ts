import { describe, expect, it, vi } from 'vitest';
import { CalculatorApp, CategoryHandle, globalIdFor } from './app.js';
import type {
  CalculatorDefinition,
  CategoryManifest,
  CategoryModule,
} from './types.js';

function sampleDefinition(id = 'sample'): CalculatorDefinition {
  return {
    id,
    title: 'Sample',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: () => 1,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
      },
    ],
  };
}

function moduleWith(...definitions: CalculatorDefinition[]): CategoryModule {
  return { calculators: definitions };
}

describe('globalIdFor', () => {
  it('joins category and calculator ids with a dot', () => {
    expect(globalIdFor('basic', 'ohms-law')).toBe('basic.ohms-law');
  });
});

describe('CategoryHandle', () => {
  it('registers calculators and exposes them with global ids', () => {
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      async () => moduleWith(),
    );
    const definition = sampleDefinition();
    const registered = handle.add(definition);

    expect(registered.definition).toBe(definition);
    expect(registered.categoryId).toBe('basic');
    expect(registered.globalId).toBe('basic.sample');
    expect(handle.get('sample')).toBe(registered);
    expect(handle.calculators).toEqual([registered]);
    expect(handle.isLoaded).toBe(false);
  });

  it('treats registering the same definition twice as a no-op', () => {
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      async () => moduleWith(),
    );
    const definition = sampleDefinition();
    const first = handle.add(definition);
    const second = handle.add(definition);

    expect(second).toBe(first);
    expect(handle.calculators).toHaveLength(1);
  });

  it('rejects a second definition with the same id', () => {
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      async () => moduleWith(),
    );
    handle.add(sampleDefinition());
    expect(() => handle.add(sampleDefinition())).toThrow('basic.sample');
  });

  it('loads the module once and registers its calculators', async () => {
    const definition = sampleDefinition();
    const load = vi.fn(async () => moduleWith(definition));
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      load,
    );

    const first = await handle.load();
    const second = await handle.load();

    expect(load).toHaveBeenCalledTimes(1);
    expect(handle.isLoaded).toBe(true);
    expect(first).toEqual([handle.get('sample')]);
    expect(second).toEqual(first);
  });

  it('clears a failed load so the user can retry', async () => {
    const definition = sampleDefinition();
    const load = vi
      .fn<() => Promise<CategoryModule>>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(moduleWith(definition));
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      load,
    );

    await expect(handle.load()).rejects.toThrow('network down');
    expect(handle.isLoaded).toBe(false);

    const calculators = await handle.load();
    expect(load).toHaveBeenCalledTimes(2);
    expect(calculators).toHaveLength(1);
    expect(handle.isLoaded).toBe(true);
  });

  it('validates calculators as they are added', () => {
    const handle = new CategoryHandle(
      'basic',
      'Basic',
      'Basic calculators.',
      async () => moduleWith(),
    );
    expect(() => handle.add({ ...sampleDefinition(), id: 'Bad Id' })).toThrow();
  });
});

describe('CalculatorApp', () => {
  it('creates a handle for every manifest entry in order', () => {
    const manifest = {
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load: async () => moduleWith(),
      },
      advanced: {
        title: 'Advanced',
        description: 'Advanced calculators.',
        load: async () => moduleWith(),
      },
    } as const satisfies CategoryManifest;

    const app = new CalculatorApp(manifest);
    expect(app.categoryIds).toEqual(['basic', 'advanced']);
    expect(app.categories.basic.title).toBe('Basic');
    expect(app.categories.advanced.description).toBe('Advanced calculators.');
  });

  it('rejects invalid category ids', () => {
    const manifest = {
      'Bad Id': {
        title: 'Bad',
        description: '',
        load: async () => moduleWith(),
      },
    } as unknown as CategoryManifest;

    expect(() => new CalculatorApp(manifest)).toThrow(
      'lowercase letters, digits, and hyphens',
    );
  });

  it('rejects categories without a title', () => {
    const manifest = {
      basic: {
        title: '  ',
        description: '',
        load: async () => moduleWith(),
      },
    } as const satisfies CategoryManifest;

    expect(() => new CalculatorApp(manifest)).toThrow('must have a title');
  });

  it('loads a category through its handle', async () => {
    const definition = sampleDefinition();
    const manifest = {
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load: async () => moduleWith(definition),
      },
    } as const satisfies CategoryManifest;

    const app = new CalculatorApp(manifest);
    const calculators = await app.categories.basic.load();
    expect(calculators).toHaveLength(1);
    expect(app.categories.basic.isLoaded).toBe(true);
  });
});
