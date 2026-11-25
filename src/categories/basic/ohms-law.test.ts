import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { ohmsLaw } from './ohms-law.js';

describe("Ohm's Law", () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(ohmsLaw)).not.toThrow();
  });

  it('computes voltage from current and resistance', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('current', '0.12');
    runtime.setDisplayText('resistance', '100');
    expect(runtime.state['voltage']).toBeCloseTo(12, 9);
  });

  it('computes current from voltage and resistance', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12');
    runtime.setDisplayText('resistance', '100');
    expect(runtime.state['current']).toBeCloseTo(0.12, 9);
  });

  it('computes resistance from voltage and current', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12');
    runtime.setDisplayText('current', '0.12');
    expect(runtime.state['resistance']).toBeCloseTo(100, 9);
  });

  it('reports a validation message when resistance is zero', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12');
    runtime.setDisplayText('resistance', '0');
    expect(runtime.isMissing('current')).toBe(true);
    expect(
      runtime.issuesFor('current').map((issue) => issue.message),
    ).toContain('Resistance must be non-zero to calculate current.');
  });

  it('reports a validation message when current is zero', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12');
    runtime.setDisplayText('current', '0');
    expect(runtime.isMissing('resistance')).toBe(true);
    expect(
      runtime.issuesFor('resistance').map((issue) => issue.message),
    ).toContain('Current must be non-zero to calculate resistance.');
  });
});
