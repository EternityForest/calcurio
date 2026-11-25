import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { inrushTransient } from './inrush.js';

export const tables: readonly TableDefinition[] = [
  inductorTypesTable,
  capacitorTypesTable,
];

export const calculators: readonly CalculatorDefinition[] = [inrushTransient];
