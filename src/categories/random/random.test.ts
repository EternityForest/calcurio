import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { choice } from './choice.js';
import { randomNumber } from './random-number.js';
import { uuidv7Calculator } from './uuidv7.js';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('UUIDv7', () => {
  it('does not generate a value until Calculate is pressed', () => {
    const calc = new CalculatorRuntime(uuidv7Calculator);
    expect(calc.state['uuid']).toBeNull();
    calc.calculate('uuid');
    const value = calc.state['uuid'];
    expect(typeof value).toBe('string');
    expect(value).toMatch(UUID_V7);
  });

  it('generates a different value each time', () => {
    const calc = new CalculatorRuntime(uuidv7Calculator);
    calc.calculate('uuid');
    const first = calc.state['uuid'];
    calc.calculate('uuid');
    const second = calc.state['uuid'];
    expect(first).not.toBe(second);
  });
});

describe('Random number', () => {
  it('waits for Calculate before producing a result', () => {
    const calc = new CalculatorRuntime(randomNumber);
    expect(calc.state['result']).toBeNull();
    calc.calculate('result');
    expect(typeof calc.state['result']).toBe('number');
  });

  it('respects the inclusive range and step', () => {
    const calc = new CalculatorRuntime(randomNumber);
    calc.setDisplayText('min', '0');
    calc.setDisplayText('max', '10');
    calc.setDisplayText('step', '2');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      calc.calculate('result');
      const value = calc.state['result'];
      expect(typeof value).toBe('number');
      const numeric = value as number;
      expect(numeric).toBeGreaterThanOrEqual(0);
      expect(numeric).toBeLessThanOrEqual(10);
      expect(numeric % 2).toBeCloseTo(0, 12);
    }
  });

  it('rejects a non-positive step', () => {
    const calc = new CalculatorRuntime(randomNumber);
    calc.setDisplayText('step', '0');
    calc.calculate('result');
    expect(calc.state['result']).toBeNull();
    expect(calc.validationIssues.length).toBeGreaterThan(0);
  });
});

describe('Choice', () => {
  it('picks one of the entered strings only after Calculate', () => {
    const calc = new CalculatorRuntime(choice);
    calc.setDisplayText('choice1', 'red');
    calc.setDisplayText('choice2', 'green');
    calc.setDisplayText('choice3', 'blue');
    expect(calc.state['result']).toBeNull();
    calc.calculate('result');
    expect(['red', 'green', 'blue']).toContain(calc.state['result']);
  });

  it('rebuilds its options when the count changes', () => {
    const calc = new CalculatorRuntime(choice);
    calc.setConfig({ count: 2 });
    expect(calc.variables.map((variable) => variable.name)).toEqual([
      'choice1',
      'choice2',
      'result',
    ]);
  });
});
