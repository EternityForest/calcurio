import type {
  CalculatorConfig,
  CalculatorDefinition,
  VariableDefinition,
} from '../../framework/types.js';
import {
  buildOperands,
  getUnit,
  numberedLabel,
  slotCount,
  slotsConfig,
  unitConfig,
} from './arithmetic.js';

function buildVariables(
  config: CalculatorConfig,
): readonly VariableDefinition[] {
  return buildOperands({
    count: slotCount(config),
    operandLabel: numberedLabel,
    resultName: 'sum',
    resultLabel: 'Sum',
    combine: (values) => values.reduce((total, value) => total + value, 0),
    unit: getUnit(config),
  });
}

/** Adds two to ten numbers. The number of values and unit are configurable. */
export const add: CalculatorDefinition = {
  id: 'add',
  title: 'Add',
  description: 'Add two to ten numbers together.',
  config: [...slotsConfig, ...unitConfig],
  variables: buildVariables({ slots: 2, unit: '1' }),
  buildVariables,
  testCases: [
    { value1: 2, value2: 3, sum: 5 },
    { value1: -4, value2: 1.5, sum: -2.5 },
  ],
};
