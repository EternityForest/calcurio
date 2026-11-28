import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../framework/tables.js';
import { findBatteryType } from './battery-types.js';
import {
  commonBatteriesTable,
  commonBatteryFrom,
  findCommonBattery,
} from './common-batteries.js';

describe('common batteries table', () => {
  it('validates', () => {
    expect(() => validateTableDefinition(commonBatteriesTable)).not.toThrow();
  });

  it('lists the common batteries', () => {
    const ids = commonBatteriesTable.rows.map((row) => row['id']);
    for (const expected of [
      'nine-volt',
      'aa',
      'aaa',
      'car-12v',
      'lifepo4-12v-100ah',
      'cr2032',
      '18650',
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('declares units for its numeric columns', () => {
    const column = (key: string) =>
      commonBatteriesTable.columns.find((entry) => entry.key === key);
    expect(column('cellCount')?.unit).toBe('count');
    expect(column('capacity')?.unit).toBe('Ah');
    expect(column('maxCurrent')?.unit).toBe('A');
    expect(column('chemistry')?.unit).toBeUndefined();
  });

  it('names a real chemistry for every row', () => {
    for (const row of commonBatteriesTable.rows) {
      const battery = commonBatteryFrom(row);
      expect(findBatteryType(battery.chemistry)).not.toBeNull();
    }
  });

  it('reads the 12 V 100 Ah LiFePO₄ pack', () => {
    const pack = findCommonBattery('lifepo4-12v-100ah')!;
    expect(pack.chemistry).toBe('lifepo4');
    expect(pack.cellCount).toBe(4);
    expect(pack.capacity).toBe(100);
    expect(pack.maxCurrent).toBe(100);
  });

  it('rejects unknown batteries', () => {
    expect(findCommonBattery('nope')).toBeNull();
  });

  it('throws on an incomplete row', () => {
    expect(() => commonBatteryFrom({ chemistry: 'alkaline' })).toThrow(
      /incomplete/,
    );
  });
});
