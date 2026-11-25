import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { fluidsTable } from './fluids.js';
import { volumeAndWeight } from './volume-and-weight.js';

const registry = new TableRegistry([fluidsTable]);

describe('Volume and weight', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(volumeAndWeight, { tables: registry }),
    ).not.toThrow();
  });

  it('brings in density when a fluid is chosen', () => {
    const calc = new CalculatorRuntime(volumeAndWeight, registry);
    calc.setSelection('fluid', 'water');
    expect(calc.state['density']).toBeCloseTo(998.2, 9);
    expect(calc.errors).toEqual([]);
  });

  it('computes weight from volume and density', () => {
    const calc = new CalculatorRuntime(volumeAndWeight, registry);
    calc.setSelection('fluid', 'propylene-glycol-50');
    calc.setDisplayText('volume', '20');
    expect(calc.state['weight']).toBeCloseTo(20.782, 6);
  });

  it('computes volume from weight and density', () => {
    const calc = new CalculatorRuntime(volumeAndWeight, registry);
    calc.setSelection('fluid', 'mineral-oil');
    calc.setDisplayText('weight', '176');
    expect(calc.state['volume']).toBeCloseTo(0.2, 9);
  });
});
