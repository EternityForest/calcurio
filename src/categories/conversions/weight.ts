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
    'Convert between kilograms, pounds, and ounces. Enter any one value and ' +
    'the others follow.',
  variables: equivalentUnitVariables([
    { name: 'kilograms', label: 'Kilograms', unit: 'kg' },
    { name: 'pounds', label: 'Pounds', unit: 'lb' },
    { name: 'ounces', label: 'Ounces', unit: 'oz' },
  ]),
};
