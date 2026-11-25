import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { wireGaugeTable } from './wire-gauge.js';
import { wireMetalsTable } from './wire-metals.js';
import { wireResistance } from './wire-resistance.js';

export const tables: readonly TableDefinition[] = [
  wireGaugeTable,
  wireMetalsTable,
];

export const calculators: readonly CalculatorDefinition[] = [wireResistance];