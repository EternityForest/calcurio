import { describe, expect, it } from 'vitest';
import { computeMetrics, integrate, peakMagnitude } from './metrics.js';
import type { RawFile } from './rawfile.js';

/** A rawfile with the four vectors the inrush metrics read, in module order. */
function inrushResult(): RawFile {
  return {
    names: ['time', 'v(3)', 'i(l1)', 'v(4)'],
    pointCount: 3,
    series: [
      Float64Array.from([0, 1, 2]),
      Float64Array.from([0, 10, 4]),
      Float64Array.from([0, 2, 1]),
      Float64Array.from([0, 1, 3]),
    ],
  };
}

describe('peakMagnitude', () => {
  it('returns the largest absolute sample', () => {
    expect(peakMagnitude(Float64Array.from([0, 3, -7, 2]))).toBe(7);
  });

  it('returns zero for an empty vector', () => {
    expect(peakMagnitude(new Float64Array(0))).toBe(0);
  });
});

describe('integrate', () => {
  it('applies the trapezoidal rule over the time vector', () => {
    const values = Float64Array.from([0, 2, 2, 0]);
    const time = Float64Array.from([0, 1, 2, 3]);
    expect(integrate(values, time)).toBeCloseTo(4, 9);
  });

  it('stops at the shorter of the two vectors', () => {
    const values = Float64Array.from([1, 1, 1]);
    const time = Float64Array.from([0, 1]);
    expect(integrate(values, time)).toBeCloseTo(1, 9);
  });
});

describe('computeMetrics', () => {
  it('reports peaks and the energy burnt in each resistance', () => {
    const metrics = computeMetrics(inrushResult(), {
      seriesResistance: 1,
      dampingResistance: 2,
    });

    expect(metrics.peakCapacitor1Voltage).toBe(10);
    expect(metrics.peakSeriesCurrent).toBe(2);
    // i^2 * R = [0, 4, 1] integrated with dt = 1.
    expect(metrics.energySeriesResistance).toBeCloseTo(4.5, 9);
    // (v3 - v4)^2 / R = [0, 40.5, 0.5] integrated with dt = 1.
    expect(metrics.energyDampingResistance).toBeCloseTo(40.75, 9);
  });

  it('blames the simulation when a vector is missing', () => {
    const data: RawFile = {
      names: ['time', 'v(3)', 'i(l1)'],
      pointCount: 1,
      series: [
        Float64Array.from([0]),
        Float64Array.from([0]),
        Float64Array.from([0]),
      ],
    };

    expect(() =>
      computeMetrics(data, { seriesResistance: 1, dampingResistance: 1 }),
    ).toThrow('v(4)');
  });
});
