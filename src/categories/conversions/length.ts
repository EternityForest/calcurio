import type { CalculatorDefinition } from '../../framework/types.js';
import { equivalentUnitVariables } from './equivalent-units.js';

/**
 * Length conversion. Centimetres, inches, and feet cover the everyday
 * measures; each field reflects the others, so entering any one fills the
 * rest.
 */
export const lengthConversion: CalculatorDefinition = {
  id: 'length',
  title: 'Length',
  description:
    'Enter any one value and the others follow.',
  variables: equivalentUnitVariables([
    "cm","in","ft"
  ]),
};
