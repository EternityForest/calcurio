import type { CalculatorConfig, CalculatorDefinition } from '../../framework/types.js';
import { buildOperands, getUnit, slotsConfig, unitConfig } from './arithmetic.js';
import { pairLabel } from './divide.js';

function buildVariables(
  config: CalculatorConfig,
): ReturnType<typeof buildOperands> {
  return buildOperands({
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
    unit: getUnit(config),
  });
}

/** Subtracts one number from another. Unit is configurable. */
export const subtract: CalculatorDefinition = {
  id: 'subtract',
  title: 'Subtract',
  description: 'Subtract one number from another.',
  config: [...slotsConfig, ...unitConfig],
  variables: buildVariables({ slots: 2, unit: '1' }),
  buildVariables,
  testCases: [
    { value1: 9, value2: 4, difference: 5 },
    { value1: 2.5, value2: -0.5, difference: 3 },
  ],
};
