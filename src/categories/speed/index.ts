import type { CalculatorDefinition } from '../../framework/types.js';
import { speedDistanceTime } from './speed-distance-time.js';

export const calculators: readonly CalculatorDefinition[] = [
  speedDistanceTime,
];
