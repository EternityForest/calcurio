import type { CalculatorApp } from '../framework/app.js';
import { CustomDefinitionError } from '../framework/errors.js';
import type {
  CalculatorConfig,
  CalculatorDefinition,
  CategoryManifest,
  ConfigFieldDefinition,
  TableDefinition,
  TableResolver,
  VariableDefinition,
} from '../framework/types.js';
import { catalogRef, parseCatalogRef } from './types.js';

/** One category a custom may embed a calculator from. */
export interface CatalogCategory {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

/** One calculator the builder can place as a step of a custom. */
export interface CatalogEntry {
  readonly definition: CalculatorDefinition;
  /** Category the calculator belongs to, shown in the browser. */
  readonly categoryId: string;
  /** "category:id" reference a step stores to instantiate this entry. */
  readonly ref: string;
  /** Settings a step may adjust, shaping its variable list. */
  readonly config: readonly ConfigFieldDefinition[];
  /**
   * Variable list for a config, built the same way the runtime builds it, so
   * the editor and the compiled custom agree on names and kinds.
   */
  variables(config: CalculatorConfig): readonly VariableDefinition[];
}

/**
 * Every calculator a custom may embed, plus the tables they read. Built from
 * the app's lazy categories, so a category (and its heavy modules) is only
 * loaded when something browses or references it. Calculators that run an
 * async `computeState` are left out: a step recomputes synchronously as part
 * of the surrounding custom.
 */
export class CalculatorCatalog implements TableResolver {
  private readonly app: CalculatorApp<CategoryManifest>;
  /** Manifest order of the categories whose calculators may be embedded. */
  private readonly embeddedIds: readonly string[];

  constructor(
    app: CalculatorApp<CategoryManifest>,
    options: { exclude?: readonly string[] } = {},
  ) {
    this.app = app;
    const exclude = new Set(options.exclude ?? []);
    // A hub category builds its calculators at runtime, so it is never
    // embedded: a custom cannot depend on another custom.
    this.embeddedIds = app.categoryIds.filter(
      (id) => !exclude.has(id) && app.manifest[id]?.hub === undefined,
    );
  }

  /** Categories, in manifest order, whose calculators a custom may embed. */
  categories(): readonly CatalogCategory[] {
    const categories: CatalogCategory[] = [];
    for (const id of this.embeddedIds) {
      const entry = this.app.manifest[id];
      if (entry === undefined) {
        continue;
      }
      categories.push({
        id,
        title: entry.title,
        description: entry.description,
      });
    }
    return categories;
  }

  /** Imports a category so its calculators can be browsed and resolved. */
  async load(categoryId: string): Promise<void> {
    await this.app.categories[categoryId]?.load();
  }

  isLoaded(categoryId: string): boolean {
    return this.app.categories[categoryId]?.isLoaded ?? false;
  }

  /** Embeddable calculators of a loaded category, in registration order. */
  entries(categoryId: string): readonly CatalogEntry[] {
    const handle = this.app.categories[categoryId];
    if (handle === undefined) {
      return [];
    }
    return handle.calculators
      .filter((registered) => this.accepts(registered.definition))
      .map((registered) => this.entry(categoryId, registered.definition));
  }

  /** Looks up an entry by its "category:id" reference. */
  get(ref: string): CatalogEntry | undefined {
    const parsed = parseCatalogRef(ref);
    if (parsed === null) {
      return undefined;
    }
    const definition = this.app.categories[parsed.categoryId]?.get(
      parsed.calculatorId,
    )?.definition;
    if (definition === undefined || !this.accepts(definition)) {
      return undefined;
    }
    return this.entry(parsed.categoryId, definition);
  }

  /** Like `get`, but raises when the reference is unknown. */
  requireEntry(ref: string): CatalogEntry {
    const entry = this.get(ref);
    if (entry === undefined) {
      throw new CustomDefinitionError(`Unknown subcalculator "${ref}".`);
    }
    return entry;
  }

  /** Searches the loaded categories for a table by id. */
  getTable(id: string): TableDefinition | undefined {
    for (const categoryId of this.embeddedIds) {
      const table = this.app.categories[categoryId]?.getTable(id);
      if (table !== undefined) {
        return table;
      }
    }
    return undefined;
  }

  /**
   * A step recomputes synchronously inside the surrounding custom, so a
   * calculator that owns an async `computeState` cannot be embedded.
   */
  accepts(definition: CalculatorDefinition): boolean {
    return definition.computeState === undefined;
  }

  private entry(
    categoryId: string,
    definition: CalculatorDefinition,
  ): CatalogEntry {
    return {
      definition,
      categoryId,
      ref: catalogRef(categoryId, definition.id),
      config: definition.config ?? [],
      variables: (config) =>
        definition.buildVariables?.(config) ?? definition.variables,
    };
  }
}
