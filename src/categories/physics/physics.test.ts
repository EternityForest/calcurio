import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import {
  findRow,
  TableRegistry,
  validateTableDefinition,
} from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { speedOfLight } from './speed-of-light.js';
import { waveMediaTable } from './wave-media.js';
import { wavelengthsTable } from './wavelengths.js';

const registry = new TableRegistry([waveMediaTable, wavelengthsTable]);

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(speedOfLight, registry);
}

describe('wave media table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(waveMediaTable)).not.toThrow();
  });

  it('covers the requested media', () => {
    const ids = waveMediaTable.rows.map((row) => row['id']);
    for (const expected of [
      'air',
      'vacuum',
      'ptfe',
      'cat5e',
      'rg58',
      'rg316',
      'rg400',
      'lmr400',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('keeps the vacuum speed and impedance exact', () => {
    const row = findRow(waveMediaTable, 'vacuum');
    expect(row?.['speedOfLight']).toBe(299792458);
    expect(row?.['impedance']).toBe(376.73);
  });
});

describe('wavelengths table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(wavelengthsTable)).not.toThrow();
  });

  it('covers the requested wavelengths', () => {
    const ids = wavelengthsTable.rows.map((row) => row['id']);
    for (const expected of [
      'red',
      'orange',
      'yellow',
      'green',
      'cyan',
      'blue',
      'purple',
      'uva',
      'uvb',
      'uvc',
      'germicidal',
      'ism-2-4ghz',
      'ism-5ghz',
      'ism-915mhz',
      'ism-433mhz',
      'cb-27mhz',
      'vhf-60ghz',
      'band-2m',
      'band-10m',
      'ir-850',
      'ir-950',
      'thermal',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('describes a use for every wavelength', () => {
    for (const row of wavelengthsTable.rows) {
      expect(typeof row['uses']).toBe('string');
      expect((row['uses'] as string).length).toBeGreaterThan(0);
    }
  });

  it('agrees with the wavelengths at the speed of light', () => {
    for (const row of wavelengthsTable.rows) {
      const wavelength = row['wavelength'] as number;
      const frequency = row['frequency'] as number;
      expect(
        Math.abs(299792458 / wavelength - frequency) / frequency,
      ).toBeLessThan(1e-6);
    }
  });
});

describe('Speed of light', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(speedOfLight, { tables: registry }),
    ).not.toThrow();
  });

  it('takes the speed from the chosen medium', () => {
    const calc = runtime();
    calc.setSelection('medium', 'ptfe');
    expect(calc.state['speed']).toBeCloseTo(208355758, 3);
  });

  it('computes wavelength and travel time from the medium', () => {
    const calc = runtime();
    calc.setSelection('medium', 'vacuum');
    calc.setDisplayText('frequency', '1');
    calc.setDisplayText('distance', '300');
    expect(calc.state['wavelength']).toBeCloseTo(299.792458, 6);
    expect(calc.state['travelTime']).toBeCloseTo(1.000692285594456e-6, 15);
    expect(calc.errors).toEqual([]);
  });

  it('clears the wavelength until both speed and frequency are known', () => {
    const calc = runtime();
    expect(calc.state['speed']).toBeNull();
    calc.setDisplayText('frequency', '100');
    expect(calc.state['wavelength']).toBeNull();
  });
});
