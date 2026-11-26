import type { CategoryHandle } from '../../framework/app.js';
import { CustomStorageError, errorMessage } from '../../framework/errors.js';
import type { CalculatorDefinition } from '../../framework/types.js';
import type { CalculatorCatalog } from '../../custom/catalog.js';
import { compileCustom } from '../../custom/compile.js';
import { customToJson } from '../../custom/serialize.js';
import type { CustomStore } from '../../custom/store.js';
import type { CustomDefinition } from '../../custom/types.js';
import { parseCatalogRef } from '../../custom/types.js';

/** One row of the Custom category: a saved custom and how it stands. */
export interface LibraryEntry {
  readonly custom: CustomDefinition;
  /** Why the custom cannot run, or null when it is fine. */
  readonly problem: string | null;
}

/** A compiled custom together with the stored text it was built from. */
interface CompiledCustom {
  readonly json: string;
  readonly definition: CalculatorDefinition;
}

/**
 * Keeps the Custom category's registered calculators in step with the saved
 * customs. `takeFrom`/wiring and validation live in the custom modules; this
 * class only decides when to recompile and what the category should offer.
 *
 * Only customs whose stored text changed are recompiled and re-registered, so
 * a runtime the user is working in survives edits to unrelated customs.
 */
export class CustomLibrary {
  readonly catalog: CalculatorCatalog;
  /** The persistence layer, or null when the browser offers no storage. */
  readonly store: CustomStore | null;

  private readonly handle: CategoryHandle;
  private readonly compiled = new Map<string, CompiledCustom>();
  private problems = new Map<string, string>();
  private readError: string | null = null;

  constructor(
    handle: CategoryHandle,
    store: CustomStore | null,
    catalog: CalculatorCatalog,
  ) {
    this.handle = handle;
    this.store = store;
    this.catalog = catalog;
  }

  /** Message from the last failed read of stored customs, if any. */
  get error(): string | null {
    return this.readError;
  }

  /** Every saved custom with the reason it cannot run, if any. */
  entries(): readonly LibraryEntry[] {
    return this.readCustoms().map((custom) => ({
      custom,
      problem: this.problems.get(custom.id) ?? null,
    }));
  }

  get(id: string): CustomDefinition | undefined {
    return this.readCustoms().find((custom) => custom.id === id);
  }

  /** Adds a new custom under a fresh id, then re-registers the category. */
  async create(custom: CustomDefinition): Promise<CustomDefinition> {
    const saved = this.requireStore().importCustom(custom);
    await this.refresh();
    return saved;
  }

  /** Inserts or replaces a custom by id, then re-registers the category. */
  async save(custom: CustomDefinition): Promise<CustomDefinition> {
    const saved = this.requireStore().save(custom);
    await this.refresh();
    return saved;
  }

  /** Deletes a custom by id, then re-registers the category. */
  async remove(id: string): Promise<void> {
    this.requireStore().delete(id);
    await this.refresh();
  }

  /** Imports exported JSON text, then re-registers the category. */
  async importJson(text: string): Promise<CustomDefinition> {
    const saved = this.requireStore().importJson(text);
    await this.refresh();
    return saved;
  }

  /**
   * Re-registers every saved custom, loading the categories they embed so
   * their subcalculators resolve, then compiling only those whose stored text
   * changed. A custom that fails to compile stays listed but is not runnable,
   * and its problem is shown in the hub.
   */
  async refresh(): Promise<void> {
    this.problems = new Map();
    if (this.store === null) {
      this.readError = null;
      return;
    }

    let customs: readonly CustomDefinition[];
    try {
      customs = this.store.list();
      this.readError = null;
    } catch (error) {
      this.readError = errorMessage(error);
      return;
    }

    await this.loadReferencedCategories(customs);

    const alive = new Set<string>();
    for (const custom of customs) {
      alive.add(custom.id);
      const json = customToJson(custom);
      const existing = this.compiled.get(custom.id);
      if (existing !== undefined && existing.json === json) {
        continue;
      }
      this.register(custom, json);
    }

    for (const id of [...this.compiled.keys()]) {
      if (!alive.has(id)) {
        this.compiled.delete(id);
        this.handle.remove(id);
      }
    }
  }

  /** Loads the categories the stored customs embed, so they can compile. */
  private async loadReferencedCategories(
    customs: readonly CustomDefinition[],
  ): Promise<void> {
    const categoryIds = new Set<string>();
    for (const custom of customs) {
      for (const step of custom.steps) {
        if (step.kind !== 'subcalc') {
          continue;
        }
        const ref = parseCatalogRef(step.calculatorRef);
        if (ref !== null) {
          categoryIds.add(ref.categoryId);
        }
      }
    }
    await Promise.all(
      [...categoryIds].map((categoryId) => this.loadCategory(categoryId)),
    );
  }

  private async loadCategory(categoryId: string): Promise<void> {
    try {
      await this.catalog.load(categoryId);
    } catch {
      // A category that fails to load leaves the customs that embed it with a
      // "unknown subcalculator" problem; the rest still compile and run.
    }
  }

  private register(custom: CustomDefinition, json: string): void {
    try {
      const definition = compileCustom(custom, this.catalog);
      this.handle.upsert(definition);
      this.compiled.set(custom.id, { json, definition });
    } catch (error) {
      this.compiled.delete(custom.id);
      this.handle.remove(custom.id);
      this.problems.set(custom.id, errorMessage(error));
    }
  }

  private readCustoms(): readonly CustomDefinition[] {
    if (this.store === null) {
      return [];
    }
    try {
      return this.store.list();
    } catch (error) {
      this.readError = errorMessage(error);
      return [];
    }
  }

  private requireStore(): CustomStore {
    if (this.store === null) {
      throw new CustomStorageError('Customs cannot be saved in this browser.');
    }
    return this.store;
  }
}
