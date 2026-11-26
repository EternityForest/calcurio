import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { materialsTable } from '../../models/materials.js';
import { pipePressureDrop } from './pipe-pressure-drop.js';

const registry = new TableRegistry([materialsTable]);

function number(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error(`Expected a number, got ${String(value)}.`);
  }
  return value;
}

describe('Pipe pressure drop', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(pipePressureDrop, { tables: registry }),
    ).not.toThrow();
  });

  it('hides materials that have no viscosity', () => {
    const calc = new CalculatorRuntime(pipePressureDrop, registry);
    const keys = calc.tableChoices('fluid').map((choice) => choice.key);
    expect(keys).toContain('water');
    expect(keys).not.toContain('aluminum');
  });

  it('brings in density and viscosity when a fluid is chosen', () => {
    const calc = new CalculatorRuntime(pipePressureDrop, registry);
    calc.setSelection('fluid', 'propylene-glycol-50');
    expect(calc.state['density']).toBeCloseTo(1039.1, 9);
    expect(calc.state['viscosity']).toBeCloseTo(0.0046, 9);
    expect(calc.errors).toEqual([]);
  });

  it('computes the loss from the fluid data and the flow rate', () => {
    const calc = new CalculatorRuntime(pipePressureDrop, registry);
    calc.setSelection('fluid', 'water');
    calc.setDisplayText('diameter', '50');
    calc.setDisplayText('length', '100');
    calc.setDisplayText('roughness', '0.045');
    calc.setDisplayUnit('flowRate', 'm3/s');
    calc.setDisplayText('flowRate', '0.003926990816987242');
    expect(number(calc.state['velocity'])).toBeCloseTo(2, 9);
    expect(number(calc.state['reynoldsNumber'])).toBeCloseTo(
      99620.75848303393,
      6,
    );
    expect(number(calc.state['frictionFactor'])).toBeCloseTo(
      0.021840547173396615,
      9,
    );
    expect(number(calc.state['pressureDrop'])).toBeCloseTo(87204.936753938, 6);
    expect(calc.errors).toEqual([]);
  });

  it('uses f = 64/Re for laminar flow', () => {
    const calc = new CalculatorRuntime(pipePressureDrop, registry);
    calc.setSelection('fluid', 'propylene-glycol-50');
    calc.setDisplayText('diameter', '25');
    calc.setDisplayText('length', '10');
    calc.setDisplayText('roughness', '0.0015');
    calc.setDisplayUnit('flowRate', 'm3/s');
    calc.setDisplayText('flowRate', '0.00005');
    const reynolds = number(calc.state['reynoldsNumber']);
    expect(reynolds).toBeLessThan(2300);
    expect(number(calc.state['frictionFactor'])).toBeCloseTo(64 / reynolds, 12);
  });

  it('reports a non-positive diameter', () => {
    const calc = new CalculatorRuntime(pipePressureDrop, registry);
    calc.setSelection('fluid', 'water');
    calc.setDisplayText('diameter', '0');
    calc.setDisplayText('length', '10');
    calc.setDisplayText('flowRate', '0.001');
    expect(calc.state['pressureDrop']).toBeNull();
    expect(calc.issuesFor('diameter')[0]?.message).toContain(
      'greater than zero',
    );
  });
});
