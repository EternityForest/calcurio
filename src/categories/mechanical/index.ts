import type { CalculatorDefinition } from '../../framework/types.js';
import { catenary } from './catenary.js';
import { raisedWeightEnergy } from './raised-weight-energy.js';

export const calculators: readonly CalculatorDefinition[] = [
  catenary,
  raisedWeightEnergy,
];
