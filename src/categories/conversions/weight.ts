import type { CalculatorDefinition } from '../../framework/types.js';
import { equivalentUnitVariables } from './equivalent-units.js';

/**
 * Weight conversion. Kilograms, pounds, and ounces cover the everyday
 * measures; each field reflects the others, so entering any one fills the
 * rest.
 */
export const weightConversion: CalculatorDefinition = {
  id: 'weight',
  title: 'Weight',
  description:
    'Enter any one value and the others follow.',
  variables: equivalentUnitVariables([
    "kg","lb","oz"
  ]),
};
