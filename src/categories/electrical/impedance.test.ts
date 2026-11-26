import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { capacitorImpedance } from './capacitor-impedance.js';
import { inductorImpedance } from './inductor-impedance.js';

describe('Inductor impedance', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(inductorImpedance)).not.toThrow();
  });

  it('solves the third value from the other two', () => {
    const calc = new CalculatorRuntime(inductorImpedance);
    calc.setDisplayText('frequency', '1000');
    calc.setDisplayText('impedance', String(2 * Math.PI * 1000 * 0.001));
    expect(calc.state['inductance']).toBeCloseTo(0.001, 12);
    expect(calc.errors).toEqual([]);
  });

  it('computes impedance from frequency and inductance', () => {
    const calc = new CalculatorRuntime(inductorImpedance);
    calc.setDisplayText('frequency', '1000');
    calc.setDisplayText('inductance', '0.001');
    expect(calc.state['impedance']).toBeCloseTo(2 * Math.PI, 9);
  });
});

describe('Capacitor impedance', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(capacitorImpedance)).not.toThrow();
  });

  it('solves the third value from the other two', () => {
    const calc = new CalculatorRuntime(capacitorImpedance);
    calc.setDisplayText('frequency', '1000');
    calc.setDisplayText('impedance', String(1 / (2 * Math.PI * 1000 * 1e-6)));
    expect(calc.state['capacitance']).toBeCloseTo(1e-6, 12);
    expect(calc.errors).toEqual([]);
  });

  it('computes impedance from frequency and capacitance', () => {
    const calc = new CalculatorRuntime(capacitorImpedance);
    calc.setDisplayText('frequency', '1000');
    calc.setDisplayText('capacitance', '1');
    expect(calc.state['capacitance']).toBeCloseTo(1e-6, 12);
    expect(calc.state['impedance']).toBeCloseTo(
      1 / (2 * Math.PI * 1000 * 1e-6),
      6,
    );
  });
});
