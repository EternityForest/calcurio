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
    'Enter any one value and the others follow.',
  variables: equivalentUnitVariables(["km/h","mi/h","ft/s","m/s"])
};
