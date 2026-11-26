import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { orificeFlow } from './orifice-flow.js';
import { pipeFlow } from './pipe-flow.js';
import { pressureAreaForce } from './pressure-area-force.js';

function number(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error(`Expected a number, got ${String(value)}.`);
  }
  return value;
}

describe('Orifice flow', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(orificeFlow)).not.toThrow();
  });

  it('scales with the square root of the head', () => {
    const calc = new CalculatorRuntime(orificeFlow);
    calc.setDisplayText('orificeDiameter', '50');
    calc.setDisplayText('head', '1');
    const first = number(calc.state['flowRate']);
    calc.setDisplayText('head', '4');
    const second = number(calc.state['flowRate']);
    expect(second).toBeCloseTo(first * 2, 9);
    expect(calc.errors).toEqual([]);
  });

  it('reports a discharge coefficient above one', () => {
    const calc = new CalculatorRuntime(orificeFlow);
    calc.setDisplayText('dischargeCoefficient', '1.2');
    calc.setDisplayText('orificeDiameter', '50');
    calc.setDisplayText('head', '1');
    expect(calc.validationIssues.length).toBeGreaterThan(0);
  });
});

describe('Pipe flow', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(pipeFlow)).not.toThrow();
  });

  it('computes the flow rate from diameter and velocity', () => {
    const calc = new CalculatorRuntime(pipeFlow);
    calc.setDisplayText('diameter', '50');
    calc.setDisplayText('velocity', '2');
    expect(number(calc.state['flowRate'])).toBeCloseTo(
      0.003926990816987242,
      12,
    );
    expect(calc.errors).toEqual([]);
  });

  it('solves the velocity from diameter and flow rate', () => {
    const calc = new CalculatorRuntime(pipeFlow);
    calc.setDisplayUnit('flowRate', 'm3/s');
    calc.setDisplayText('diameter', '50');
    calc.setDisplayText('flowRate', '0.003926990816987242');
    calc.calculate('velocity');
    expect(number(calc.state['velocity'])).toBeCloseTo(2, 9);
  });

  it('solves the diameter from flow rate and velocity', () => {
    const calc = new CalculatorRuntime(pipeFlow);
    calc.setDisplayUnit('flowRate', 'm3/s');
    calc.setDisplayText('flowRate', '0.003926990816987242');
    calc.setDisplayText('velocity', '2');
    calc.calculate('diameter');
    expect(number(calc.state['diameter'])).toBeCloseTo(50, 9);
  });
});

describe('Pressure, area, and force', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(pressureAreaForce)).not.toThrow();
  });

  it('computes force from pressure and area', () => {
    const calc = new CalculatorRuntime(pressureAreaForce);
    calc.setDisplayUnit('pressure', 'Pa');
    calc.setDisplayUnit('area', 'm2');
    calc.setDisplayText('pressure', '100');
    calc.setDisplayText('area', '0.01');
    expect(number(calc.state['force'])).toBeCloseTo(1, 9);
  });

  it('solves pressure from force and area', () => {
    const calc = new CalculatorRuntime(pressureAreaForce);
    calc.setDisplayUnit('pressure', 'Pa');
    calc.setDisplayUnit('area', 'm2');
    calc.setDisplayText('force', '1000');
    calc.setDisplayText('area', '0.01');
    calc.calculate('pressure');
    expect(number(calc.state['pressure'])).toBeCloseTo(100000, 9);
  });
});
