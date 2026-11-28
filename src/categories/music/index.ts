import type {
  CalculatorDefinition,
  TableSource,
} from '../../framework/types.js';
import { equalTemperament } from './equal-temperament.js';

export const tables: readonly TableSource[] = [];

export const calculators: readonly CalculatorDefinition[] = [
  equalTemperament,
];
