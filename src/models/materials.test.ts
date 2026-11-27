import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../framework/tables.js';
import {
  findMaterial,
  latentHeatBetween,
  materialsTable,
  sensibleHeatBetween,
  specificHeatAt,
} from './materials.js';

function material(id: string) {
  const found = findMaterial(id);
  if (found === undefined) {
    throw new Error(`No material "${id}".`);
  }
  return found;
}

describe('materials table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(materialsTable)).not.toThrow();
  });

  it('lists the core working fluids and solids', () => {
    const ids = materialsTable.rows.map((row) => row['id']);
    for (const expected of [
      'water',
      'ice',
      'air',
      'nitrogen',
      'mineral-oil',
      'ethylene-glycol',
      'propylene-glycol',
      'propylene-glycol-30',
      'propylene-glycol-40',
      'propylene-glycol-50',
      'aluminum',
      'copper',
      'steel',
      'lead',
      'mercury',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('leaves viscosity empty for solids', () => {
    expect(material('aluminum').viscosity).toBeNull();
    expect(material('water').viscosity).toBeCloseTo(0.001002, 9);
  });

  it('carries phase-change data for water', () => {
    const water = material('water');
    expect(water.meltingPoint).toBe(0);
    expect(water.freezingPoint).toBe(0);
    expect(water.boilingPoint).toBe(100);
    expect(water.heatOfFusion).toBe(334000);
    expect(water.heatOfVaporization).toBe(2256000);
  });

  it('declares density as a two-axis lookup with standards', () => {
    const density = materialsTable.columns.find(
      (column) => column.key === 'density',
    );
    expect(density?.kind).toBe('lookup');
    expect(density?.unit).toBe('kg/m^3@degC,kPa');
    expect(density?.standards).toEqual({ 'degC': 20, kPa: 101.325 });
  });

  it('declares a standard temperature for the specific-heat lookup', () => {
    const specificHeat = materialsTable.columns.find(
      (column) => column.key === 'specificHeat',
    );
    expect(specificHeat?.kind).toBe('lookup');
    expect(specificHeat?.standards).toEqual({ 'degC': 20 });
  });

  it('reads a plain numeric density as its standard-point fallback', () => {
    expect(material('water').density).toBeCloseTo(998.2, 6);
  });
});

describe('specificHeatAt', () => {
  it('interpolates water across its phase changes', () => {
    const water = material('water');
    expect(specificHeatAt(water, -10)).toBeCloseTo(2100, 6);
    expect(specificHeatAt(water, 20)).toBeCloseTo(4182, 6);
    expect(specificHeatAt(water, 120)).toBeCloseTo(2000, 6);
  });

  it('returns the constant value for a single-sample material', () => {
    expect(specificHeatAt(material('aluminum'), 500)).toBeCloseTo(900, 6);
  });
});

describe('sensibleHeatBetween', () => {
  it('integrates water across the ice-to-liquid transition', () => {
    expect(sensibleHeatBetween(material('water'), -10, 10)).toBeCloseTo(
      62820,
      6,
    );
  });

  it('integrates water across the liquid-to-steam transition', () => {
    expect(sensibleHeatBetween(material('water'), 20, 120)).toBeCloseTo(
      374560,
      6,
    );
  });

  it('handles a constant specific heat', () => {
    expect(sensibleHeatBetween(material('aluminum'), 20, 120)).toBeCloseTo(
      90000,
      6,
    );
  });
});

describe('latentHeatBetween', () => {
  it('adds the heat of fusion when melting is crossed', () => {
    expect(latentHeatBetween(material('water'), -10, 10)).toBeCloseTo(
      334000,
      6,
    );
  });

  it('adds the heat of vaporization when boiling is crossed', () => {
    expect(latentHeatBetween(material('water'), 20, 120)).toBeCloseTo(
      2256000,
      6,
    );
  });

  it('returns zero when no transition is crossed', () => {
    expect(latentHeatBetween(material('water'), 20, 80)).toBe(0);
  });

  it('releases latent heat when cooling across a transition', () => {
    expect(latentHeatBetween(material('water'), 120, 20)).toBeCloseTo(
      -2256000,
      6,
    );
  });

  it('returns zero when a material has no latent heat', () => {
    expect(latentHeatBetween(material('aluminum'), 20, 120)).toBe(0);
  });
});
