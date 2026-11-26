import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { catenary } from './catenary.js';
import { calculators } from './index.js';
import { raisedWeightEnergy } from './raised-weight-energy.js';

describe('Mechanical category', () => {
  it('passes every calculator test case', () => {
    for (const definition of calculators) {
      expect(() => assertCalculatorTests(definition)).not.toThrow();
    }
  });
});

describe('Catenary', () => {
  it('computes the anchor force and chain length from the span and loads', () => {
    const calc = new CalculatorRuntime(catenary);
    calc.setDisplayText('width', '10');
    calc.setDisplayText('droop', '1');
    calc.setDisplayText('centerWeight', '100');
    calc.setDisplayText('ropeWeight', '50');
    expect(calc.state['forcePerAnchor']).toBeCloseTo(321.2181871224574, 9);
    expect(calc.state['length']).toBeCloseTo(10.200554881818187, 9);
    expect(calc.errors).toEqual([]);
  });

  it('handles a cable with no centre load', () => {
    const calc = new CalculatorRuntime(catenary);
    calc.setDisplayText('width', '20');
    calc.setDisplayText('droop', '2');
    calc.setDisplayText('ropeWeight', '100');
    expect(calc.state['centerWeight']).toBe(0);
    expect(calc.state['forcePerAnchor']).toBeCloseTo(133.1457654385469, 9);
    expect(calc.state['length']).toBeCloseTo(20.52373736257518, 9);
  });

  it('gives a chain a little longer than the straight span', () => {
    const calc = new CalculatorRuntime(catenary);
    calc.setDisplayText('width', '30');
    calc.setDisplayText('droop', '3');
    calc.setDisplayText('centerWeight', '500');
    calc.setDisplayText('ropeWeight', '200');
    expect(calc.state['length']).toBeCloseTo(30.599357461549904, 9);
    expect(calc.errors).toEqual([]);
  });

  it('reports a non-positive droop', () => {
    const calc = new CalculatorRuntime(catenary);
    calc.setDisplayText('width', '10');
    calc.setDisplayText('droop', '0');
    calc.setDisplayText('ropeWeight', '50');
    expect(calc.state['forcePerAnchor']).toBeNull();
    expect(calc.state['length']).toBeNull();
    expect(calc.issuesFor('droop')[0]?.message).toContain('greater than zero');
  });
});

describe('Energy stored in a raised weight', () => {
  it('computes the potential energy, m·g·h', () => {
    const calc = new CalculatorRuntime(raisedWeightEnergy);
    calc.setDisplayText('mass', '100');
    calc.setDisplayText('height', '10');
    expect(calc.state['gravity']).toBeCloseTo(9.80665, 12);
    expect(calc.state['energy']).toBeCloseTo(9806.65, 9);
    expect(calc.errors).toEqual([]);
  });

  it('lets gravity be changed', () => {
    const calc = new CalculatorRuntime(raisedWeightEnergy);
    calc.setDisplayText('mass', '5');
    calc.setDisplayText('height', '2.5');
    calc.setDisplayText('gravity', '9.81');
    expect(calc.state['energy']).toBeCloseTo(122.625, 9);
  });
});
