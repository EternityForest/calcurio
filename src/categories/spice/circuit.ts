/**
 * Pure helpers that turn an inrush circuit description into an ngspice netlist.
 * No simulation runs here, so the netlist can be inspected and tested. A part
 * that does not saturate is emitted as a plain `L` or `C`; a nonlinear one
 * becomes a behavioural element whose law matches the models in `src/models`.
 */

import type { CapacitorModel } from '../../models/capacitor-types.js';
import type { InductorModel } from '../../models/inductor-types.js';

/** Element values for a capacitor inrush circuit. */
export interface InrushCircuit {
  /** Supply voltage in volts. */
  readonly sourceVoltage: number;
  /** Series resistance in ohms. */
  readonly seriesResistance: number;
  /** Resistance in series with the second capacitor, in ohms. */
  readonly dampingResistance: number;
  /** Inductance in series with the supply, in henries. */
  readonly inductor: InductorModel;
  /** Capacitance directly across the load. */
  readonly capacitor1: CapacitorModel;
  /** Second capacitance, behind the damping resistance. */
  readonly capacitor2: CapacitorModel;
}

/** Transient analysis settings. */
export interface TranAnalysis {
  /** Requested output step, in seconds. */
  readonly step: number;
  /** Simulation length, in seconds. */
  readonly stop: number;
}

/** Node carrying the load capacitor (capacitor 1) voltage. */
const NODE_LOAD = 4;
/** Node carrying the second capacitor voltage. */
const NODE_DAMPING = 5;

/** Senses the series current so the inductor law can read it. */
const SERIES_SENSE = 'VsenseL';

/**
 * Loosened solver tolerances. A saturating part only converges at a usable step
 * with these; a fully linear circuit keeps ngspice's defaults for accuracy.
 */
const LOOSE_OPTIONS =
  '.options reltol=0.01 abstol=1e-6 vntol=1e-4 itl4=200';

/** Rawfile vector names, lowercased to match ngspice output. */
export const VECTOR_TIME = 'time';
export const VECTOR_CAPACITOR1_VOLTAGE = `v(${NODE_LOAD})`;
export const VECTOR_SERIES_CURRENT = `i(${SERIES_SENSE.toLowerCase()})`;
export const VECTOR_CAPACITOR2_VOLTAGE = `v(${NODE_DAMPING})`;

/**
 * Builds a batch-mode netlist for the inrush circuit. The supply feeds the
 * series inductor and resistance; `C1` sits across the load, and `R2` with
 * `C2` forms a second branch in parallel with it. The inductor is sensed by a
 * zero-volt source so the series current is available under a stable vector
 * name.
 */
export function buildNetlist(
  circuit: InrushCircuit,
  analysis: TranAnalysis,
): string {
  const step = spiceNumber(analysis.step);
  return [
    '* Capacitor inrush transient',
    `V1 1 0 ${spiceNumber(circuit.sourceVoltage)}`,
    `${SERIES_SENSE} 1 2 0`,
    inductorElement(circuit.inductor),
    `R1 3 ${NODE_LOAD} ${spiceNumber(circuit.seriesResistance)}`,
    ...capacitorElement('1', NODE_LOAD, circuit.capacitor1),
    `R2 ${NODE_LOAD} ${NODE_DAMPING} ${spiceNumber(circuit.dampingResistance)}`,
    ...capacitorElement('2', NODE_DAMPING, circuit.capacitor2),
    `.save ${VECTOR_CAPACITOR1_VOLTAGE} ${VECTOR_SERIES_CURRENT} ` +
      `${VECTOR_CAPACITOR2_VOLTAGE}`,
    // `uic` starts every node at 0 V instead of solving a DC operating point,
    // so the result is a genuine inrush. Repeating the step as `tmax` forces
    // ngspice to emit evenly spaced samples.
    `.tran ${step} ${spiceNumber(analysis.stop)} 0 ${step} uic`,
    ...(needsLooseTolerances(circuit) ? [LOOSE_OPTIONS] : []),
    '.end',
    '',
  ].join('\n');
}

/**
 * True when any part is nonlinear. Such circuits only converge with loosened
 * tolerances (see `LOOSE_OPTIONS`).
 */
function needsLooseTolerances(circuit: InrushCircuit): boolean {
  return (
    !circuit.inductor.linear ||
    circuit.capacitor1.nonlinear ||
    circuit.capacitor2.nonlinear
  );
}

/**
 * The series inductor line. A fixed part is a plain `L`, which integrates
 * exactly; a saturating part is a native `L` whose `L = <expr>` value mirrors
 * `inductanceAtCurrent` in `src/models/inductor-types.ts`. The zero-volt
 * `VsenseL` source in front of either form senses the series current under a
 * stable vector name.
 */
function inductorElement(model: InductorModel): string {
  if (model.linear) {
    return `L1 2 3 ${spiceNumber(model.inductance)}`;
  }
  // A current-dependent inductance is a native `L` carrying an `L = <expr>`
  // value: ngspice reads the law and integrates it, which converges where a
  // behavioural `V = L(i) * ddt(i)` source does not.
  const current = `i(${SERIES_SENSE})`;
  return (
    `L1 2 3 L = (` +
    `${spiceNumber(model.infinity)} + ` +
    `(${spiceNumber(model.inductance)} - ${spiceNumber(model.infinity)}) / ` +
    `(1 + (abs(${current}) / ${spiceNumber(model.kneeCurrent)}) ** ` +
    `${spiceNumber(model.knee)}))`
  );
}

/**
 * The capacitor element lines. A fixed part is a plain capacitor; a biased part
 * carries a charge expression whose derivative mirrors
 * `capacitanceAtVoltage` in `src/models/capacitor-types.ts`.
 */
function capacitorElement(
  suffix: string,
  node: number,
  model: CapacitorModel,
): string[] {
  if (!model.nonlinear) {
    return [`C${suffix} ${node} 0 ${spiceNumber(model.capacitance)}`];
  }
  // ngspice integrates a nonlinear capacitor from its charge, so give it the
  // closed-form charge rather than a current source. `atan` is the exact
  // antiderivative of the n = 2 DC-bias law; it is smooth and, unlike a
  // `C = <expr>` or `I = C(V) * ddt(v)` form, converges at the default step.
  const voltage = `v(${node})`;
  return [
    `C${suffix} ${node} 0 Q = (` +
      `${spiceNumber(model.saturated)} * ${voltage} + ` +
      `(${spiceNumber(model.capacitance)} - ${spiceNumber(model.saturated)}) * ` +
      `${spiceNumber(model.kneeVoltage)} * atan(${voltage} / ` +
      `${spiceNumber(model.kneeVoltage)}))`,
  ];
}

/**
 * Formats a value the way ngspice expects. JavaScript's shortest round-trip
 * output already uses plain or exponent notation that SPICE parses.
 */
function spiceNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot put ${value} in a netlist.`);
  }
  return String(value);
}
