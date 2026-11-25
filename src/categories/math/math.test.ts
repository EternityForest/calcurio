import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { add } from './add.js';
import { divide } from './divide.js';
import { multiply } from './multiply.js';
import { subtract } from './subtract.js';

const CALCULATORS = [add, subtract, multiply, divide];

describe('Math category', () => {
  it('passes every calculator test case', () => {
    for (const definition of CALCULATORS) {
      expect(() => assertCalculatorTests(definition)).not.toThrow();
    }
  });
});

describe('Add', () => {
  it('adds the configured number of values', () => {
    const calc = new CalculatorRuntime(add, undefined, { slots: 4 });
    calc.setDisplayText('value1', '1');
    calc.setDisplayText('value2', '2');
    calc.setDisplayText('value3', '3');
    calc.setDisplayText('value4', '4');
    expect(calc.state['sum']).toBe(10);
    expect(calc.errors).toEqual([]);
  });

  it('rebuilds its variables when the slot count changes', () => {
    const calc = new CalculatorRuntime(add);
    calc.setDisplayText('value1', '5');
    calc.setDisplayText('value2', '6');
    expect(calc.variables.map((variable) => variable.name)).toEqual([
      'value1',
      'value2',
      'sum',
    ]);
    calc.setConfig({ slots: 3 });
    expect(calc.variables.map((variable) => variable.name)).toEqual([
      'value1',
      'value2',
      'value3',
      'sum',
    ]);
    // Values whose names survive a config change are preserved.
    expect(calc.state['value1']).toBe(5);
    expect(calc.state['value2']).toBe(6);
    calc.setDisplayText('value3', '4');
    expect(calc.state['sum']).toBe(15);
  });
});

describe('Divide', () => {
  it('reports nothing when the divisor is zero', () => {
    const calc = new CalculatorRuntime(divide);
    calc.setDisplayText('value1', '5');
    calc.setDisplayText('value2', '0');
    expect(calc.state['quotient']).toBeNull();
    expect(calc.errors).toEqual([]);
  });
});
