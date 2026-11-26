import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { speedOfLight } from './speed-of-light.js';
import { waveMediaTable } from './wave-media.js';
import { wavelengthsTable } from './wavelengths.js';

export const tables: readonly TableDefinition[] = [
  waveMediaTable,
  wavelengthsTable,
];

export const calculators: readonly CalculatorDefinition[] = [speedOfLight];
