import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { materialsTable } from '../../models/materials.js';
import { energyAndTemperatureChange } from './energy-and-temperature-change.js';
import { phaseChangeHeat } from './phase-change-heat.js';
import { volumeVsWeight } from './volume-vs-weight.js';

const registry = new TableRegistry([materialsTable]);

function number(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error(`Expected a number, got ${String(value)}.`);
  }
  return value;
}

describe('Energy and temperature change', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(energyAndTemperatureChange, { tables: registry }),
    ).not.toThrow();
  });

  it('integrates specific heat across a phase change', () => {
    const calc = new CalculatorRuntime(energyAndTemperatureChange, registry);
    calc.setSelection('material', 'water');
    calc.setDisplayText('mass', '1');
    calc.setDisplayText('startTemperature', '-10');
    calc.setDisplayText('endTemperature', '10');
    expect(number(calc.state['energy'])).toBeCloseTo(62820, 6);
    expect(number(calc.state['averageSpecificHeat'])).toBeCloseTo(3141, 6);
    expect(calc.errors).toEqual([]);
  });

  it('computes a constant-specific-heat material', () => {
    const calc = new CalculatorRuntime(energyAndTemperatureChange, registry);
    calc.setSelection('material', 'aluminum');
    calc.setDisplayText('mass', '2');
    calc.setDisplayText('startTemperature', '20');
    calc.setDisplayText('endTemperature', '120');
    expect(number(calc.state['energy'])).toBeCloseTo(180000, 6);
    expect(number(calc.state['averageSpecificHeat'])).toBeCloseTo(900, 6);
  });
});

describe('Phase change heat', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(phaseChangeHeat, { tables: registry }),
    ).not.toThrow();
  });

  it('adds latent heat when melting is crossed', () => {
    const calc = new CalculatorRuntime(phaseChangeHeat, registry);
    calc.setSelection('material', 'water');
    calc.setDisplayText('mass', '1');
    calc.setDisplayText('startTemperature', '-10');
    calc.setDisplayText('endTemperature', '10');
    expect(number(calc.state['sensibleHeat'])).toBeCloseTo(62820, 6);
    expect(number(calc.state['latentHeat'])).toBeCloseTo(334000, 6);
    expect(number(calc.state['totalHeat'])).toBeCloseTo(396820, 6);
    expect(calc.errors).toEqual([]);
  });

  it('adds latent heat when boiling is crossed', () => {
    const calc = new CalculatorRuntime(phaseChangeHeat, registry);
    calc.setSelection('material', 'water');
    calc.setDisplayText('mass', '1');
    calc.setDisplayText('startTemperature', '20');
    calc.setDisplayText('endTemperature', '120');
    expect(number(calc.state['latentHeat'])).toBeCloseTo(2256000, 6);
    expect(number(calc.state['totalHeat'])).toBeCloseTo(2630560, 6);
  });
});

describe('Volume vs weight', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(volumeVsWeight, { tables: registry }),
    ).not.toThrow();
  });

  it('brings in density when a material is chosen', () => {
    const calc = new CalculatorRuntime(volumeVsWeight, registry);
    calc.setSelection('material', 'water');
    expect(number(calc.state['density'])).toBeCloseTo(998.2, 9);
    expect(calc.errors).toEqual([]);
  });

  it('computes weight from volume and density', () => {
    const calc = new CalculatorRuntime(volumeVsWeight, registry);
    calc.setSelection('material', 'aluminum');
    calc.setDisplayUnit('volume', 'm^3');
    calc.setDisplayText('volume', '0.001');
    expect(number(calc.state['weight'])).toBeCloseTo(2.7, 9);
  });

  it('computes volume from weight and density', () => {
    const calc = new CalculatorRuntime(volumeVsWeight, registry);
    calc.setSelection('material', 'propylene-glycol-50');
    calc.setDisplayText('weight', '20.782');
    expect(number(calc.state['volume'])).toBeCloseTo(0.02, 9);
  });
});
