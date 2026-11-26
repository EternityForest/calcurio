import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { wireGaugeTable } from './wire-gauge.js';
import { wireMetalsTable } from './wire-metals.js';
import { wireResistance } from './wire-resistance.js';

const registry = new TableRegistry([wireGaugeTable, wireMetalsTable]);

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(wireResistance, registry);
}

/** Reads one numeric cell of a wire-gauge row, for exact comparisons. */
function gaugeValue(key: string, column: string): number {
  const row = wireGaugeTable.rows.find((candidate) => candidate['id'] === key);
  if (row === undefined) {
    throw new Error(`Wire-gauge table has no row "${key}".`);
  }
  const value = row[column];
  if (typeof value !== 'number') {
    throw new Error(`Wire-gauge row "${key}" has no numeric "${column}".`);
  }
  return value;
}

describe('Wire resistance', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(wireResistance, { tables: registry }),
    ).not.toThrow();
  });

  it('computes area and radius from a typed diameter with no table match', () => {
    const calc = runtime();
    calc.setSelection('metal', 'copper');
    calc.setDisplayText('length', '10');
    calc.setDisplayText('diameter', '1');
    expect(calc.state['gauge']).toBeNull();
    expect(calc.state['radius']).toBeCloseTo(0.5, 9);
    expect(calc.state['area']).toBeCloseTo(Math.PI * 0.25, 9);
    expect(calc.state['resistance']).toBeCloseTo(
      (0.0172 * 10) / (Math.PI * 0.25),
      9,
    );
    expect(calc.errors).toEqual([]);
  });

  it('computes diameter and radius from a typed area', () => {
    const calc = runtime();
    calc.setDisplayText('area', '2');
    expect(calc.state['gauge']).toBeNull();
    expect(calc.state['diameter']).toBeCloseTo(2 * Math.sqrt(2 / Math.PI), 9);
    expect(calc.state['radius']).toBeCloseTo(Math.sqrt(2 / Math.PI), 9);
  });

  it('computes area and diameter from a typed radius', () => {
    const calc = runtime();
    calc.setDisplayText('radius', '0.8');
    expect(calc.state['gauge']).toBeNull();
    expect(calc.state['diameter']).toBeCloseTo(1.6, 9);
    expect(calc.state['area']).toBeCloseTo(Math.PI * 0.8 ** 2, 9);
  });

  it('matches a table row when the typed diameter is exact', () => {
    const calc = runtime();
    const diameter = gaugeValue('awg-10', 'diameter');
    calc.setDisplayText('diameter', String(diameter));
    expect(calc.state['gauge']).toBe('awg-10');
    expect(calc.state['area']).toBeCloseTo(gaugeValue('awg-10', 'area'), 9);
    expect(calc.state['radius']).toBeCloseTo(gaugeValue('awg-10', 'radius'), 9);
  });
});
