import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { expression } from './expression.js';

describe('Expression', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(expression)).not.toThrow();
  });

  it('starts x at zero and evaluates in x', () => {
    const calc = new CalculatorRuntime(expression);
    expect(calc.state['x']).toBe(0);
    calc.setDisplayText('expression', 'x * 2 + 1');
    expect(calc.state['y']).toBe(1);
    calc.setDisplayText('x', '5');
    expect(calc.state['y']).toBe(11);
    expect(calc.errors).toEqual([]);
  });

  it('adds extra inputs a, b, c from the config', () => {
    const calc = new CalculatorRuntime(expression, undefined, { extras: 3 });
    expect(calc.variables.map((variable) => variable.name)).toEqual([
      'expression',
      'x',
      'a',
      'b',
      'c',
      'y',
    ]);
    calc.setDisplayText('expression', 'a + b * c + x');
    calc.setDisplayText('a', '1');
    calc.setDisplayText('b', '2');
    calc.setDisplayText('c', '3');
    calc.setDisplayText('x', '4');
    expect(calc.state['y']).toBe(11);
  });

  it('reports an unknown variable and clears the result', () => {
    const calc = new CalculatorRuntime(expression);
    calc.setDisplayText('expression', 'q + 1');
    expect(calc.state['y']).toBeNull();
    expect(calc.issuesFor('expression')[0]?.message).toContain(
      'Unknown variable "q"',
    );
  });

  it('reports a syntax error', () => {
    const calc = new CalculatorRuntime(expression);
    calc.setDisplayText('expression', '2 +');
    expect(calc.state['y']).toBeNull();
    expect(calc.issuesFor('expression')[0]?.message).toBeTruthy();
  });

  it('keeps surviving values when the extra count changes', () => {
    const calc = new CalculatorRuntime(expression, undefined, { extras: 2 });
    calc.setDisplayText('a', '7');
    calc.setConfig({ extras: 3 });
    expect(calc.state['a']).toBe(7);
    expect(calc.variables.map((variable) => variable.name)).toEqual([
      'expression',
      'x',
      'a',
      'b',
      'c',
      'y',
    ]);
  });
});
