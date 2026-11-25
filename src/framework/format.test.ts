import { describe, expect, it } from 'vitest';
import { NumberFormatError } from './errors.js';
import { formatNumber, parseNumberText } from './format.js';

describe('formatNumber', () => {
  it('formats zero without a sign', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
  });

  it('rounds to twelve significant digits', () => {
    expect(formatNumber(1.2345678901234)).toBe('1.23456789012');
  });

  it('uses scientific notation for very large values', () => {
    expect(formatNumber(1e12)).toBe('1e+12');
    expect(formatNumber(1234567890123)).toBe('1.23456789012e+12');
  });

  it('uses scientific notation for very small values', () => {
    expect(formatNumber(1e-7)).toBe('1e-7');
  });

  it('keeps the boundary value in plain notation', () => {
    expect(formatNumber(1e-6)).toBe('0.000001');
  });

  it('rejects non-finite values', () => {
    expect(() => formatNumber(Number.NaN)).toThrow(RangeError);
    expect(() => formatNumber(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('parseNumberText', () => {
  it('treats blank text as no value', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('   ')).toBeNull();
  });

  it('accepts grouped and signed numbers', () => {
    expect(parseNumberText('1,234.5')).toBe(1234.5);
    expect(parseNumberText('+5')).toBe(5);
    expect(parseNumberText('-5')).toBe(-5);
  });

  it('accepts decimals without a leading or trailing digit', () => {
    expect(parseNumberText('.5')).toBe(0.5);
    expect(parseNumberText('5.')).toBe(5);
  });

  it('accepts scientific notation', () => {
    expect(parseNumberText('1e3')).toBe(1000);
    expect(parseNumberText('1e+3')).toBe(1000);
    expect(parseNumberText('1e-3')).toBe(0.001);
  });

  it('rejects malformed text', () => {
    for (const text of ['abc', '1e', '1.2.3', 'Infinity', 'NaN', '0x10']) {
      expect(() => parseNumberText(text)).toThrow(NumberFormatError);
    }
  });

  it('rejects values outside the finite range', () => {
    expect(() => parseNumberText('1e999')).toThrow(NumberFormatError);
  });
});
