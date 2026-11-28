import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { batteryTypesTable } from '../../models/battery-types.js';
import { commonBatteriesTable } from '../../models/common-batteries.js';
import { batteryStateOfCharge } from './battery-state-of-charge.js';

const tables = new TableRegistry([batteryTypesTable, commonBatteriesTable]);

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(batteryStateOfCharge, tables);
}

describe('battery state of charge', () => {
  it('passes its test cases', () => {
    assertCalculatorTests(batteryStateOfCharge, { tables });
  });

  it('reports what it still needs before a voltage is entered', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', '18650');
    expect(rt.isMissing('soc')).toBe(true);
    expect(rt.missingLabel('soc')).toContain('Cell voltage');
  });

  it('fills chemistry, cells, capacity and current from a common battery', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', 'lifepo4-12v-100ah');
    expect(rt.state['chemistry']).toBe('lifepo4');
    expect(rt.state['cells']).toBe(4);
    expect(rt.state['capacity']).toBe(100);
    expect(rt.state['maxCurrent']).toBe(100);
    expect(rt.errors).toEqual([]);
  });

  it('computes a cell voltage from the charge', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', '18650');
    rt.setDisplayText('soc', '25');
    expect(rt.state['cellVoltage']).toBeCloseTo(3.55, 6);
    expect(rt.state['packVoltage']).toBeCloseTo(3.55, 6);
  });

  it('inverts a cell voltage back to the charge', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', '18650');
    rt.setDisplayUnit('cellVoltage', 'V');
    rt.setDisplayText('cellVoltage', '3.95');
    expect(rt.state['soc']).toBeCloseTo(75, 6);
  });

  it('divides a pack voltage by the cell count', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', 'lifepo4-12v-100ah');
    rt.setDisplayText('packVoltage', '13.32');
    expect(rt.state['cellVoltage']).toBeCloseTo(3.33, 6);
    expect(rt.state['soc']).toBeCloseTo(75, 6);
  });

  it('lets a custom chemistry clear the common battery', () => {
    const rt = runtime();
    rt.setSelection('commonBattery', 'nine-volt');
    rt.setSelection('chemistry', 'nimh');
    expect(rt.state['chemistry']).toBe('nimh');
    expect(rt.state['commonBattery']).toBeNull();
    expect(rt.state['cells']).toBeNull();
    expect(rt.state['capacity']).toBeNull();
    expect(rt.state['maxCurrent']).toBeNull();
  });

  it('offers every chemistry to the chemistry select', () => {
    const rt = runtime();
    expect(rt.tableChoices('chemistry').map((choice) => choice.key)).toEqual(
      batteryTypesTable.rows.map((row) => row['id']),
    );
  });

  it('restores a saved state', () => {
    const rt = runtime();
    rt.loadState({
      commonBattery: '18650',
      chemistry: 'li-ion-nmc',
      cells: 1,
      temperature: 25,
      capacity: 3,
      maxCurrent: 10,
      soc: 50,
      cellVoltage: 3.7,
      packVoltage: 3.7,
    });
    expect(rt.state['chemistry']).toBe('li-ion-nmc');
    expect(rt.state['cellVoltage']).toBeCloseTo(3.7, 6);
  });
});
