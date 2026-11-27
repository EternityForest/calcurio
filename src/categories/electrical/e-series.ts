/**
 * E-series preferred values for resistors and capacitors. The tables are built
 * on first use from the series mantissas rather than written out by hand, and
 * each row's label names the value together with the smallest series it
 * belongs to, such as "1k(E3)" or "5.1k(E24)".
 */

import type {
  TableDefinition,
  TableProvider,
  TableRow,
} from '../../framework/types.js';

interface Series {
  readonly id: string;
  readonly mantissas: readonly number[];
}

/** E3: the three-value series, the coarsest tolerance (about ±20%). */
const E3: readonly number[] = [1.0, 2.2, 4.7];
/** E6: about ±10%. */
const E6: readonly number[] = [1.0, 1.5, 2.2, 3.3, 4.7, 6.8];
/** E12: about ±5%. */
const E12: readonly number[] = [
  1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
];
/** E24: about ±1%, and the union of every series below it. */
const E24: readonly number[] = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6,
  3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

/** Smallest series first, so membership resolves to the tightest tolerance. */
const SERIES: readonly Series[] = [
  { id: 'E3', mantissas: E3 },
  { id: 'E6', mantissas: E6 },
  { id: 'E12', mantissas: E12 },
  { id: 'E24', mantissas: E24 },
];

const MANTISSA_TOLERANCE = 1e-9;

/** The smallest series that contains a mantissa. */
function smallestSeries(mantissa: number): string {
  for (const series of SERIES) {
    if (
      series.mantissas.some(
        (candidate) => Math.abs(candidate - mantissa) < MANTISSA_TOLERANCE,
      )
    ) {
      return series.id;
    }
  }
  return 'E24';
}

const SI_PREFIXES: readonly (readonly [number, string])[] = [
  [1e9, 'G'],
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
  [1e-9, 'n'],
  [1e-12, 'p'],
];

/** Renders a number with one decimal at most, dropping a trailing ".0". */
function trimDecimal(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** Formats a value with an SI prefix, such as 4700 as "4.7k". */
function formatSI(value: number): string {
  for (const [factor, prefix] of SI_PREFIXES) {
    if (Math.abs(value) >= factor * (1 - MANTISSA_TOLERANCE)) {
      return `${trimDecimal(value / factor)}${prefix}`;
    }
  }
  return trimDecimal(value);
}

interface SeriesTableOptions {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Unit the values are stored in, such as "Ω" or "F". */
  readonly unit: 'ohm' | 'F';
  /** Smallest value to include, in `unit`. */
  readonly minValue: number;
  /** Largest value to include, in `unit`. */
  readonly maxValue: number;
}

/**
 * Builds one E24 table spanning whole decades, trimmed to the requested
 * bounds. Every decade contributes all 24 mantissas except the first and last,
 * which stop at the nearest preferred value inside the range.
 */
function buildSeriesTable(options: SeriesTableOptions): TableDefinition {
  const minDecade = Math.floor(Math.log10(options.minValue));
  const maxDecade = Math.ceil(Math.log10(options.maxValue));
  const rows: TableRow[] = [];
  for (let decade = minDecade; decade <= maxDecade; decade += 1) {
    const scale = 10 ** decade;
    for (const mantissa of E24) {
      const value = mantissa * scale;
      if (
        value < options.minValue * (1 - MANTISSA_TOLERANCE) ||
        value > options.maxValue * (1 + MANTISSA_TOLERANCE)
      ) {
        continue;
      }
      const text = formatSI(value);
      rows.push({
        id: text,
        label: `${text}(${smallestSeries(mantissa)})`,
        value,
      });
    }
  }

  return {
    id: options.id,
    title: options.title,
    description: options.description,
    keyColumn: 'id',
    labelColumn: 'label',
    columns: [
      { key: 'id', label: 'Value ID' },
      { key: 'label', label: 'Value' },
      {
        key: 'value',
        label: 'Nominal value',
        unit: options.unit,
        description: 'Preferred value in the series.',
      },
    ],
    rows,
  };
}

/** E-series resistors, 1 mΩ through 100 MΩ. */
export const eSeriesResistors: TableProvider = {
  id: 'e-series-resistors',
  build: () =>
    buildSeriesTable({
      id: 'e-series-resistors',
      title: 'E-series resistors',
      description:
        'Preferred resistance values for E3, E6, E12, and E24 series ' +
        'resistors, spanning 1 mΩ to 100 MΩ. Each label names the smallest ' +
        'series the value belongs to.',
      unit: 'ohm',
      minValue: 1e-3,
      maxValue: 100e6,
    }),
};

/** E-series capacitors, 1 pF through 1 mF. */
export const eSeriesCapacitors: TableProvider = {
  id: 'e-series-capacitors',
  build: () =>
    buildSeriesTable({
      id: 'e-series-capacitors',
      title: 'E-series capacitors',
      description:
        'Preferred capacitance values for E3, E6, E12, and E24 series ' +
        'capacitors, spanning 1 pF to 1 mF. Each label names the smallest ' +
        'series the value belongs to.',
      unit: 'F',
      minValue: 1e-12,
      maxValue: 1e-3,
    }),
};
