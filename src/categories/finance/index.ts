import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { currencyTable } from './currencies.js';
import { currencyConverter } from './currency-converter.js';

export const tables: readonly TableDefinition[] = [currencyTable];
export const calculators: readonly CalculatorDefinition[] = [currencyConverter];
