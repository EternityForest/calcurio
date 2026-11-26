import { describe, expect, it } from 'vitest';
import { assertCalculatorTests } from '../../framework/testing.js';
import { circles } from './circles.js';
import { riseRunAngle } from './rise-run-angle.js';
import { sphere } from './sphere.js';

const CALCULATORS = [riseRunAngle, circles, sphere];

describe('Geometry category', () => {
  it('passes every calculator test case', () => {
    for (const definition of CALCULATORS) {
      expect(() => assertCalculatorTests(definition)).not.toThrow();
    }
  });
});
