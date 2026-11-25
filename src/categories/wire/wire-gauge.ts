import type { TableDefinition, TableRow } from '../../framework/types.js';

/**
 * Wire size reference table. AWG diameters follow the standard formula
 * `d = 0.127 mm * 92^((36 - n) / 39)`, where `n` is negative for the
 * 1/0 through 4/0 sizes. Metric sizes use the nominal cross-section, which is
 * how European cable is sold. Area, diameter, and radius are all stored so a
 * calculator can match a row from whichever one the user supplies.
 */

interface AwgSize {
  readonly key: string;
  readonly label: string;
  readonly gauge: number;
}

const NAMED_AWG_SIZES: readonly AwgSize[] = [
  { key: 'awg-4-0', label: '4/0 AWG', gauge: -3 },
  { key: 'awg-3-0', label: '3/0 AWG', gauge: -2 },
  { key: 'awg-2-0', label: '2/0 AWG', gauge: -1 },
  { key: 'awg-1-0', label: '1/0 AWG', gauge: 0 },
];

function awgSizes(): readonly AwgSize[] {
  const sizes: AwgSize[] = [...NAMED_AWG_SIZES];
  for (let gauge = 1; gauge <= 40; gauge += 1) {
    sizes.push({
      key: `awg-${gauge}`,
      label: `AWG ${gauge}`,
      gauge,
    });
  }
  return sizes;
}

function awgDiameter(gauge: number): number {
  return 0.127 * 92 ** ((36 - gauge) / 39);
}

function circleArea(diameter: number): number {
  return Math.PI * (diameter / 2) ** 2;
}

function awgRow(size: AwgSize): TableRow {
  const diameter = awgDiameter(size.gauge);
  return {
    id: size.key,
    label: size.label,
    standard: 'AWG',
    area: circleArea(diameter),
    diameter,
    radius: diameter / 2,
  };
}

/** Common European nominal cross-sections, in square millimetres. */
const METRIC_AREAS: readonly number[] = [
  0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185,
  240, 300, 400, 500, 630,
];

function metricKey(area: number): string {
  return `mm2-${String(area).replace('.', '-')}`;
}

function metricRow(area: number): TableRow {
  const diameter = 2 * Math.sqrt(area / Math.PI);
  return {
    id: metricKey(area),
    label: `${area} mm²`,
    standard: 'Metric',
    area,
    diameter,
    radius: diameter / 2,
  };
}

export const wireGaugeTable: TableDefinition = {
  id: 'wire-gauge',
  title: 'Wire gauges',
  description:
    'American Wire Gauge sizes and common European metric cross-sections, ' +
    'with conductor area, diameter, and radius.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Size ID' },
    { key: 'label', label: 'Size' },
    { key: 'standard', label: 'Standard' },
    {
      key: 'area',
      label: 'Cross-section',
      unit: 'mm2',
      description: 'Nominal conductor area.',
    },
    { key: 'diameter', label: 'Diameter', unit: 'mm' },
    { key: 'radius', label: 'Radius', unit: 'mm' },
  ],
  rows: [
    ...awgSizes().map(awgRow),
    ...METRIC_AREAS.map(metricRow),
  ],
};