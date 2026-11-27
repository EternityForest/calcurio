import type { CalculatorDefinition } from '../../framework/types.js';
import { equivalentUnitVariables } from './equivalent-units.js';

/**
 * Speed conversion. Kilometres per hour, miles per hour, feet per second, and
 * metres per second cover the everyday measures; each field reflects the
 * others, so entering any one fills the rest.
 */
export const speedConversion: CalculatorDefinition = {
  id: 'speed',
  title: 'Speed',
  description:
    'Convert between kilometres per hour, miles per hour, feet per second, ' +
    'and metres per second. Enter any one value and the others follow.',
  variables: equivalentUnitVariables([
    { name: 'kilometresPerHour', label: 'Kilometres per hour', unit: 'km/h' },
    { name: 'milesPerHour', label: 'Miles per hour', unit: 'mi/h' },
    { name: 'feetPerSecond', label: 'Feet per second', unit: 'ft/s' },
    { name: 'metresPerSecond', label: 'Metres per second', unit: 'm/s' },
  ]),
};
