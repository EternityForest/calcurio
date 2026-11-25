import { describe, expect, it } from 'vitest';
import { TableRegistry, requireNumber } from '../../framework/tables.js';
import { eSeriesCapacitors, eSeriesResistors } from './e-series.js';

const registry = new TableRegistry([eSeriesResistors, eSeriesCapacitors]);

function rows(tableId: string) {
  return registry.requireTable(tableId).rows;
}

function labelFor(tableId: string, key: string): string | undefined {
  const row = rows(tableId).find((candidate) => candidate['id'] === key);
  if (row === undefined) {
    return undefined;
  }
  const label = row['label'];
  return typeof label === 'string' ? label : undefined;
}

describe('E-series tables', () => {
  it('builds without duplicate or invalid rows', () => {
    expect(() => registry.requireTable('e-series-resistors')).not.toThrow();
    expect(() => registry.requireTable('e-series-capacitors')).not.toThrow();
  });

  it('spans 1 mΩ to 100 MΩ for resistors', () => {
    const values = rows('e-series-resistors').map((row) =>
      requireNumber(row, 'value'),
    );
    expect(Math.min(...values)).toBeCloseTo(1e-3, 12);
    expect(Math.max(...values)).toBeCloseTo(1e8, 6);
  });

  it('spans 1 pF to 1 mF for capacitors', () => {
    const values = rows('e-series-capacitors').map((row) =>
      requireNumber(row, 'value'),
    );
    expect(Math.min(...values)).toBeCloseTo(1e-12, 18);
    expect(Math.max(...values)).toBeCloseTo(1e-3, 12);
  });

  it('names the smallest series a value belongs to', () => {
    expect(labelFor('e-series-resistors', '1k')).toBe('1k(E3)');
    expect(labelFor('e-series-resistors', '1.5k')).toBe('1.5k(E6)');
    expect(labelFor('e-series-resistors', '1.2k')).toBe('1.2k(E12)');
    expect(labelFor('e-series-resistors', '1.1k')).toBe('1.1k(E24)');
    expect(labelFor('e-series-resistors', '5.1k')).toBe('5.1k(E24)');
    expect(labelFor('e-series-capacitors', '1p')).toBe('1p(E3)');
  });
});
