import type { CategoryHandle } from '../../framework/app.js';
import { CustomStorageError, errorMessage } from '../../framework/errors.js';
import type { CalculatorDefinition } from '../../framework/types.js';
import { CalculatorCatalog } from '../../custom/catalog.js';
import { compileCustom } from '../../custom/compile.js';
import { customToJson } from '../../custom/serialize.js';
import type { CustomStore } from '../../custom/store.js';
import type { CustomDefinition } from '../../custom/types.js';

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
  create(custom: CustomDefinition): CustomDefinition {
    const saved = this.requireStore().importCustom(custom);
    this.refresh();
    return saved;
  }

  /** Inserts or replaces a custom by id, then re-registers the category. */
  save(custom: CustomDefinition): CustomDefinition {
    const saved = this.requireStore().save(custom);
    this.refresh();
    return saved;
  }

  /** Deletes a custom by id, then re-registers the category. */
  remove(id: string): void {
    this.requireStore().delete(id);
    this.refresh();
  }

  /** Imports exported JSON text, then re-registers the category. */
  importJson(text: string): CustomDefinition {
    const saved = this.requireStore().importJson(text);
    this.refresh();
    return saved;
  }

  /**
   * Re-registers every saved custom, compiling only those whose stored text
   * changed. A custom that fails to compile stays listed but is not runnable,
   * and its problem is shown in the hub.
   */
  refresh(): void {
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
