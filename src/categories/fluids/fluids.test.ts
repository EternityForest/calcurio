import { describe, expect, it } from 'vitest';
import { findRow, requireNumber, validateTableDefinition } from '../../framework/tables.js';
import type { TableRow } from '../../framework/types.js';
import { dippr101 } from './dippr-101.js';
import type { Dippr101Coefficients } from './dippr-101.js';
import { fluidsTable } from './fluids.js';

function coefficients(row: TableRow, prefix: string): Dippr101Coefficients {
  return {
    a: requireNumber(row, `${prefix}A`),
    b: requireNumber(row, `${prefix}B`),
    c: requireNumber(row, `${prefix}C`),
    d: requireNumber(row, `${prefix}D`),
    e: requireNumber(row, `${prefix}E`),
  };
}

function fluid(id: string): TableRow {
  const row = findRow(fluidsTable, id);
  if (row === undefined) {
    throw new Error(`No fluid "${id}".`);
  }
  return row;
}

describe('fluids table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(fluidsTable)).not.toThrow();
  });

  it('lists the core working fluids', () => {
    const ids = fluidsTable.rows.map((row) => row['id']);
    for (const expected of [
      'water',
      'air',
      'nitrogen',
      'mineral-oil',
      'ethylene-glycol',
      'propylene-glycol',
      'propylene-glycol-30',
      'propylene-glycol-40',
      'propylene-glycol-50',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('leaves the DIPPR coefficients empty for mixtures', () => {
    expect(fluid('propylene-glycol-50')['vaporPressureA']).toBeNull();
    expect(fluid('propylene-glycol-50')['viscosityA']).toBeNull();
    expect(fluid('mineral-oil')['viscosityE']).toBeNull();
  });

  it('carries a reference viscosity for every fluid at 20 °C', () => {
    for (const row of fluidsTable.rows) {
      expect(requireNumber(row, 'viscosity')).toBeGreaterThan(0);
    }
    expect(fluid('water')['viscosity']).toBeCloseTo(0.001002, 9);
    expect(fluid('propylene-glycol-50')['viscosity']).toBeCloseTo(0.0046, 9);
  });
});

describe('dippr101', () => {
  it('reproduces the water boiling point from the vapor-pressure fit', () => {
    const pressure = dippr101(
      coefficients(fluid('water'), 'vaporPressure'),
      373.15,
    );
    expect(pressure / 101325).toBeCloseTo(1, 2);
  });

  it('reproduces the water viscosity near 20 °C', () => {
    const viscosity = dippr101(coefficients(fluid('water'), 'viscosity'), 293.15);
    expect(viscosity).toBeCloseTo(0.001, 4);
  });

  it('reproduces the nitrogen boiling point', () => {
    const pressure = dippr101(
      coefficients(fluid('nitrogen'), 'vaporPressure'),
      77.36,
    );
    expect(pressure / 101325).toBeCloseTo(1, 2);
  });
});
