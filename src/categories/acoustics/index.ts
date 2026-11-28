import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { soundDelay } from './sound-delay.js';
import { speedOfSoundTable } from './speed-of-sound-table.js';

export const tables: readonly TableDefinition[] = [speedOfSoundTable];

export const calculators: readonly CalculatorDefinition[] = [soundDelay];
