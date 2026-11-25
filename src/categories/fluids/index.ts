import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { fluidsTable } from './fluids.js';
import { volumeAndWeight } from './volume-and-weight.js';

export const tables: readonly TableDefinition[] = [fluidsTable];

export const calculators: readonly CalculatorDefinition[] = [volumeAndWeight];
