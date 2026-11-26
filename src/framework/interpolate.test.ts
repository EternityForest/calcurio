import { describe, expect, it } from 'vitest';
import {
  interpolateAt,
  interpolateLookup,
  lookupCellOf,
  parseLookupCell,
} from './interpolate.js';

describe('parseLookupCell', () => {
  it('parses one-dimensional value-at-axis pairs', () => {
    expect(parseLookupCell('100@25; 39@844')).toEqual({
      points: [
        { coords: [25], y: 100 },
        { coords: [844], y: 39 },
      ],
      fallback: null,
    });
  });

  it('accepts a legacy comma-separated list', () => {
    expect(parseLookupCell('100@25, 39@844')).toEqual({
      points: [
        { coords: [25], y: 100 },
        { coords: [844], y: 39 },
      ],
      fallback: null,
    });
  });

  it('parses two-dimensional value-at-coordinates points', () => {
    expect(parseLookupCell('50@59,89; 60@60,90')).toEqual({
      points: [
        { coords: [59, 89], y: 50 },
        { coords: [60, 90], y: 60 },
      ],
      fallback: null,
    });
  });

  it('reads a plain number as the fallback value', () => {
    expect(parseLookupCell('4182')).toEqual({ points: [], fallback: 4182 });
    expect(parseLookupCell('39@844; 100@25; 4182')).toEqual({
      points: [
        { coords: [25], y: 100 },
        { coords: [844], y: 39 },
      ],
      fallback: 4182,
    });
  });

  it('sorts the points by coordinate', () => {
    expect(parseLookupCell('39@844; 100@25')?.points).toEqual([
      { coords: [25], y: 100 },
      { coords: [844], y: 39 },
    ]);
  });

  it('rejects malformed cells', () => {
    expect(parseLookupCell('')).toBeNull();
    expect(parseLookupCell('100@')).toBeNull();
    expect(parseLookupCell('@25')).toBeNull();
    expect(parseLookupCell('100@25; 200@25')).toBeNull();
    expect(parseLookupCell('100@25; 100@25')).toBeNull();
    expect(parseLookupCell('a@25')).toBeNull();
  });
});

describe('lookupCellOf', () => {
  it('upgrades a finite number to a fallback-only cell', () => {
    expect(lookupCellOf(998.2)).toEqual({ points: [], fallback: 998.2 });
  });

  it('parses a string cell', () => {
    expect(lookupCellOf('100@25')).toEqual({
      points: [{ coords: [25], y: 100 }],
      fallback: null,
    });
  });

  it('returns null for other values', () => {
    expect(lookupCellOf(Number.NaN)).toBeNull();
    expect(lookupCellOf(null)).toBeNull();
    expect(lookupCellOf(true)).toBeNull();
  });
});

describe('interpolateAt', () => {
  it('reproduces a straight line', () => {
    const points = [
      { coords: [0], y: 0 },
      { coords: [10], y: 20 },
    ];
    expect(interpolateAt(points, 5)).toBeCloseTo(10, 12);
    expect(interpolateAt(points, 0)).toBeCloseTo(0, 12);
    expect(interpolateAt(points, 10)).toBeCloseTo(20, 12);
  });

  it('extends the nearest segment outside the sampled range', () => {
    const points = [
      { coords: [0], y: 0 },
      { coords: [10], y: 20 },
    ];
    expect(interpolateAt(points, -5)).toBeCloseTo(-10, 12);
    expect(interpolateAt(points, 15)).toBeCloseTo(30, 12);
  });

  it('does not overshoot a monotone peak', () => {
    const points = [
      { coords: [0], y: 0 },
      { coords: [10], y: 20 },
      { coords: [20], y: 0 },
    ];
    for (const x of [2, 5, 8, 12, 15, 18]) {
      const value = interpolateAt(points, x);
      expect(value).not.toBeNull();
      expect(value!).toBeGreaterThanOrEqual(-1e-12);
      expect(value!).toBeLessThanOrEqual(20 + 1e-12);
    }
  });

  it('returns a single sample unchanged', () => {
    expect(interpolateAt([{ coords: [25], y: 100 }], 999)).toBe(100);
  });

  it('reads only the first coordinate of a two-dimensional point set', () => {
    const points = [
      { coords: [0, 0], y: 0 },
      { coords: [10, 0], y: 20 },
    ];
    expect(interpolateAt(points, 5)).toBeCloseTo(10, 12);
  });
});

describe('interpolateLookup', () => {
  it('returns the fallback for a cell with no samples', () => {
    expect(interpolateLookup({ points: [], fallback: 998.2 }, [], [])).toBe(
      998.2,
    );
  });

  it('returns null for a fallback-only cell without a fallback', () => {
    expect(
      interpolateLookup({ points: [], fallback: null }, [], []),
    ).toBeNull();
  });

  it('interpolates one-dimensional samples', () => {
    const cell = parseLookupCell('100@25; 200@75');
    expect(cell).not.toBeNull();
    expect(interpolateLookup(cell!, [50], [null])).toBeCloseTo(150, 12);
  });

  it('fills a missing coordinate from the standard', () => {
    const cell = parseLookupCell('100@25; 200@75');
    expect(interpolateLookup(cell!, [null], [50])).toBeCloseTo(150, 12);
  });

  it('interpolates a two-dimensional grid bilinearly', () => {
    const cell = parseLookupCell('10@0,0; 20@10,0; 30@0,10; 40@10,10');
    expect(cell).not.toBeNull();
    expect(interpolateLookup(cell!, [5, 5], [null, null])).toBeCloseTo(25, 12);
    expect(interpolateLookup(cell!, [5, 0], [null, null])).toBeCloseTo(15, 12);
    expect(interpolateLookup(cell!, [0, 5], [null, null])).toBeCloseTo(20, 12);
    expect(interpolateLookup(cell!, [10, 5], [null, null])).toBeCloseTo(30, 12);
  });

  it('assumes the standard for a coordinate a sample omits', () => {
    // A one-coordinate sample in a two-axis column sits at axis2 = standard.
    const cell = parseLookupCell('100@25; 200@75');
    expect(cell).not.toBeNull();
    const value = interpolateLookup(cell!, [50, 101.325], [null, 101.325]);
    expect(value).toBeCloseTo(150, 12);
  });

  it('extends a two-dimensional grid outside the sampled range', () => {
    const cell = parseLookupCell('10@0,0; 20@10,0; 30@0,10; 40@10,10');
    expect(cell).not.toBeNull();
    // One unit past the far corner continues the last cell's gradient.
    expect(interpolateLookup(cell!, [15, 10], [null, null])).toBeCloseTo(
      45,
      12,
    );
  });

  it('falls back when a coordinate cannot be resolved', () => {
    const cell = parseLookupCell('100@25; 200@75; 7');
    expect(cell).not.toBeNull();
    expect(interpolateLookup(cell!, [null], [null])).toBe(7);
  });
});
