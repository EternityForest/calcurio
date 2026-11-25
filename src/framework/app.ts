import type {
  CalculatorDefinition,
  CategoryManifest,
  CategoryManifestEntry,
  CategoryModule,
  TableDefinition,
  TableSource,
} from './types.js';
import { TableRegistry } from './tables.js';
import { isValidIdentifier, validateCalculatorDefinition } from './validate.js';

/** A calculator together with its fully qualified identity. */
export interface RegisteredCalculator {
  readonly definition: CalculatorDefinition;
  readonly categoryId: string;
  /** Stable identifier used by bookmarks: `<categoryId>.<calculatorId>`. */
  readonly globalId: string;
}

export function globalIdFor(categoryId: string, calculatorId: string): string {
  return `${categoryId}.${calculatorId}`;
}

/**
 * One category of calculators. Calculators can be added directly, or supplied
 * by the lazily imported module registered in the app manifest.
 */
export class CategoryHandle {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  private readonly loader: () => Promise<CategoryModule>;
  private readonly calculatorsById = new Map<string, RegisteredCalculator>();
  private readonly tableRegistry = new TableRegistry();
  private loadPromise: Promise<readonly RegisteredCalculator[]> | null = null;
  private loaded = false;

  constructor(
    id: string,
    title: string,
    description: string,
    loader: () => Promise<CategoryModule>,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.loader = loader;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  get calculators(): readonly RegisteredCalculator[] {
    return [...this.calculatorsById.values()];
  }

  get tables(): readonly TableDefinition[] {
    return this.tableRegistry.all;
  }

  /** Registers a table that calculators in this category can reference. */
  addTable(table: TableSource): TableSource {
    return this.tableRegistry.add(table);
  }

  getTable(tableId: string): TableDefinition | undefined {
    return this.tableRegistry.getTable(tableId);
  }

  requireTable(tableId: string): TableDefinition {
    return this.tableRegistry.requireTable(tableId);
  }

  /**
   * Registers a calculator. Registering the identical definition twice is a
   * no-op, which makes lazy module loading safe to retry.
   */
  add(definition: CalculatorDefinition): RegisteredCalculator {
    validateCalculatorDefinition(definition);
    const existing = this.calculatorsById.get(definition.id);
    if (existing !== undefined) {
      if (existing.definition === definition) {
        return existing;
      }
      throw new Error(
        `Calculator "${globalIdFor(this.id, definition.id)}" is already ` +
          'registered.',
      );
    }

    const registered: RegisteredCalculator = {
      definition,
      categoryId: this.id,
      globalId: globalIdFor(this.id, definition.id),
    };
    this.calculatorsById.set(definition.id, registered);
    return registered;
  }

  /**
   * Registers a calculator, replacing any existing one with the same id. Used
   * by categories whose calculator list is built and edited at runtime, so an
   * unrelated calculator keeps its identity and open values.
   */
  upsert(definition: CalculatorDefinition): RegisteredCalculator {
    validateCalculatorDefinition(definition);
    const existing = this.calculatorsById.get(definition.id);
    if (existing !== undefined && existing.definition === definition) {
      return existing;
    }
    const registered: RegisteredCalculator = {
      definition,
      categoryId: this.id,
      globalId: globalIdFor(this.id, definition.id),
    };
    this.calculatorsById.set(definition.id, registered);
    return registered;
  }

  /** Removes a calculator by id, reporting whether one was registered. */
  remove(calculatorId: string): boolean {
    return this.calculatorsById.delete(calculatorId);
  }

  get(calculatorId: string): RegisteredCalculator | undefined {
    return this.calculatorsById.get(calculatorId);
  }

  /**
   * Imports the category module once. A failed import is cleared so the user
   * can retry from the UI.
   */
  load(): Promise<readonly RegisteredCalculator[]> {
    if (this.loaded) {
      return Promise.resolve(this.calculators);
    }
    this.loadPromise ??= this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<readonly RegisteredCalculator[]> {
    try {
      const module = await this.loader();
      for (const table of module.tables ?? []) {
        this.addTable(table);
      }
      for (const definition of module.calculators) {
        this.add(definition);
      }
      this.loaded = true;
      return this.calculators;
    } catch (error) {
      this.loadPromise = null;
      throw error;
    }
  }
}

/** Maps manifest keys to their typed category handles. */
export type CategoryMap<M extends CategoryManifest> = {
  readonly [K in keyof M]: CategoryHandle;
} & Readonly<Record<string, CategoryHandle>>;

/**
 * The calculator application: a manifest of lazy categories plus the registry
 * of calculators that have been loaded or added so far.
 */
export class CalculatorApp<M extends CategoryManifest> {
  readonly manifest: M;
  readonly categories: CategoryMap<M>;

  constructor(manifest: M) {
    this.manifest = manifest;
    const categories: Record<string, CategoryHandle> = {};
    for (const [id, entry] of Object.entries(manifest)) {
      assertManifestEntry(id, entry);
      categories[id] = new CategoryHandle(
        id,
        entry.title,
        entry.description,
        entry.load,
      );
    }
    this.categories = categories as CategoryMap<M>;
  }

  /** Manifest order is preserved for the category list. */
  get categoryIds(): readonly (keyof M & string)[] {
    return Object.keys(this.manifest) as (keyof M & string)[];
  }
}

function assertManifestEntry(id: string, entry: CategoryManifestEntry): void {
  if (!isValidIdentifier(id)) {
    throw new Error(
      `Category id "${id}" must use lowercase letters, digits, and hyphens.`,
    );
  }
  if (entry.title.trim() === '') {
    throw new Error(`Category "${id}" must have a title.`);
  }
}
