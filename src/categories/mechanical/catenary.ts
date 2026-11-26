import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Resolved geometry of one cable hanging under its weight and centre load. */
interface CatenaryGeometry {
  /** Horizontal component of the tension (N), constant along the cable. */
  readonly horizontal: number;
  /** Vertical component of the tension at an anchor (N). */
  readonly vertical: number;
  /** Tension at an anchor (N), the vector sum of the two components. */
  readonly force: number;
  /** Total length of the cable along its curve (m). */
  readonly length: number;
}

/**
 * The shape ratio (span to sag) for a catenary carrying a centre point load.
 * For horizontal tension H, total load Q (rope weight) and centre load P the
 * sag-to-half-span ratio is
 *
 *     (2·D)/W = (√(1+n²) − √(1+k²)) / (asinh n − asinh k),
 *
 * with n = (P+Q)/(2H) and k = P/(2H). The ratio falls smoothly from infinity
 * to zero as H rises, so it can be inverted by bisection.
 */
function sagRatio(horizontal: number, total: number, center: number): number {
  const n = total / (2 * horizontal);
  const k = center / (2 * horizontal);
  const rootN = Math.sqrt(1 + n * n);
  const rootK = Math.sqrt(1 + k * k);
  const numerator = ((n - k) * (n + k)) / (rootN + rootK);
  const denominator = Math.log((n + rootN) / (k + rootK));
  return numerator / denominator;
}

/** Horizontal tension (N) that gives the requested sag at the given span. */
function horizontalTension(
  width: number,
  droop: number,
  centerWeight: number,
  ropeWeight: number,
): number {
  const target = (2 * droop) / width;
  const total = centerWeight + ropeWeight;
  const ratio = (horizontal: number): number =>
    sagRatio(horizontal, total, centerWeight);

  let low = 1e-9;
  let high = 1;
  while (ratio(high) > target) {
    high *= 2;
  }
  while (ratio(low) < target) {
    low *= 0.5;
  }
  for (let round = 0; round < 200; round += 1) {
    const middle = 0.5 * (low + high);
    if (ratio(middle) > target) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return 0.5 * (low + high);
}

/**
 * Tension and arc length for a cable hung between two anchors at the same
 * height. The hanging cable is a true catenary, not the small-sag parabola.
 * A centre load bends the two halves into distinct catenary segments, and the
 * arc length follows from the weight per unit length, L = Q·a/H with a the
 * catenary's own scale. A weightless cable reduces to the ordinary triangle
 * of forces.
 */
function solveCatenary(
  width: number,
  droop: number,
  centerWeight: number,
  ropeWeight: number,
): CatenaryGeometry {
  const vertical = (centerWeight + ropeWeight) / 2;
  if (ropeWeight <= 0) {
    const horizontal = (centerWeight * width) / (4 * droop);
    const length = 2 * Math.hypot(width / 2, droop);
    return {
      horizontal,
      vertical,
      force: Math.hypot(horizontal, vertical),
      length,
    };
  }
  const horizontal = horizontalTension(
    width,
    droop,
    centerWeight,
    ropeWeight,
  );
  const n = (centerWeight + ropeWeight) / (2 * horizontal);
  const k = centerWeight / (2 * horizontal);
  const scale = width / (2 * (Math.asinh(n) - Math.asinh(k)));
  return {
    horizontal,
    vertical,
    force: Math.hypot(horizontal, vertical),
    length: (scale * ropeWeight) / horizontal,
  };
}

/** Shared guard: both outputs need the same four positive inputs. */
function geometryFrom(
  state: Readonly<CalcState>,
): CatenaryGeometry | ReturnType<typeof missing> {
  const width = valueOf(state, 'width');
  const droop = valueOf(state, 'droop');
  const centerWeight = valueOf(state, 'centerWeight');
  const ropeWeight = valueOf(state, 'ropeWeight');
  if (
    width === null ||
    droop === null ||
    centerWeight === null ||
    ropeWeight === null
  ) {
    return missing([
      ...(width === null ? ['width'] : []),
      ...(droop === null ? ['droop'] : []),
      ...(centerWeight === null ? ['centerWeight'] : []),
      ...(ropeWeight === null ? ['ropeWeight'] : []),
    ]);
  }
  if (width <= 0 || droop <= 0) {
    return missing([]);
  }
  return solveCatenary(width, droop, centerWeight, ropeWeight);
}

/**
 * Tension at each anchor and the total length of a cable that sags between two
 * anchors under its own weight plus an optional load hung at midspan. The
 * hanging curve is the true catenary, so the result holds for deep as well as
 * shallow sag; the horizontal tension is the one that reproduces the given
 * droop, and the vertical reaction carries half the total weight.
 */
export const catenary: CalculatorDefinition = {
  id: 'catenary',
  title: 'Catenary (chain curve)',
  description:
    'Force at each anchor and the total length along the curve of a cable ' +
    'that sags between two points under its own weight plus a load hung at ' +
    'the centre. Uses the true catenary shape.',
  variables: [
    {
      name: 'width',
      label: 'Horizontal width',
      unit: 'm',
      description: 'Horizontal distance between the two anchors.',
      validate: (state) => {
        const width = valueOf(state, 'width');
        return width !== null && width <= 0
          ? 'Width must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'droop',
      label: 'Droop',
      unit: 'm',
      description: 'Vertical sag of the cable at the centre.',
      validate: (state) => {
        const droop = valueOf(state, 'droop');
        return droop !== null && droop <= 0
          ? 'Droop must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'centerWeight',
      label: 'Weight at centre',
      unit: 'N',
      default: 0,
      description: 'Load hung at the midpoint of the span.',
    },
    {
      name: 'ropeWeight',
      label: 'Weight of chain/rope',
      unit: 'N',
      description: 'Total weight of the chain or rope hanging between anchors.',
    },
    {
      name: 'forcePerAnchor',
      label: 'Force per anchor',
      unit: 'N',
      editable: false,
      description: 'Tension the cable pulls on each anchor with.',
      computable: (state) => {
        const geometry = geometryFrom(state);
        return 'force' in geometry ? geometry.force : geometry;
      },
    },
    {
      name: 'length',
      label: 'Chain length',
      unit: 'm',
      editable: false,
      description: 'Total length of the chain or rope along its curve.',
      computable: (state) => {
        const geometry = geometryFrom(state);
        return 'length' in geometry ? geometry.length : geometry;
      },
    },
  ],
  testCases: [
    {
      width: 10,
      droop: 1,
      centerWeight: 100,
      ropeWeight: 50,
      forcePerAnchor: 321.2181871224574,
      length: 10.200554881818187,
    },
    {
      width: 20,
      droop: 2,
      centerWeight: 0,
      ropeWeight: 100,
      forcePerAnchor: 133.1457654385469,
      length: 20.52373736257518,
    },
    {
      width: 30,
      droop: 3,
      centerWeight: 500,
      ropeWeight: 200,
      forcePerAnchor: 1539.7720005130748,
      length: 30.599357461549904,
    },
  ],
};
