import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { friis } from './friis.js';

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(friis);
}

describe('Friis path loss', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(friis)).not.toThrow();
  });

  it('computes wavelength and path loss from frequency and distance', () => {
    const calc = runtime();
    calc.setDisplayText('frequency', '2400');
    calc.setDisplayText('distance', '100');
    calc.setDisplayText('transmitPower', '1');
    expect(calc.state['wavelength']).toBeCloseTo(0.12491352416666666, 12);
    expect(calc.state['pathLoss']).toBeCloseTo(80.0520080561155, 9);
    expect(calc.errors).toEqual([]);
  });

  it('does not change the loss when power or antenna gains change', () => {
    const calc = runtime();
    calc.setDisplayText('frequency', '915');
    calc.setDisplayText('distance', '1000');
    const baseline = calc.state['pathLoss'] as number;

    calc.setDisplayText('transmitPower', '0.1');
    calc.setDisplayText('transmitGain', '2');
    calc.setDisplayText('receiveGain', '6');
    expect(calc.state['pathLoss']).toBe(baseline);
  });

  it('reports a non-positive frequency and clears the derived values', () => {
    const calc = runtime();
    calc.setDisplayText('frequency', '0');
    calc.setDisplayText('distance', '100');
    calc.setDisplayText('transmitPower', '1');
    expect(calc.state['wavelength']).toBeNull();
    expect(calc.validationIssues.length).toBeGreaterThan(0);
  });
});
