/**
 * Battery state of charge. Pick a chemistry and a cell count, or a common
 * battery that brings both in at once, then enter any one of state of charge,
 * cell voltage, or pack voltage to read the other two. The chemistry's voltage
 * curve is interpolated forwards for charge to voltage, and inverted by a
 * binary search for voltage to charge.
 */

import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import {
  cellVoltageAt,
  findBatteryType,
  REFERENCE_TEMPERATURE,
  stateOfChargeAt,
} from '../../models/battery-types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Divides two known values, or null when either is missing or zero. */
function divideOrNull(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}


export const batteryStateOfCharge: CalculatorDefinition = {
  id: 'battery-state-of-charge',
  title: 'Battery state of charge',
  description:
    'State of charge of a cell or pack from its resting voltage, and the ' +
    'other way around. Pick a chemistry and cell count, or a common battery ' +
    'to set both, then enter one of charge, cell voltage, or pack voltage.',
  variables: [
    {
      name: 'commonBattery',
      label: 'Common battery',
      table: 'common-batteries',
      description:
        'A common battery, which sets the chemistry and cell count at once. ' +
        'Clear it to enter a custom chemistry and cell count.',
    },
    {
      name: 'chemistry',
      label: 'Chemistry',
      table: 'battery-types',
      tableSelect: 'commonBattery',
      tableField: 'chemistry',
      description: 'Cell chemistry, which sets the resting voltage curve.',
    },
    {
      name: 'cells',
      label: 'Cells in series',
      unit: 'count',
      tableSelect: 'commonBattery',
      tableField: 'cellCount',
      description: 'Number of cells in series.',
      validate: (state) => {
        const cells = valueOf(state, 'cells');
        return cells !== null && cells < 1
          ? 'Cell count must be at least one.'
          : undefined;
      },
    },
    {
      name: 'temperature',
      label: 'Temperature',
      unit: 'degC',
      default: REFERENCE_TEMPERATURE,
      description: 'Cell temperature, which shifts the resting voltage curve.',
    },
    {
      name: 'capacity',
      label: 'Typical capacity',
      unit: 'Ah',
      defaultDisplayUnit: 'mAh',
      editable: false,
      tableSelect: 'commonBattery',
      tableField: 'capacity',
      description: 'Typical capacity of the chosen common battery.',
    },
    {
      name: 'maxCurrent',
      label: 'Max discharge current',
      unit: 'A',
      defaultDisplayUnit: 'mA',
      editable: false,
      tableSelect: 'commonBattery',
      tableField: 'maxCurrent',
      description: 'Typical maximum discharge current of the common battery.',
    },
    {
      name: 'soc',
      label: 'State of charge',
      unit: 'percent',
      description: 'Charge remaining, from 0 to 100 percent.',
      validate: (state) => {
        const soc = valueOf(state, 'soc');
        return soc !== null && (soc < 0 || soc > 100)
          ? 'State of charge must be between 0 and 100 percent.'
          : undefined;
      },
      computable: (state) => {
        const chemistry = state['chemistry'];
        if (typeof chemistry !== 'string') {
          return missing(['chemistry']);
        }
        const type = findBatteryType(chemistry);
        if (type === null) {
          return missing([]);
        }
        const temperature =
          valueOf(state, 'temperature') ?? REFERENCE_TEMPERATURE;
        const cells = valueOf(state, 'cells');
        const packVoltage = valueOf(state, 'packVoltage');
          const needs: string[] = [];
          if (packVoltage === null) {
            needs.push('packVoltage');
          }
          if (cells === null) {
            needs.push('cells');
          }
          if(needs.length>0){
          return missing(needs);
          }
        const volts = packVoltage!/cells!;

        const result = stateOfChargeAt(type, volts, temperature);
        return result === null ? missing([]) : result;
      },
    },
    {
      name: 'cellVoltage',
      label: 'Cell voltage',
      unit: 'V',
      defaultDisplayUnit: 'mV',
      description: 'Resting voltage of one cell.',
      editable: false,
      computable: (state) => {
          const cells = valueOf(state, 'cells');
        const packVoltage = valueOf(state, 'packVoltage');
          const needs: string[] = [];
          if (packVoltage === null) {
            needs.push('packVoltage');
          }
          if (cells === null) {
            needs.push('cells');
          }
          if(needs.length>0){
          return missing(needs);
          }
        const volts = packVoltage!/cells!;
        return volts;
      },
    },
    {
      name: 'packVoltage',
      label: 'Pack voltage',
      unit: 'V',
      defaultDisplayUnit: 'V',
      description: 'Resting voltage of the whole pack.',
      validate: (state) => {
        const voltage = valueOf(state, 'packVoltage');
        return voltage !== null && voltage <= 0
          ? 'Pack voltage must be greater than zero.'
          : undefined;
      },
      computable: (state) => {
        const cells = valueOf(state, 'cells');
        if (cells === null) {
          return missing(['cells']);
        }

        const chemistry = state['chemistry'];
        if (typeof chemistry !== 'string') {
          return missing(['chemistry']);
        }
        const type = findBatteryType(chemistry);
        if (type === null) {
          return missing([]);
        }
        const soc = valueOf(state, 'soc');
        if (soc === null) {
          return missing(['cellVoltage', 'soc']);
        }
        const temperature =
          valueOf(state, 'temperature') ?? REFERENCE_TEMPERATURE;
        const volts = cellVoltageAt(type, soc, temperature);
        return volts === null ? missing([]) : volts * cells;
      },
    },
  ],
  testCases: [
    {
      commonBattery: '18650',
      chemistry: 'li-ion-nmc',
      cells: 1,
      temperature: 25,
      capacity: 3,
      maxCurrent: 10,
      soc: 50,
      cellVoltage: 3.7,
      packVoltage: 3.7,
    },
    {
      commonBattery: 'lifepo4-12v-100ah',
      chemistry: 'lifepo4',
      cells: 4,
      temperature: 25,
      capacity: 100,
      maxCurrent: 100,
      soc: 100,
      cellVoltage: 3.45,
      packVoltage: 13.8,
    },
    {
      commonBattery: 'nine-volt',
      chemistry: 'alkaline',
      cells: 6,
      temperature: 25,
      capacity: 0.5,
      maxCurrent: 0.025,
      soc: 0,
      cellVoltage: 0.9,
      packVoltage: 5.4,
    },
    {
      commonBattery: 'cr2032',
      chemistry: 'lithium-coin-3v',
      cells: 1,
      temperature: 25,
      capacity: 0.225,
      maxCurrent: 0.003,
      soc: 75,
      cellVoltage: 3.1,
      packVoltage: 3.1,
    },
    {
      commonBattery: 'car-12v',
      chemistry: 'flooded-lead-acid',
      cells: 6,
      temperature: 45,
      capacity: 50,
      maxCurrent: 300,
      soc: 50,
      cellVoltage: 2.039,
      packVoltage: 12.234,
    },
    {
      commonBattery: 'aa',
      chemistry: 'alkaline',
      cells: 1,
      temperature: -10,
      capacity: 2.5,
      maxCurrent: 0.5,
      soc: 25,
      cellVoltage: 1.2605,
      packVoltage: 1.2605,
    },
    {
      commonBattery: 'aaa',
      chemistry: 'alkaline',
      cells: 1,
      temperature: 25,
      capacity: 1,
      maxCurrent: 0.3,
      soc: 100,
      cellVoltage: 1.6,
      packVoltage: 1.6,
    },
  ],
};
