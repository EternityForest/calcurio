/**
 * Thermophysical properties of common solids and liquids (plus the working
 * gases the fluids calculators use). Viscosity, thermal conductivity, and
 * thermal expansion are reference values at 20 °C. Density and specific heat
 * are stored as sampled lookup cells and interpolated: density against
 * temperature and pressure, specific heat against temperature, so a single row
 * can cover a material across a phase change.
 *
 * Melting/freezing and boiling points sit alongside the latent heats so the
 * phase-change calculator can account for a transition when the requested
 * temperature range crosses one.
 */

import {
  interpolateAt,
  interpolateLookup,
  lookupCellOf,
} from '../framework/interpolate.js';
import type { LookupCell } from '../framework/interpolate.js';
import { findRow, numericCell, textCell } from '../framework/tables.js';
import type { TableDefinition, TableRow } from '../framework/types.js';

interface MaterialRowInput {
  readonly id: string;
  readonly label: string;
  readonly state: string;
  readonly density: number;
  readonly specificHeat: string;
  readonly thermalConductivity: number|null;
  readonly thermalExpansion: number|null;
  readonly viscosity: number | null;
  readonly meltingPoint: number | null;
  readonly freezingPoint: number | null;
  readonly boilingPoint: number | null;
  readonly heatOfFusion: number | null;
  readonly heatOfVaporization: number | null;
}

function row(input: MaterialRowInput): TableRow {
  return { ...input };
}

