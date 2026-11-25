import type { CalculatorDefinition } from '../../framework/types.js';
import { buildOperands } from './arithmetic.js';
import { pairLabel } from './divide.js';

/** Subtracts one number from another. */
export const subtract: CalculatorDefinition = {
  id: 'subtract',
  title: 'Subtract',
  description: 'Subtract one number from another.',
  variables: buildOperands({
    count: 2,
    operandLabel: pairLabel('Minuend', 'Subtrahend'),
    resultName: 'difference',
    resultLabel: 'Difference',
    combine: (values) => {
      const minuend = values[0];
      const subtrahend = values[1];
      if (minuend === undefined || subtrahend === undefined) {
        return 0;
      }
      return minuend - subtrahend;
    },
  }),
  testCases: [
    { value1: 9, value2: 4, difference: 5 },
    { value1: 2.5, value2: -0.5, difference: 3 },
  ],
};
