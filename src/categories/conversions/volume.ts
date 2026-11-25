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
    'Convert between gallons, litres, and cubic feet. Enter any one value ' +
    'and the others follow.',
  variables: equivalentUnitVariables([
    { name: 'gallons', label: 'Gallons', unit: 'gal' },
    { name: 'litres', label: 'Litres', unit: 'l' },
    { name: 'cubicFeet', label: 'Cubic feet', unit: 'ft3' },
  ]),
};
