import { describe, expect, it } from 'vitest';
import {
  choicesForUnit,
  convertUnit,
  isUnitSymbol,
  measureOf,
  tryDescribeUnit,
  unitsOfKind,
} from './units.js';

describe('convertUnit', () => {
  it('converts between voltage units', () => {
    expect(convertUnit(1000, 'mV', 'V')).toBeCloseTo(1, 12);
    expect(convertUnit(1, 'V', 'mV')).toBeCloseTo(1000, 12);
  });

  it('converts between resistance units', () => {
    expect(convertUnit(1, 'kΩ', 'Ω')).toBeCloseTo(1000, 12);
    expect(convertUnit(1, 'MΩ', 'kΩ')).toBeCloseTo(1000, 12);
    expect(convertUnit(1, 'mΩ', 'Ω')).toBeCloseTo(0.001, 12);
  });

  it('converts between temperature units', () => {
    expect(convertUnit(25, '°C', 'K')).toBeCloseTo(298.15, 12);
    expect(convertUnit(100, '°C', '°F')).toBeCloseTo(212, 12);
    expect(convertUnit(-40, '°C', '°F')).toBeCloseTo(-40, 12);
  });
});

describe('unitsOfKind', () => {
  it('lists voltage units including the base unit', () => {
    const units = unitsOfKind('mV');
    expect(units).toContain('mV');
    expect(units).toContain('V');
    expect(units).toContain('kV');
  });

  it('lists the custom resistance units', () => {
    const units = unitsOfKind('Ω');
    expect(units).toContain('mΩ');
    expect(units).toContain('kΩ');
    expect(units).toContain('MΩ');
  });
});

describe('measureOf', () => {
  it('reports the measurement kind', () => {
    expect(measureOf('mV')).toBe('voltage');
    expect(measureOf('mA')).toBe('current');
    expect(measureOf('Ω')).toBe('resistance');
  });
});

describe('tryDescribeUnit', () => {
  it('describes known units', () => {
    expect(tryDescribeUnit('V')).not.toBeNull();
  });

  it('returns null for unknown units', () => {
    expect(tryDescribeUnit('not-a-unit')).toBeNull();
  });
});

describe('isUnitSymbol', () => {
  it('accepts known units and rejects unknown ones', () => {
    expect(isUnitSymbol('V')).toBe(true);
    expect(isUnitSymbol('not-a-unit')).toBe(false);
  });
});

describe('choicesForUnit', () => {
  it('puts the base unit first', () => {
    const choices = choicesForUnit('mV');
    expect(choices[0]).toBe('mV');
    expect(choices).toContain('V');
  });

  it('uses explicit options when provided', () => {
    expect(choicesForUnit('mV', ['V', 'kV'])).toEqual(['mV', 'V', 'kV']);
  });

  it('removes duplicate options', () => {
    expect(choicesForUnit('mV', ['mV', 'V'])).toEqual(['mV', 'V']);
  });

  it('keeps the base unit even when options omit it', () => {
    expect(choicesForUnit('Ω', ['kΩ', 'MΩ'])).toEqual(['Ω', 'kΩ', 'MΩ']);
  });
});
