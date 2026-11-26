import { missing } from '../../framework/missing.js';
import type {
  CalcState,
  CalculatorDefinition,
  VariableDefinition,
} from '../../framework/types.js';

function buildChoiceVariables(count: number): readonly VariableDefinition[] {
  const size = Math.max(1, Math.floor(count));
  const variables: VariableDefinition[] = [];
  for (let index = 1; index <= size; index += 1) {
    variables.push({
      name: `choice${index}`,
      label: `Choice ${index}`,
      description: 'Text to choose from.',
      default: '',
    });
  }
  variables.push({
    name: 'result',
    label: 'Chosen',
    editable: false,
    autoUpdate: false,
    description: 'Press Calculate to choose one of the options.',
    computable: (state: Readonly<CalcState>) => {
      const choices: string[] = [];
      for (let index = 1; index <= size; index += 1) {
        const value = state[`choice${index}`];
        if (typeof value === 'string' && value !== '') {
          choices.push(value);
        }
      }
      if (choices.length === 0) {
        const needs: string[] = [];
        for (let index = 1; index <= size; index += 1) {
          needs.push(`choice${index}`);
        }
        return missing(needs);
      }
      return choices[Math.floor(Math.random() * choices.length)]!;
    },
  });
  return variables;
}

export const choice: CalculatorDefinition = {
  id: 'choice',
  title: 'Choice',
  description:
    'Choose one of several text options at random. Press Calculate on the ' +
    'result to pick.',
  config: [
    {
      name: 'count',
      label: 'Number of choices',
      kind: 'number',
      default: 3,
      min: 1,
    },
  ],
  variables: buildChoiceVariables(3),
  buildVariables: (config) => buildChoiceVariables(Number(config.count)),
};
