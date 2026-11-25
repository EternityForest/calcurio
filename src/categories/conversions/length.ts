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
    'Convert between centimetres, inches, and feet. Enter any one value and ' +
    'the others follow.',
  variables: equivalentUnitVariables([
    { name: 'centimetres', label: 'Centimetres', unit: 'cm' },
    { name: 'inches', label: 'Inches', unit: 'in' },
    { name: 'feet', label: 'Feet', unit: 'ft' },
  ]),
};
