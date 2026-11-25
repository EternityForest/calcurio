import type {
  CalculatorDefinition,
  TableSource,
} from '../../framework/types.js';
import './hub.js';

/**
 * The Custom category ships no fixed calculators: the hub builds them from the
 * user's saved customs and registers them on the category handle. The import
 * above defines the `<calc-custom-hub>` element the manifest names.
 */
export const calculators: readonly CalculatorDefinition[] = [];
export const tables: readonly TableSource[] = [];
