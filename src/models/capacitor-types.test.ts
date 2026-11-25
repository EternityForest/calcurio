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
    expect(model.saturated).toBeGreaterThanOrEqual(0.05 * 1e-6);
    expect(model.saturated).toBeLessThanOrEqual(0.9 * 1e-6);
    expect(capacitanceAtVoltage(model, 1e6)).toBeCloseTo(model.saturated, 9);
  });

  it('matches the 10 µF / 10 V X5R package anchors', () => {
    const anchors = [
      { id: 'x5r-0402', at2: 6.288e-6, at10: 1.047e-6 },
      { id: 'x5r-0603', at2: 7.42e-6, at10: 1.22e-6 },
      { id: 'x5r-0805', at2: 8.63e-6, at10: 3.27e-6 },
    ];
    for (const { id, at2, at10 } of anchors) {
      const model = resolveCapacitor(findCapacitorType(id)!, 10e-6, 10);
      expect(capacitanceAtVoltage(model, 2)).toBeCloseTo(at2, 6);
      expect(capacitanceAtVoltage(model, 10)).toBeCloseTo(at10, 6);
    }
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

  it('clamps the saturation ratio into 0.05 … 0.90', () => {
    const lowDensity = resolveCapacitor(
      findCapacitorType('x7r-1206')!,
      1e-12,
      16,
    );
    expect(lowDensity.saturated / 1e-12).toBeCloseTo(0.9, 9);

    const highDensity = resolveCapacitor(
      findCapacitorType('x5r-0402')!,
      100e-6,
      6.3,
    );
    expect(highDensity.saturated / 100e-6).toBeCloseTo(0.05, 9);
  });

  it('rejects unknown types', () => {
    expect(findCapacitorType('nope')).toBeNull();
  });
});
