import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../framework/tables.js';
import {
  findInductorType,
  inductanceAtCurrent,
  inductorTypeFrom,
  inductorTypesTable,
  resolveInductor,
  temperatureFactor,
} from './inductor-types.js';

describe('inductor types table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(inductorTypesTable)).not.toThrow();
  });

  it('finds rows by key', () => {
    expect(findInductorType('ferrite-drum')?.label).toBe(
      'Ferrite drum (shielded)',
    );
    expect(findInductorType('nope')).toBeNull();
  });

  it('reads the air row as a linear material', () => {
    const air = findInductorType('air');
    expect(air).not.toBeNull();
    const model = resolveInductor(air!, 10e-6, 5, 25);
    expect(model.linear).toBe(true);
    expect(inductanceAtCurrent(model, 1e6)).toBe(10e-6);
  });
});

describe('temperatureFactor', () => {
  const type = findInductorType('iron-powder')!;

  it('is one at 25 °C and the derating at 100 °C', () => {
    expect(temperatureFactor(type, 25)).toBeCloseTo(1, 12);
    expect(temperatureFactor(type, 100)).toBeCloseTo(0.85, 12);
  });

  it('interpolates linearly in between', () => {
    expect(temperatureFactor(type, 62.5)).toBeCloseTo(0.925, 12);
  });
});

describe('resolveInductor', () => {
  const type = findInductorType('ferrite-drum')!;

  it('loses exactly ΔL of the rated inductance at the rated current', () => {
    const model = resolveInductor(type, 100e-6, 5, 25);
    expect(model.linear).toBe(false);
    expect(inductanceAtCurrent(model, 5) / 100e-6).toBeCloseTo(0.9, 10);
  });

  it('settles to the residual inductance at high current', () => {
    const model = resolveInductor(type, 100e-6, 5, 25);
    expect(model.infinity).toBeCloseTo(5e-6, 12);
    expect(inductanceAtCurrent(model, 1e9)).toBeCloseTo(5e-6, 7);
  });

  it('keeps the rated inductance at zero current', () => {
    const model = resolveInductor(type, 100e-6, 5, 25);
    expect(inductanceAtCurrent(model, 0)).toBeCloseTo(100e-6, 12);
  });

  it('derates the saturation current when hot', () => {
    const cold = resolveInductor(type, 100e-6, 5, 25);
    const hot = resolveInductor(type, 100e-6, 5, 100);
    expect(hot.deratedCurrent).toBeCloseTo(4.5, 12);
    expect(hot.kneeCurrent).toBeLessThan(cold.kneeCurrent);
    // The same bias current now bites harder.
    expect(inductanceAtCurrent(hot, 5)).toBeLessThan(
      inductanceAtCurrent(cold, 5),
    );
  });

  it('rejects a drop the residual cannot reach', () => {
    const bad = inductorTypeFrom({
      id: 'bad',
      label: 'Bad',
      drop: 0.5,
      knee: 2,
      residual: 0.6,
      tempDerating: 1,
    });
    expect(() => resolveInductor(bad, 1e-6, 1, 25)).toThrow(/cannot reach/);
  });
});
