import type { CalculatorDefinition } from '../../framework/types.js';
import { equivalentUnitVariables } from './equivalent-units.js';

/**
 * Volume conversion. Gallons, litres, and cubic feet cover the everyday
 * measures; each field reflects the others, so entering any one fills the
 * rest.
 */
export const volumeConversion: CalculatorDefinition = {
  id: 'volume',
  title: 'Volume',
  description:
    'Enter any one value and the others follow.',
  variables: equivalentUnitVariables(["gal","l","ft^3"
  ]),
};
