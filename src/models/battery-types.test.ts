import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../framework/tables.js';
import {
  batteryTypeFrom,
  batteryTypesTable,
  cellVoltageAt,
  findBatteryType,
  REFERENCE_TEMPERATURE,
  stateOfChargeAt,
} from './battery-types.js';

function chemistry(id: string) {
  const found = findBatteryType(id);
  if (found === null) {
    throw new Error(`No chemistry "${id}".`);
  }
  return found;
}

describe('battery types table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(batteryTypesTable)).not.toThrow();
  });

  it('lists the common chemistries', () => {
    const ids = batteryTypesTable.rows.map((row) => row['id']);
    for (const expected of [
      'li-ion-lco',
      'li-ion-lmo',
      'li-ion-nmc',
      'li-ion-nca',
      'lifepo4',
      'lithium-titanate',
      'sodium-nfpp',
      'sodium-layered-oxide',
      'nimh',
      'lithium-coin-3v',
      'lithium-1.5v',
      'alkaline',
      'flooded-lead-acid',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('declares the voltage column as a two-axis lookup', () => {
    const voltage = batteryTypesTable.columns.find(
      (column) => column.key === 'voltage',
    );
    expect(voltage?.kind).toBe('lookup');
    expect(voltage?.unit).toBe('V@percent,degC');
    expect(voltage?.standards).toEqual({ degC: REFERENCE_TEMPERATURE });
  });

  it('rejects unknown chemistries', () => {
    expect(findBatteryType('nope')).toBeNull();
  });

  it('throws on an incomplete row', () => {
    expect(() => batteryTypeFrom({ voltage: 3.7 })).toThrow(/incomplete/);
  });
});

describe('cellVoltageAt', () => {
  it('reads the reference curve at 25 °C', () => {
    const type = chemistry('li-ion-nmc');
    expect(cellVoltageAt(type, 0, 25)).toBeCloseTo(3.0, 6);
    expect(cellVoltageAt(type, 50, 25)).toBeCloseTo(3.7, 6);
    expect(cellVoltageAt(type, 100, 25)).toBeCloseTo(4.2, 6);
  });

  it('rises monotonically with charge', () => {
    const type = chemistry('lifepo4');
    let previous = Number.NEGATIVE_INFINITY;
    for (let soc = 0; soc <= 100; soc += 5) {
      const volts = cellVoltageAt(type, soc, 25)!;
      expect(volts).toBeGreaterThan(previous);
      previous = volts;
    }
  });

  it('shifts with temperature in the chemistry direction', () => {
    const lithium = chemistry('li-ion-nmc');
    expect(cellVoltageAt(lithium, 50, 45)!).toBeLessThan(
      cellVoltageAt(lithium, 50, 25)!,
    );
    const lead = chemistry('flooded-lead-acid');
    expect(cellVoltageAt(lead, 50, 45)!).toBeGreaterThan(
      cellVoltageAt(lead, 50, 25)!,
    );
  });

  it('returns null when the chemistry has no voltage data', () => {
    const empty = { id: 'x', label: 'x', nominal: null, voltage: null };
    expect(cellVoltageAt(empty, 50, 25)).toBeNull();
    expect(stateOfChargeAt(empty, 3.7, 25)).toBeNull();
  });
});

describe('stateOfChargeAt', () => {
  it('round-trips cellVoltageAt across the grid', () => {
    const type = chemistry('lifepo4');
    for (const soc of [0, 25, 50, 75, 100]) {
      for (const temperature of [-10, 25, 45]) {
        const volts = cellVoltageAt(type, soc, temperature)!;
        expect(stateOfChargeAt(type, volts, temperature)!).toBeCloseTo(soc, 6);
      }
    }
  });

  it('round-trips off the grid points', () => {
    const type = chemistry('alkaline');
    for (const soc of [10, 40, 60, 90]) {
      const volts = cellVoltageAt(type, soc, 25)!;
      expect(stateOfChargeAt(type, volts, 25)!).toBeCloseTo(soc, 6);
    }
  });

  it('clamps targets outside the sampled range', () => {
    const type = chemistry('li-ion-nmc');
    expect(stateOfChargeAt(type, 0, 25)).toBeCloseTo(0, 6);
    expect(stateOfChargeAt(type, 10, 25)).toBeCloseTo(100, 6);
  });

  it('returns null for a non-finite target', () => {
    expect(stateOfChargeAt(chemistry('alkaline'), Number.NaN, 25)).toBeNull();
  });
});
