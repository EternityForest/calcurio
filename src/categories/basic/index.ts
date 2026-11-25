import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { capacitanceAtDcBias } from './capacitance-at-dc-bias.js';
import { inductanceAtBias } from './inductance-at-bias.js';
import { ohmsLaw } from './ohms-law.js';

export const tables: readonly TableDefinition[] = [
  inductorTypesTable,
  capacitorTypesTable,
];

export const calculators: readonly CalculatorDefinition[] = [
  ohmsLaw,
  inductanceAtBias,
  capacitanceAtDcBias,
];
