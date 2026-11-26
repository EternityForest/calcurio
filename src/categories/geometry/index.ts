import type { CalculatorDefinition } from '../../framework/types.js';
import { circles } from './circles.js';
import { riseRunAngle } from './rise-run-angle.js';
import { sphere } from './sphere.js';

export const calculators: readonly CalculatorDefinition[] = [
  riseRunAngle,
  circles,
  sphere,
];
