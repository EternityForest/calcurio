import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

interface FilterResult {
  /** Time constant in seconds, or null when the circuit has no decay. */
  readonly tau: number | null;
  /** -3 dB frequency in hertz. */
  readonly cutoff: number;
}

/**
 * High-pass: series capacitance, shunt resistance and inductance in series,
 * with the output taken across the shunt branch.
 * H(s) = (sRC + s²LC) / (1 + sRC + s²LC), so the natural frequency is
 * ω0 = 1/√(LC) and the damping ratio is ζ = (R/2)·√(C/L). Zero inductance
 * gives the first-order RC case, and zero resistance gives the undamped LC
 * case.
 */
function analyzeHighPass(
  r: number,
  l: number,
  c: number,
): FilterResult | null {
  if (c <= 0) {
    return null;
  }
  if (l <= 0) {
    if (r <= 0) {
      return null;
    }
    const tau = r * c;
    return { tau, cutoff: 1 / (2 * Math.PI * tau) };
  }
  const omega0 = 1 / Math.sqrt(l * c);
  const zeta = (r / 2) * Math.sqrt(c / l);
  const a = 1 + 2 * zeta * zeta;
  const cutoff =
    (omega0 * Math.sqrt(Math.sqrt(a * a + 1) - a)) / (2 * Math.PI);
  return { tau: r > 0 ? (2 * l) / r : null, cutoff };
}

function readComponents(
  state: Readonly<CalcState>,
): { r: number; l: number; c: number } | ReturnType<typeof missing> {
  const r = valueOf(state, 'resistance');
  const l = valueOf(state, 'inductance');
  const c = valueOf(state, 'capacitance');
  if (r === null || l === null || c === null) {
    return missing([
      ...(r === null ? ['resistance'] : []),
      ...(l === null ? ['inductance'] : []),
      ...(c === null ? ['capacitance'] : []),
    ]);
  }
  return { r, l, c };
}

/**
 * High-pass RLC filter. Set any component to zero to simplify the circuit:
 * zero inductance gives an RC filter, and zero resistance gives an LC filter.
 * Reports the time constant and the -3 dB frequency.
 */
export const highPassRlc: CalculatorDefinition = {
  id: 'high-pass-rlc',
  title: 'High-pass RLC filter',
  description:
    'Second-order high-pass: series C, shunt R and L in series, output ' +
    'across the shunt branch. Set L to 0 for an RC filter or R to 0 for an ' +
    'LC filter. Reports the time constant and the -3 dB frequency.',
  variables: [
    {
      name: 'resistance',
      label: 'Resistance',
      unit: 'ohm',
      default: 1000,
      description: 'Shunt resistance. Set to 0 to omit it.',
      validate: (state) => {
        const value = valueOf(state, 'resistance');
        return value !== null && value < 0
          ? 'Resistance must not be negative.'
          : undefined;
      },
    },
    {
      name: 'inductance',
      label: 'Inductance',
      unit: 'H',
      default: 0,
      description: 'Shunt inductance. Set to 0 to omit it (RC filter).',
      validate: (state) => {
        const value = valueOf(state, 'inductance');
        return value !== null && value < 0
          ? 'Inductance must not be negative.'
          : undefined;
      },
    },
    {
      name: 'capacitance',
      label: 'Capacitance',
      unit: 'F',
      default: 1e-6,
      defaultDisplayUnit: 'uF',
      description: 'Series capacitance.',
      validate: (state) => {
        const value = valueOf(state, 'capacitance');
        return value !== null && value <= 0
          ? 'Capacitance must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'timeConstant',
      label: 'Time constant',
      unit: 's',
      editable: false,
      description:
        'Envelope decay time. R·C for an RC filter, 2L/R for a damped RLC ' +
        'filter, and undefined for a lossless LC filter.',
      computable: (state) => {
        const components = readComponents(state);
        if ('needs' in components) {
          return components;
        }
        const result = analyzeHighPass(
          components.r,
          components.l,
          components.c,
        );
        if (result === null || result.tau === null) {
          return missing([]);
        }
        return result.tau;
      },
    },
    {
      name: 'cutoffFrequency',
      label: '-3 dB frequency',
      unit: 'Hz',
      editable: false,
      description: 'Frequency where the output falls to 1/√2 of its passband.',
      computable: (state) => {
        const components = readComponents(state);
        if ('needs' in components) {
          return components;
        }
        const result = analyzeHighPass(
          components.r,
          components.l,
          components.c,
        );
        return result === null ? missing([]) : result.cutoff;
      },
    },
  ],
  testCases: [
    { resistance: 1000, inductance: 0, capacitance: 1e-6, timeConstant: 0.001, cutoffFrequency: 159.15494309189532 },
    { resistance: 0, inductance: 1e-3, capacitance: 1e-6, timeConstant: null, cutoffFrequency: 3239.1591663713943 },
    { resistance: 100, inductance: 1e-3, capacitance: 1e-6, timeConstant: 2e-5, cutoffFrequency: 1447.8948106691416 },
    { resistance: 10, inductance: 1e-3, capacitance: 1e-6, timeConstant: 2e-4, cutoffFrequency: 3183.098861837906 },
  ],
};
