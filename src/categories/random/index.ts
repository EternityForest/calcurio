import type { CalculatorDefinition } from '../../framework/types.js';
import { choice } from './choice.js';
import { randomNumber } from './random-number.js';
import { uuidv7Calculator } from './uuidv7.js';

export const calculators: readonly CalculatorDefinition[] = [
  uuidv7Calculator,
  randomNumber,
  choice,
];
