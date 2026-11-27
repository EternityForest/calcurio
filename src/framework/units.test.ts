import { describe, expect, it } from 'vitest';
import {
  choicesForUnit,
  compositeUnit,
  convertUnit,
  isUnitSymbol,
  measureOf,
  parseCompositeUnit,
  tryDescribeUnit,
  unitsOfKind,
} from './units.js';

describe('convertUnit', () => {
  it('converts between voltage units', () => {
    expect(convertUnit(1000, 'mV', 'V')).toBeCloseTo(1, 12);
    expect(convertUnit(1, 'V', 'mV')).toBeCloseTo(1000, 12);
  });

  it('converts between resistance units', () => {
    expect(convertUnit(1, 'kohm', 'ohm')).toBeCloseTo(1000, 12);
    expect(convertUnit(1, 'Mohm', 'kohm')).toBeCloseTo(1000, 12);
    expect(convertUnit(1, 'mohm', 'ohm')).toBeCloseTo(0.001, 12);
  });

  it('converts between temperature units', () => {
    expect(convertUnit(25, 'degC', 'K')).toBeCloseTo(298.15, 12);
    expect(convertUnit(100, 'degC', 'degF')).toBeCloseTo(212, 12);
    expect(convertUnit(-40, 'degC', 'degF')).toBeCloseTo(-40, 12);
  });

  it('converts between specific energy units', () => {
    expect(convertUnit(1, 'kJ/kg', 'J/kg')).toBeCloseTo(1000, 12);
    expect(convertUnit(1, 'cal/g', 'J/kg')).toBeCloseTo(4184, 12);
    expect(convertUnit(1, 'Btu/lb', 'J/kg')).toBeCloseTo(2326, 12);
  });
});

describe('composite units', () => {
  it('splits a value unit and its axis units', () => {
    expect(parseCompositeUnit('J/(kg K)@degC')).toEqual({
      unit: 'J/(kg K)',
      axes: ['degC'],
    });
    expect(parseCompositeUnit('kg/m^3@degC')).toEqual({
      unit: 'kg/m^3',
      axes: ['degC'],
    });
    expect(parseCompositeUnit('kg/m^3@degC,kPa')).toEqual({
      unit: 'kg/m^3',
      axes: ['degC', 'kPa'],
    });
  });

  it('rejects malformed composite units', () => {
    expect(parseCompositeUnit('kg/m^3')).toBeNull();
    expect(parseCompositeUnit('kg/m^3@')).toBeNull();
    expect(parseCompositeUnit('@degC')).toBeNull();
    expect(parseCompositeUnit('kg/m^3@not-a-unit')).toBeNull();
    expect(parseCompositeUnit('kg/m^3@degC,not-a-unit')).toBeNull();
  });

  it('joins a value unit and one or more axis units', () => {
    expect(compositeUnit('kg/m^3', 'degC')).toBe('kg/m^3@degC');
    expect(compositeUnit('kg/m^3', 'degC', 'kPa')).toBe('kg/m^3@degC,kPa');
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
    const units = unitsOfKind('ohm');
    expect(units).toContain('mohm');
    expect(units).toContain('kohm');
    expect(units).toContain('Mohm');
  });
});

describe('measureOf', () => {
  it('reports the measurement kind', () => {
    expect(measureOf('mV')).toBe('voltage');
    expect(measureOf('mA')).toBe('current');
    expect(measureOf('ohm')).toBe('resistance');
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
    expect(choicesForUnit('ohm', ['kohm', 'Mohm'])).toEqual(['ohm', 'kohm', 'Mohm']);
  });
});
