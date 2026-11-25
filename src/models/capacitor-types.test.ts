import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../framework/tables.js';
import {
  capacitanceAtVoltage,
  capacitorTypesTable,
  findCapacitorType,
  resolveCapacitor,
} from './capacitor-types.js';

describe('capacitor types table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(capacitorTypesTable)).not.toThrow();
  });

  it('models aluminium polymer as linear with no volume', () => {
    const type = findCapacitorType('alu-polymer')!;
    expect(type.volume).toBeNull();
    const model = resolveCapacitor(type, 100e-6, 16);
    expect(model.nonlinear).toBe(false);
    expect(capacitanceAtVoltage(model, 16)).toBe(100e-6);
  });
});

describe('resolveCapacitor', () => {
  it('keeps the rated capacitance at zero bias', () => {
    const model = resolveCapacitor(findCapacitorType('x7r-0805')!, 1e-6, 50);
    expect(model.nonlinear).toBe(true);
    expect(capacitanceAtVoltage(model, 0)).toBeCloseTo(1e-6, 12);
  });

  it('drops towards the saturated capacitance at high bias', () => {
    const model = resolveCapacitor(findCapacitorType('x7r-0805')!, 1e-6, 50);
    expect(model.saturated).toBeGreaterThanOrEqual(0.1 * 1e-6);
    expect(model.saturated).toBeLessThanOrEqual(0.45 * 1e-6);
    expect(capacitanceAtVoltage(model, 1e6)).toBeCloseTo(model.saturated, 9);
  });

  it('reaches the midpoint at the knee voltage', () => {
    const model = resolveCapacitor(findCapacitorType('x7r-0805')!, 1e-6, 50);
    const midpoint = (1e-6 + model.saturated) / 2;
    expect(capacitanceAtVoltage(model, model.kneeVoltage)).toBeCloseTo(
      midpoint,
      12,
    );
  });

  it('clamps the knee voltage to 1.5× the rating', () => {
    const model = resolveCapacitor(findCapacitorType('x7r-1206')!, 1e-12, 16);
    expect(model.kneeVoltage).toBeCloseTo(1.5 * 16, 9);
  });

  it('clamps the saturation ratio into 0.10 … 0.45', () => {
    const lowDensity = resolveCapacitor(
      findCapacitorType('x7r-1206')!,
      1e-12,
      16,
    );
    expect(lowDensity.saturated / 1e-12).toBeCloseTo(0.45, 9);

    const highDensity = resolveCapacitor(
      findCapacitorType('x5r-0402')!,
      100e-6,
      6.3,
    );
    expect(highDensity.saturated / 100e-6).toBeCloseTo(0.1, 9);
  });

  it('rejects unknown types', () => {
    expect(findCapacitorType('nope')).toBeNull();
  });
});
