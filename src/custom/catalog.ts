import {
  calculators as electricalCalculators,
  tables as electricalTables,
} from '../categories/electrical/index.js';
import { calculators as conversionCalculators } from '../categories/conversions/index.js';
import {
  calculators as fluidsCalculators,
  tables as fluidsTables,
} from '../categories/fluids/index.js';
import { calculators as mathCalculators } from '../categories/math/index.js';
import { calculators as mechanicalCalculators } from '../categories/mechanical/index.js';
import {
  calculators as physicsCalculators,
  tables as physicsTables,
} from '../categories/physics/index.js';
import { CustomDefinitionError } from '../framework/errors.js';
import { TableRegistry } from '../framework/tables.js';
import type {
  CalculatorConfig,
  CalculatorDefinition,
  ConfigFieldDefinition,
  TableDefinition,
  TableResolver,
  TableSource,
  VariableDefinition,
} from '../framework/types.js';

/** One calculator the builder can place as a step of a custom. */
export interface CatalogEntry {
  readonly definition: CalculatorDefinition;
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
 * the same category modules the widget loads, so a calculator only has to be
 * authored once. Calculators that run an async `computeState` are left out:
 * a step recomputes synchronously as part of the surrounding custom.
 */
export class CalculatorCatalog implements TableResolver {
  private readonly registry: TableRegistry;
  private readonly entries = new Map<string, CatalogEntry>();

  private constructor(registry: TableRegistry) {
    this.registry = registry;
  }

  /** Builds the catalog from the categories the widget ships with. */
  static standard(): CalculatorCatalog {
    const tables: readonly TableSource[] = [
      ...electricalTables,
      ...fluidsTables,
      ...physicsTables,
    ];
    const catalog = new CalculatorCatalog(new TableRegistry(tables));
    catalog.register(electricalCalculators);
    catalog.register(conversionCalculators);
    catalog.register(fluidsCalculators);
    catalog.register(mathCalculators);
    catalog.register(mechanicalCalculators);
    catalog.register(physicsCalculators);
    return catalog;
  }

  /** Entries in a stable order, as shown in the browser dialog. */
  list(): readonly CatalogEntry[] {
    return [...this.entries.values()];
  }

  get(id: string): CatalogEntry | undefined {
    return this.entries.get(id);
  }

  /** Like `get`, but raises when the id is unknown. */
  requireEntry(id: string): CatalogEntry {
    const entry = this.entries.get(id);
    if (entry === undefined) {
      throw new CustomDefinitionError(`Unknown subcalculator "${id}".`);
    }
    return entry;
  }

  getTable(id: string): TableDefinition | undefined {
    return this.registry.getTable(id);
  }

  /**
   * A step recomputes synchronously inside the surrounding custom, so a
   * calculator that owns an async `computeState` cannot be embedded.
   */
  accepts(definition: CalculatorDefinition): boolean {
    return definition.computeState === undefined;
  }

  private register(definitions: readonly CalculatorDefinition[]): void {
    for (const definition of definitions) {
      if (!this.accepts(definition)) {
        continue;
      }
      if (this.entries.has(definition.id)) {
        throw new CustomDefinitionError(
          `Subcalculator "${definition.id}" is registered twice.`,
        );
      }
      this.entries.set(definition.id, {
        definition,
        config: definition.config ?? [],
        variables: (config) =>
          definition.buildVariables?.(config) ?? definition.variables,
      });
    }
  }
}
