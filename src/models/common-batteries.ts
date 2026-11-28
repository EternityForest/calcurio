/**
 * Common batteries, keyed by a chemistry from the battery-types table and a
 * cell count, with a typical capacity and maximum discharge current. Picking a
 * row sets the chemistry and cell count at once; the capacity and current are
 * shown for reference.
 */

import { findRow, numericCell, textCell } from '../framework/tables.js';
import type { TableDefinition, TableRow } from '../framework/types.js';

interface CommonBatteryRowInput {
  readonly id: string;
  readonly label: string;
  /** Key of a row in the battery-types table. */
  readonly chemistry: string;
  readonly cellCount: number;
  /** Typical average capacity, in amp-hours. */
  readonly capacity: number;
  /** Typical maximum discharge current, in amps. */
  readonly maxCurrent: number;
}

function row(input: CommonBatteryRowInput): TableRow {
  return { ...input };
}

export const commonBatteriesTable: TableDefinition = {
  id: 'common-batteries',
  title: 'Common batteries',
  description:
    'Common batteries with a typical capacity and maximum discharge current. ' +
    'The chemistry column names a row of the battery chemistries table, so ' +
    'choosing a battery also chooses its chemistry and cell count.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Battery ID' },
    { key: 'label', label: 'Battery' },
    {
      key: 'chemistry',
      label: 'Chemistry',
      description: 'Chemistry ID from the battery chemistries table.',
    },
    {
      key: 'cellCount',
      label: 'Cells in series',
      unit: 'count',
      description: 'Number of cells in series.',
    },
    {
      key: 'capacity',
      label: 'Typical capacity',
      unit: 'Ah',
      description: 'Typical average capacity.',
    },
    {
      key: 'maxCurrent',
      label: 'Max discharge current',
      unit: 'A',
      description: 'Typical maximum continuous discharge current.',
    },
  ],
  rows: [
    row({
      id: 'nine-volt',
      label: '9 V alkaline',
      chemistry: 'alkaline',
      cellCount: 6,
      capacity: 0.5,
      maxCurrent: 0.025,
    }),
    row({
      id: 'aa',
      label: 'AA alkaline',
      chemistry: 'alkaline',
      cellCount: 1,
      capacity: 2.5,
      maxCurrent: 0.5,
    }),
    row({
      id: 'aaa',
      label: 'AAA alkaline',
      chemistry: 'alkaline',
      cellCount: 1,
      capacity: 1.0,
      maxCurrent: 0.3,
    }),
    row({
      id: 'car-12v',
      label: '12 V car battery',
      chemistry: 'flooded-lead-acid',
      cellCount: 6,
      capacity: 50,
      maxCurrent: 300,
    }),
    row({
      id: 'lifepo4-12v-100ah',
      label: '12 V 100 Ah LiFePO₄',
      chemistry: 'lifepo4',
      cellCount: 4,
      capacity: 100,
      maxCurrent: 100,
    }),
    row({
      id: 'cr2032',
      label: 'CR2032',
      chemistry: 'lithium-coin-3v',
      cellCount: 1,
      capacity: 0.225,
      maxCurrent: 0.003,
    }),
    row({
      id: '18650',
      label: '18650 lithium',
      chemistry: 'li-ion-nmc',
      cellCount: 1,
      capacity: 3.0,
      maxCurrent: 10,
    }),
  ],
};

/** One common battery row, with its numeric columns parsed. */
export interface CommonBattery {
  readonly id: string;
  readonly label: string;
  readonly chemistry: string;
  readonly cellCount: number | null;
  readonly capacity: number | null;
  readonly maxCurrent: number | null;
}

/** Converts one table row into a common battery. */
export function commonBatteryFrom(row: TableRow): CommonBattery {
  const id = textCell(row['id']);
  const label = textCell(row['label']);
  if (id === null || label === null) {
    throw new Error('Common batteries table has an incomplete row.');
  }
  return {
    id,
    label,
    chemistry: textCell(row['chemistry']) ?? '',
    cellCount: numericCell(row['cellCount']),
    capacity: numericCell(row['capacity']),
    maxCurrent: numericCell(row['maxCurrent']),
  };
}

/** Finds a common battery by its table key, or null when unknown. */
export function findCommonBattery(id: string): CommonBattery | null {
  const row = findRow(commonBatteriesTable, id);
  return row === undefined ? null : commonBatteryFrom(row);
}
