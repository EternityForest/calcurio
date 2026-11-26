import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { fluidsTable } from './fluids.js';
import { orificeFlow } from './orifice-flow.js';
import { pipeFlow } from './pipe-flow.js';
import { pipePressureDrop } from './pipe-pressure-drop.js';
import { volumeAndWeight } from './volume-and-weight.js';

export const tables: readonly TableDefinition[] = [fluidsTable];

export const calculators: readonly CalculatorDefinition[] = [
  volumeAndWeight,
  orificeFlow,
  pipeFlow,
  pipePressureDrop,
];
