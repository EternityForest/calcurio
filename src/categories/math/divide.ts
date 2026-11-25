import { missing } from '../../framework/missing.js';
import type { CalculatorDefinition } from '../../framework/types.js';
import { buildOperands } from './arithmetic.js';

/** Operand labels for a two-value operation, in reading order. */
export function pairLabel(
  first: string,
  second: string,
): (index: number) => string {
  return (index) => (index === 0 ? first : second);
}

/** Divides one number by another. */
export const divide: CalculatorDefinition = {
  id: 'divide',
  title: 'Divide',
  description: 'Divide one number by another.',
  variables: buildOperands({
    count: 2,
    operandLabel: pairLabel('Dividend', 'Divisor'),
    resultName: 'quotient',
    resultLabel: 'Quotient',
    combine: (values) => {
      const dividend = values[0];
      const divisor = values[1];
      if (dividend === undefined || divisor === undefined || divisor === 0) {
        return missing([]);
      }
      return dividend / divisor;
    },
  }),
  testCases: [
    { value1: 10, value2: 4, quotient: 2.5 },
    { value1: -9, value2: 3, quotient: -3 },
  ],
};
