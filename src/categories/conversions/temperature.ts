import type { CalculatorDefinition } from '../../framework/types.js';
import { equivalentUnitVariables } from './equivalent-units.js';

/**
 * Temperature conversion. Celsius, Fahrenheit, and kelvin are affine, so the
 * conversions carry the offset; each field reflects the others, so entering
 * any one fills the rest.
 */
export const temperatureConversion: CalculatorDefinition = {
  id: 'temperature',
  title: 'Temperature',
  description:
    'Convert between degrees Celsius, degrees Fahrenheit, and kelvin. Enter ' +
    'any one value and the others follow.',
  variables: equivalentUnitVariables([
    { name: 'celsius', label: 'Degrees Celsius', unit: 'degC' },
    { name: 'fahrenheit', label: 'Degrees Fahrenheit', unit: 'degF' },
    { name: 'kelvin', label: 'Kelvin', unit: 'K' },
  ]),
};
