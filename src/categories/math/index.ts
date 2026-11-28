import type { CalculatorDefinition } from '../../framework/types.js';
import { add } from './add.js';
import { divide } from './divide.js';
import { expression } from './expression.js';
import { multiply } from './multiply.js';
import { reinterpret } from './reinterpret.js';
import { subtract } from './subtract.js';

export const calculators: readonly CalculatorDefinition[] = [
  add,
  subtract,
  multiply,
  divide,
  expression,
  reinterpret,
];
