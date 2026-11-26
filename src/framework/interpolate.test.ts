import { describe, expect, it } from 'vitest';
import { interpolateAt, parseLookupCell } from './interpolate.js';

describe('parseLookupCell', () => {
  it('parses value-at-axis pairs separated by semicolons or commas', () => {
    expect(parseLookupCell('100@25; 39@844')).toEqual([
      { x: 25, y: 100 },
      { x: 844, y: 39 },
    ]);
    expect(parseLookupCell('100@25, 39@844')).toEqual([
      { x: 25, y: 100 },
      { x: 844, y: 39 },
    ]);
  });

  it('sorts the points by axis value', () => {
    expect(parseLookupCell('39@844; 100@25')).toEqual([
      { x: 25, y: 100 },
      { x: 844, y: 39 },
    ]);
  });

  it('rejects malformed cells', () => {
    expect(parseLookupCell('')).toBeNull();
    expect(parseLookupCell('100')).toBeNull();
    expect(parseLookupCell('100@')).toBeNull();
    expect(parseLookupCell('@25')).toBeNull();
    expect(parseLookupCell('100@25; 200@25')).toBeNull();
  });
});

describe('interpolateAt', () => {
  it('reproduces a straight line', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
    ];
    expect(interpolateAt(points, 5)).toBeCloseTo(10, 12);
    expect(interpolateAt(points, 0)).toBeCloseTo(0, 12);
    expect(interpolateAt(points, 10)).toBeCloseTo(20, 12);
  });

  it('extends the nearest segment outside the sampled range', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
    ];
    expect(interpolateAt(points, -5)).toBeCloseTo(-10, 12);
    expect(interpolateAt(points, 15)).toBeCloseTo(30, 12);
  });

  it('does not overshoot a monotone peak', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 0 },
    ];
    for (const x of [2, 5, 8, 12, 15, 18]) {
      const value = interpolateAt(points, x);
      expect(value).not.toBeNull();
      expect(value!).toBeGreaterThanOrEqual(-1e-12);
      expect(value!).toBeLessThanOrEqual(20 + 1e-12);
    }
  });

  it('returns a single sample unchanged', () => {
    expect(interpolateAt([{ x: 25, y: 100 }], 999)).toBe(100);
  });
});
