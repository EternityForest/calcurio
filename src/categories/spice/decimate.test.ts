import { describe, expect, it } from 'vitest';
import { chartIndices, envelopeIndices } from './decimate.js';

describe('envelopeIndices', () => {
  it('returns every index when the vector already fits', () => {
    const values = Float64Array.from([1, 2, 3]);
    expect(envelopeIndices(values, 10)).toEqual([0, 1, 2]);
  });

  it('returns nothing for an empty vector', () => {
    expect(envelopeIndices(new Float64Array(0), 10)).toEqual([]);
  });

  it('keeps the endpoints and thins the middle', () => {
    const values = Float64Array.from({ length: 100 }, (_, index) => index);
    const indices = envelopeIndices(values, 10);

    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(99);
    expect(indices.length).toBeLessThan(100);
  });

  it('keeps a narrow spike that plain striding would miss', () => {
    const values = new Float64Array(1000);
    values[500] = 100;
    expect(envelopeIndices(values, 20)).toContain(500);
  });

  it('returns just the endpoints when fewer than two points fit', () => {
    const values = Float64Array.from([1, 2, 3, 4]);
    expect(envelopeIndices(values, 1)).toEqual([0, 3]);
  });
});

describe('chartIndices', () => {
  it('merges the envelopes of every series in ascending order', () => {
    const flat = new Float64Array(100);
    const spiky = new Float64Array(100);
    spiky[50] = 42;

    const indices = chartIndices([flat, spiky], 10);

    expect(indices).toContain(50);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(99);
    expect([...indices].sort((left, right) => left - right)).toEqual(indices);
  });
});
