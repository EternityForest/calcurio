import { describe, expect, it } from 'vitest';
import { isMissing, missing } from './missing.js';

describe('missing', () => {
  it('carries the names of unavailable variables', () => {
    const value = missing(['current', 'resistance']);
    expect(value.needs).toEqual(['current', 'resistance']);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.needs)).toBe(true);
  });

  it('copies the needs array', () => {
    const needs = ['current'];
    const value = missing(needs);
    needs.push('resistance');
    expect(value.needs).toEqual(['current']);
  });
});

describe('isMissing', () => {
  it('recognizes the sentinel', () => {
    expect(isMissing(missing([]))).toBe(true);
    expect(isMissing(missing(['current']))).toBe(true);
  });

  it('rejects unrelated values', () => {
    expect(isMissing(null)).toBe(false);
    expect(isMissing(undefined)).toBe(false);
    expect(isMissing(0)).toBe(false);
    expect(isMissing('missing')).toBe(false);
    expect(isMissing({})).toBe(false);
    expect(isMissing({ needs: [] })).toBe(false);
  });
});
