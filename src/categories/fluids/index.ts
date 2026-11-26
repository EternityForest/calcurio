import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { materialsTable } from '../../models/materials.js';
import { orificeFlow } from './orifice-flow.js';
import { pipeFlow } from './pipe-flow.js';
import { pipePressureDrop } from './pipe-pressure-drop.js';

export const tables: readonly TableDefinition[] = [materialsTable];

export const calculators: readonly CalculatorDefinition[] = [
  orificeFlow,
  pipeFlow,
  pipePressureDrop,
];
