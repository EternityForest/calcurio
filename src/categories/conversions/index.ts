import type { CalculatorDefinition } from '../../framework/types.js';
import { lengthConversion } from './length.js';
import { speedConversion } from './speed.js';
import { temperatureConversion } from './temperature.js';
import { volumeConversion } from './volume.js';
import { weightConversion } from './weight.js';

export const calculators: readonly CalculatorDefinition[] = [
  lengthConversion,
  volumeConversion,
  temperatureConversion,
  weightConversion,
  speedConversion,
];
