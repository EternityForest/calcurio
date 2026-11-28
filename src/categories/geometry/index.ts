import type { CalculatorDefinition } from '../../framework/types.js';
import { boxVolume } from './box-volume.js';
import { circles } from './circles.js';
import { cylinderProperties } from './cylinder-properties.js';
import { densityWeightVolume } from './density-weight-volume.js';
import { pythagoreanTheorem } from './pythagorean-theorem.js';
import { regularPolygon } from './regular-polygon.js';
import { riseRunAngle } from './rise-run-angle.js';
import { sphere } from './sphere.js';
import { squareArea } from './square-area.js';

export const calculators: readonly CalculatorDefinition[] = [
  riseRunAngle,
  circles,
  sphere,
  squareArea,
  boxVolume,
  cylinderProperties,
  regularPolygon,
  pythagoreanTheorem,
  densityWeightVolume,
];