export const materialsTable: TableDefinition = {
  id: 'materials',
  title: 'Materials',
  description:
    'Thermophysical properties of common solids and liquids, plus the working ' +
    'gases used by the fluids calculators. Viscosity, thermal conductivity, ' +
    'and thermal expansion are reference values at 20 °C. Density and specific ' +
    'heat are sampled lookups, interpolated against temperature and pressure ' +
    'or against temperature alone.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Material ID' },
    { key: 'label', label: 'Material' },
    { key: 'state', label: 'State at 20 °C' },
    {
      key: 'density',
      label: 'Density',
      unit: 'kg/m3@°C,kPa',
      kind: 'lookup',
      standards: { '°C': 20, kPa: 101.325 },
      description:
        'Density sampled against temperature and pressure, written as ' +
        '"value@temperature,pressure" pairs. Plain numbers are the value at ' +
        '20 °C and 101.325 kPa.',
    },
    {
      key: 'specificHeat',
      label: 'Specific heat',
      unit: 'J/(kg·K)@°C',
      kind: 'lookup',
      standards: { '°C': 20 },
      description:
        'Specific heat capacity sampled against temperature, written as ' +
        '"value@temperature" pairs.',
    },
    {
      key: 'thermalConductivity',
      label: 'Thermal conductivity',
      unit: 'W/(m·K)',
      description: 'Thermal conductivity at 20 °C.',
    },
    {
      key: 'thermalExpansion',
      label: 'Thermal expansion',
      unit: '1/K',
      description: 'Volumetric thermal expansion coefficient at 20 °C.',
    },
    {
      key: 'viscosity',
      label: 'Viscosity',
      unit: 'Pa·s',
      description: 'Dynamic viscosity at 20 °C. Empty for solids.',
    },
    {
      key: 'meltingPoint',
      label: 'Melting point',
      unit: '°C',
      description: 'Melting point. Empty when the material does not melt.',
    },
    {
      key: 'freezingPoint',
      label: 'Freezing point',
      unit: '°C',
      description: 'Freezing point. Empty when the material does not freeze.',
    },
    {
      key: 'boilingPoint',
      label: 'Boiling point',
      unit: '°C',
      description: 'Boiling point. Empty when the material does not boil.',
    },
    {
      key: 'heatOfFusion',
      label: 'Heat of fusion',
      unit: 'J/kg',
      description: 'Latent heat of melting. Empty when not applicable.',
    },
    {
      key: 'heatOfVaporization',
      label: 'Heat of vaporization',
      unit: 'J/kg',
      description: 'Latent heat of boiling. Empty when not applicable.',
    },
  ],
  rows: [
    row({
      id: 'water',
      label: 'Water',
      state: 'liquid',
      density: 998.2,
      specificHeat:
        '2100@-20; 2100@-0.001; 4182@0.001; 4182@99.999; 2000@100.001; 2000@200',
      thermalConductivity: 0.598,
      thermalExpansion: 2.07e-4,
      viscosity: 0.001002,
      meltingPoint: 0,
      freezingPoint: 0,
      boilingPoint: 100,
      heatOfFusion: 334000,
      heatOfVaporization: 2256000,
    }),
    row({
      id: 'ice',
      label: 'Ice',
      state: 'solid',
      density: 916.7,
      specificHeat: '2100@-20; 2100@-0.001',
      thermalConductivity: 2.22,
      thermalExpansion: 5.1e-5,
      viscosity: null,
      meltingPoint: 0,
      freezingPoint: 0,
      boilingPoint: 100,
      heatOfFusion: 334000,
      heatOfVaporization: 2256000,
    }),
    row({
      id: 'air',
      label: 'Air',
      state: 'gas',
      density: 1.204,
      specificHeat: '1005@20',
      thermalConductivity: 0.0257,
      thermalExpansion: 3.41e-3,
      viscosity: 1.825e-5,
      meltingPoint: null,
      freezingPoint: null,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'nitrogen',
      label: 'Nitrogen',
      state: 'gas',
      density: 1.165,
      specificHeat: '1040@20',
      thermalConductivity: 0.0258,
      thermalExpansion: 3.41e-3,
      viscosity: 1.76e-5,
      meltingPoint: -210,
      freezingPoint: -210,
      boilingPoint: -195.8,
      heatOfFusion: 25700,
      heatOfVaporization: 199000,
    }),
    row({
      id: 'mineral-oil',
      label: 'Mineral oil',
      state: 'liquid',
      density: 880,
      specificHeat: '1900@20',
      thermalConductivity: 0.13,
      thermalExpansion: 7.5e-4,
      viscosity: 0.03,
      meltingPoint: -30,
      freezingPoint: -30,
      boilingPoint: 300,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'ethylene-glycol',
      label: 'Ethylene glycol',
      state: 'liquid',
      density: 1113,
      specificHeat: '2410@20',
      thermalConductivity: 0.252,
      thermalExpansion: 5.7e-4,
      viscosity: 0.0209,
      meltingPoint: -12.9,
      freezingPoint: -12.9,
      boilingPoint: 197.3,
      heatOfFusion: 187000,
      heatOfVaporization: 1000000,
    }),
    row({
      id: 'propylene-glycol',
      label: 'Propylene glycol',
      state: 'liquid',
      density: 1036,
      specificHeat: '2480@20',
      thermalConductivity: 0.2,
      thermalExpansion: 6.4e-4,
      viscosity: 0.0576,
      meltingPoint: -59,
      freezingPoint: -59,
      boilingPoint: 188.2,
      heatOfFusion: 86000,
      heatOfVaporization: 900000,
    }),
    row({
      id: 'propylene-glycol-30',
      label: 'Propylene glycol 30 %',
      state: 'liquid',
      density: 1023.8,
      specificHeat: '3857@20',
      thermalConductivity: 0.4444,
      thermalExpansion: 4.5e-4,
      viscosity: 0.0024,
      meltingPoint: -15,
      freezingPoint: -15,
      boilingPoint: 105,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'propylene-glycol-40',
      label: 'Propylene glycol 40 %',
      state: 'liquid',
      density: 1032.3,
      specificHeat: '3707@20',
      thermalConductivity: 0.4003,
      thermalExpansion: 5.4e-4,
      viscosity: 0.0032,
      meltingPoint: -20,
      freezingPoint: -20,
      boilingPoint: 107,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'propylene-glycol-50',
      label: 'Propylene glycol 50 %',
      state: 'liquid',
      density: 1039.1,
      specificHeat: '3530@20',
      thermalConductivity: 0.3595,
      thermalExpansion: 6.2e-4,
      viscosity: 0.0046,
      meltingPoint: -35,
      freezingPoint: -35,
      boilingPoint: 110,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'mercury',
      label: 'Mercury',
      state: 'liquid',
      density: 13534,
      specificHeat: '140@20',
      thermalConductivity: 8.54,
      thermalExpansion: 1.81e-4,
      viscosity: 0.0015,
      meltingPoint: -38.8,
      freezingPoint: -38.8,
      boilingPoint: 356.7,
      heatOfFusion: 11300,
      heatOfVaporization: 295000,
    }),
    row({
      id: 'aluminum',
      label: 'Aluminum',
      state: 'solid',
      density: 2700,
      specificHeat: '900@20',
      thermalConductivity: 237,
      thermalExpansion: 2.31e-5,
      viscosity: null,
      meltingPoint: 660.3,
      freezingPoint: 660.3,
      boilingPoint: 2519,
      heatOfFusion: 397000,
      heatOfVaporization: 10900000,
    }),
    row({
      id: 'copper',
      label: 'Copper',
      state: 'solid',
      density: 8960,
      specificHeat: '385@20',
      thermalConductivity: 401,
      thermalExpansion: 1.65e-5,
      viscosity: null,
      meltingPoint: 1084.6,
      freezingPoint: 1084.6,
      boilingPoint: 2562,
      heatOfFusion: 205000,
      heatOfVaporization: 4730000,
    }),
    row({
      id: 'steel',
      label: 'Steel',
      state: 'solid',
      density: 7850,
      specificHeat: '490@20',
      thermalConductivity: 50.2,
      thermalExpansion: 1.2e-5,
      viscosity: null,
      meltingPoint: 1425,
      freezingPoint: 1425,
      boilingPoint: 2862,
      heatOfFusion: 272000,
      heatOfVaporization: 6090000,
    }),
    row({
      id: 'cast-iron',
      label: 'Cast iron',
      state: 'solid',
      density: 7200,
      specificHeat: '460@20',
      thermalConductivity: 52,
      thermalExpansion: 1.1e-5,
      viscosity: null,
      meltingPoint: 1200,
      freezingPoint: 1200,
      boilingPoint: 2862,
      heatOfFusion: 270000,
      heatOfVaporization: 6090000,
    }),
    row({
      id: 'lead',
      label: 'Lead',
      state: 'solid',
      density: 11340,
      specificHeat: '128@20',
      thermalConductivity: 35.3,
      thermalExpansion: 2.9e-5,
      viscosity: null,
      meltingPoint: 327.5,
      freezingPoint: 327.5,
      boilingPoint: 1749,
      heatOfFusion: 23200,
      heatOfVaporization: 866000,
    }),
    row({
      id: 'zinc',
      label: 'Zinc',
      state: 'solid',
      density: 7140,
      specificHeat: '388@20',
      thermalConductivity: 116,
      thermalExpansion: 3.0e-5,
      viscosity: null,
      meltingPoint: 419.5,
      freezingPoint: 419.5,
      boilingPoint: 907,
      heatOfFusion: 112000,
      heatOfVaporization: 1800000,
    }),
    row({
      id: 'tin',
      label: 'Tin',
      state: 'solid',
      density: 7310,
      specificHeat: '228@20',
      thermalConductivity: 66.8,
      thermalExpansion: 2.2e-5,
      viscosity: null,
      meltingPoint: 231.9,
      freezingPoint: 231.9,
      boilingPoint: 2602,
      heatOfFusion: 59000,
      heatOfVaporization: 2900000,
    }),
    row({
      id: 'gold',
      label: 'Gold',
      state: 'solid',
      density: 19300,
      specificHeat: '129@20',
      thermalConductivity: 318,
      thermalExpansion: 1.42e-5,
      viscosity: null,
      meltingPoint: 1064.2,
      freezingPoint: 1064.2,
      boilingPoint: 2856,
      heatOfFusion: 63700,
      heatOfVaporization: 1640000,
    }),
    row({
      id: 'silver',
      label: 'Silver',
      state: 'solid',
      density: 10490,
      specificHeat: '235@20',
      thermalConductivity: 429,
      thermalExpansion: 1.9e-5,
      viscosity: null,
      meltingPoint: 961.8,
      freezingPoint: 961.8,
      boilingPoint: 2162,
      heatOfFusion: 111000,
      heatOfVaporization: 2350000,
    }),
    row({
      id: 'platinum',
      label: 'Platinum',
      state: 'solid',
      density: 21450,
      specificHeat: '133@20',
      thermalConductivity: 71.6,
      thermalExpansion: 8.8e-6,
      viscosity: null,
      meltingPoint: 1768.3,
      freezingPoint: 1768.3,
      boilingPoint: 3825,
      heatOfFusion: 113000,
      heatOfVaporization: 2700000,
    }),
    row({
      id: 'glass',
      label: 'Glass',
      state: 'solid',
      density: 2500,
      specificHeat: '840@20',
      thermalConductivity: 1.05,
      thermalExpansion: 9.0e-6,
      viscosity: null,
      meltingPoint: 1400,
      freezingPoint: 1400,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'concrete',
      label: 'Concrete',
      state: 'solid',
      density: 2400,
      specificHeat: '880@20',
      thermalConductivity: 1.7,
      thermalExpansion: 1.2e-5,
      viscosity: null,
      meltingPoint: null,
      freezingPoint: null,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'wood',
      label: 'Wood',
      state: 'solid',
      density: 700,
      specificHeat: '1700@20',
      thermalConductivity: 0.17,
      thermalExpansion: 5.0e-5,
      viscosity: null,
      meltingPoint: null,
      freezingPoint: null,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'pvc',
      label: 'PVC',
      state: 'solid',
      density: 1380,
      specificHeat: '1000@20',
      thermalConductivity: 0.19,
      thermalExpansion: 7.0e-5,
      viscosity: null,
      meltingPoint: 160,
      freezingPoint: 160,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'polyethylene',
      label: 'Polyethylene',
      state: 'solid',
      density: 950,
      specificHeat: '1900@20',
      thermalConductivity: 0.33,
      thermalExpansion: 2.0e-4,
      viscosity: null,
      meltingPoint: 130,
      freezingPoint: 130,
      boilingPoint: null,
      heatOfFusion: 293000,
      heatOfVaporization: null,
    }),
    row({
      id: 'polystyrene',
      label: 'Polystyrene',
      state: 'solid',
      density: 1050,
      specificHeat: '1300@20',
      thermalConductivity: 0.03,
      thermalExpansion: 7.0e-5,
      viscosity: null,
      meltingPoint: 240,
      freezingPoint: 240,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'rubber',
      label: 'Rubber',
      state: 'solid',
      density: 1100,
      specificHeat: '2000@20',
      thermalConductivity: 0.16,
      thermalExpansion: 2.0e-4,
      viscosity: null,
      meltingPoint: null,
      freezingPoint: null,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
    row({
      id: 'wheat-flour',
      label: 'Flour',
      state: 'solid',
      density: 590,
      specificHeat: '1700@20',
      thermalConductivity: null,
      thermalExpansion: null,
      viscosity: null,
      meltingPoint: null,
      freezingPoint: null,
      boilingPoint: null,
      heatOfFusion: null,
      heatOfVaporization: null,
    }),
  ],
};

/** A material row with its lookup columns parsed. */
export interface Material {
  readonly id: string;
  readonly label: string;
  readonly state: string;
  readonly density: number | null;
  readonly specificHeat: LookupCell | null;
  readonly thermalConductivity: number | null;
  readonly thermalExpansion: number | null;
  readonly viscosity: number | null;
  readonly meltingPoint: number | null;
  readonly freezingPoint: number | null;
  readonly boilingPoint: number | null;
  readonly heatOfFusion: number | null;
  readonly heatOfVaporization: number | null;
}

/** Reads a material row, parsing its lookup columns. */
export function materialFromRow(row: TableRow): Material {
  const densityCell = lookupCellOf(row['density']);
  return {
    id: textCell(row['id']) ?? '',
    label: textCell(row['label']) ?? '',
    state: textCell(row['state']) ?? '',
    density: densityCell?.fallback ?? null,
    specificHeat: lookupCellOf(row['specificHeat']),
    thermalConductivity: numericCell(row['thermalConductivity']),
    thermalExpansion: numericCell(row['thermalExpansion']),
    viscosity: numericCell(row['viscosity']),
    meltingPoint: numericCell(row['meltingPoint']),
    freezingPoint: numericCell(row['freezingPoint']),
    boilingPoint: numericCell(row['boilingPoint']),
    heatOfFusion: numericCell(row['heatOfFusion']),
    heatOfVaporization: numericCell(row['heatOfVaporization']),
  };
}

/** Finds a material by id, or returns undefined. */
export function findMaterial(id: string): Material | undefined {
  const row = findRow(materialsTable, id);
  return row === undefined ? undefined : materialFromRow(row);
}

/** Specific heat at a temperature, or null when the row has no value. */
export function specificHeatAt(
  material: Material,
  temperature: number,
): number | null {
  const cell = material.specificHeat;
  if (cell === null) {
    return null;
  }
  return interpolateLookup(cell, [temperature], [null]);
}

/**
 * Sensible heat absorbed by one kilogram of a material between two
 * temperatures. The specific-heat samples are integrated piecewise, so a row
 * that spans a phase change yields the heat on both sides of it. The sign
 * follows the temperature direction.
 */
export function sensibleHeatBetween(
  material: Material,
  from: number,
  to: number,
): number | null {
  const cell = material.specificHeat;
  if (cell === null) {
    return null;
  }
  const direction = to >= from ? 1 : -1;
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  if (cell.points.length === 0) {
    return cell.fallback === null
      ? null
      : direction * cell.fallback * (high - low);
  }
  const xs = new Set<number>([low, high]);
  for (const point of cell.points) {
    const x = point.coords[0];
    if (typeof x === 'number' && x > low && x < high) {
      xs.add(x);
    }
  }
  const sorted = [...xs].sort((left, right) => left - right);
  let total = 0;
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const x0 = sorted[index]!;
    const x1 = sorted[index + 1]!;
    const y0 = interpolateAt(cell.points, x0);
    const y1 = interpolateAt(cell.points, x1);
    if (y0 === null || y1 === null) {
      return null;
    }
    total += ((y0 + y1) / 2) * (x1 - x0);
  }
  return direction * total;
}

/** True when a temperature range crosses a transition temperature. */
function crosses(transition: number, from: number, to: number): boolean {
  if (from <= to) {
    return from <= transition && to > transition;
  }
  return from >= transition && to < transition;
}

/**
 * Latent heat absorbed by one kilogram of a material when its temperature
 * range crosses a melting/freezing or boiling/condensation point. Uses the
 * melting point when heating and the freezing point when cooling. Returns null
 * when a crossed transition has no latent heat recorded.
 */
export function latentHeatBetween(
  material: Material,
  from: number,
  to: number,
): number | null {
  const heating = to >= from;
  const transitions: readonly (readonly [number | null, number | null])[] = [
    [
      heating ? material.meltingPoint : material.freezingPoint,
      material.heatOfFusion,
    ],
    [material.boilingPoint, material.heatOfVaporization],
  ];
  let total = 0;
  for (const [transition, latent] of transitions) {
    if (transition === null || !crosses(transition, from, to)) {
      continue;
    }
    if (latent === null) {
      return null;
    }
    total += latent;
  }
  return heating ? total : -total;
}
