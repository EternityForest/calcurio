import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { highPassRlc } from './high-pass-rlc.js';
import { lowPassRlc } from './low-pass-rlc.js';

describe('Low-pass RLC filter', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(lowPassRlc)).not.toThrow();
  });

  it('reduces to an RC filter when the inductance is zero', () => {
    const calc = new CalculatorRuntime(lowPassRlc);
    calc.setDisplayText('resistance', '1000');
    calc.setDisplayText('inductance', '0');
    calc.setDisplayText('capacitance', '1');
    expect(calc.state['timeConstant']).toBeCloseTo(1e-3, 12);
    expect(calc.state['cutoffFrequency']).toBeCloseTo(
      1 / (2 * Math.PI * 1e-3),
      6,
    );
    expect(calc.errors).toEqual([]);
  });

  it('reduces to a lossless LC filter when the resistance is zero', () => {
    const calc = new CalculatorRuntime(lowPassRlc);
    calc.setDisplayText('resistance', '0');
    calc.setDisplayText('inductance', '0.001');
    calc.setDisplayText('capacitance', '1');
    expect(calc.state['timeConstant']).toBeNull();
    const omega0 = 1 / Math.sqrt(1e-3 * 1e-6);
    expect(calc.state['cutoffFrequency']).toBeCloseTo(
      (omega0 * Math.sqrt(1 + Math.SQRT2)) / (2 * Math.PI),
      6,
    );
  });
});

describe('High-pass RLC filter', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(highPassRlc)).not.toThrow();
  });

  it('reduces to an RC filter when the inductance is zero', () => {
    const calc = new CalculatorRuntime(highPassRlc);
    calc.setDisplayText('resistance', '1000');
    calc.setDisplayText('inductance', '0');
    calc.setDisplayText('capacitance', '1');
    expect(calc.state['timeConstant']).toBeCloseTo(1e-3, 12);
    expect(calc.state['cutoffFrequency']).toBeCloseTo(
      1 / (2 * Math.PI * 1e-3),
      6,
    );
    expect(calc.errors).toEqual([]);
  });

  it('reduces to a lossless LC filter when the resistance is zero', () => {
    const calc = new CalculatorRuntime(highPassRlc);
    calc.setDisplayText('resistance', '0');
    calc.setDisplayText('inductance', '0.001');
    calc.setDisplayText('capacitance', '1');
    expect(calc.state['timeConstant']).toBeNull();
    const omega0 = 1 / Math.sqrt(1e-3 * 1e-6);
    expect(calc.state['cutoffFrequency']).toBeCloseTo(
      (omega0 * Math.sqrt(Math.SQRT2 - 1)) / (2 * Math.PI),
      6,
    );
  });
});
