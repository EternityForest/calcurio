import type {
  CalculatorConfig,
  CalculatorDefinition,
  VariableDefinition,
} from '../../framework/types.js';
import {
  buildOperands,
  numberedLabel,
  slotCount,
  slotsConfig,
} from './arithmetic.js';

function buildVariables(
  config: CalculatorConfig,
): readonly VariableDefinition[] {
  return buildOperands({
    count: slotCount(config),
    operandLabel: numberedLabel,
    resultName: 'product',
    resultLabel: 'Product',
    combine: (values) => values.reduce((total, value) => total * value, 1),
  });
}

/** Multiplies two to ten numbers. The count is a config setting. */
export const multiply: CalculatorDefinition = {
  id: 'multiply',
  title: 'Multiply',
  description: 'Multiply two to ten numbers together.',
  config: slotsConfig,
  variables: buildVariables({ slots: 2 }),
  buildVariables,
  testCases: [
    { value1: 3, value2: 4, product: 12 },
    { value1: -2, value2: 2.5, product: -5 },
  ],
};
