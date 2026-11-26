import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { isTableSelectVariable } from '../../framework/types.js';
import { eSeriesResistors } from './e-series.js';
import { voltageDivider } from './voltage-divider.js';

const registry = new TableRegistry([eSeriesResistors]);

describe('Voltage divider', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(voltageDivider, { tables: registry }),
    ).not.toThrow();
  });

  it('derives the output and ratio from a selected pair', () => {
    const calc = new CalculatorRuntime(voltageDivider, registry);
    calc.setSelection('r1Select', '1k');
    calc.setSelection('r2Select', '2.2k');
    calc.setDisplayText('vin', '12');
    expect(calc.state['r1']).toBeCloseTo(1000, 9);
    expect(calc.state['r2']).toBeCloseTo(2200, 9);
    expect(calc.state['vout']).toBeCloseTo(8.25, 9);
    expect(calc.state['ratio']).toBeCloseTo(0.6875, 9);
    expect(calc.errors).toEqual([]);
  });

  it('accepts typed resistances with no table match', () => {
    const calc = new CalculatorRuntime(voltageDivider, registry);
    calc.setDisplayText('r1', '1234');
    calc.setDisplayText('r2', '5678');
    calc.setDisplayText('vin', '5');
    expect(calc.state['r1Select']).toBeNull();
    expect(calc.state['r2Select']).toBeNull();
    expect(calc.state['vout']).toBeCloseTo((5 * 5678) / (1234 + 5678), 9);
    expect(calc.state['ratio']).toBeCloseTo(5678 / (1234 + 5678), 9);
  });

  it('keeps the divider ratio read-only', () => {
    const ratio = voltageDivider.variables.find(
      (variable) => variable.name === 'ratio',
    );
    if (ratio === undefined || isTableSelectVariable(ratio)) {
      throw new Error('The divider ratio must be a numeric variable.');
    }
    expect(ratio.editable).toBe(false);
    expect(ratio.computable).toBeDefined();
  });
});
