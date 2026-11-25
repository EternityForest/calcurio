/**
 * Pure helpers that turn an inrush circuit description into an ngspice netlist.
 * No simulation runs here, so the netlist can be inspected and tested.
 */

/** Element values for a capacitor inrush circuit. */
export interface InrushCircuit {
  /** Supply voltage in volts. */
  readonly sourceVoltage: number;
  /** Inductance in series with the supply, in henries. */
  readonly seriesInductance: number;
  /** Resistance in series with the supply, in ohms. */
  readonly seriesResistance: number;
  /** Capacitance directly across the load, in farads. */
  readonly capacitance1: number;
  /** Resistance in series with the second capacitor, in ohms. */
  readonly dampingResistance: number;
  /** Second capacitance, in farads. */
  readonly capacitance2: number;
}

/** Transient analysis settings. */
export interface TranAnalysis {
  /** Requested output step, in seconds. */
  readonly step: number;
  /** Simulation length, in seconds. */
  readonly stop: number;
}

/** Rawfile vector names, lowercased to match ngspice output. */
export const VECTOR_TIME = 'time';
export const VECTOR_CAPACITOR1_VOLTAGE = 'v(3)';
export const VECTOR_SERIES_CURRENT = 'i(l1)';
export const VECTOR_CAPACITOR2_VOLTAGE = 'v(4)';

/**
 * Builds a batch-mode netlist for the inrush circuit. The supply feeds `L1`
 * and `R1` in series; `C1` sits across the load, and `R2` with `C2` forms a
 * second branch in parallel with it. Node 3 is the load node, node 4 the
 * midpoint of the damping branch.
 */
export function buildNetlist(
  circuit: InrushCircuit,
  analysis: TranAnalysis,
): string {
  const step = spiceNumber(analysis.step);
  return [
    '* Capacitor inrush transient',
    `V1 1 0 ${spiceNumber(circuit.sourceVoltage)}`,
    `L1 1 2 ${spiceNumber(circuit.seriesInductance)}`,
    `R1 2 3 ${spiceNumber(circuit.seriesResistance)}`,
    `C1 3 0 ${spiceNumber(circuit.capacitance1)}`,
    `R2 3 4 ${spiceNumber(circuit.dampingResistance)}`,
    `C2 4 0 ${spiceNumber(circuit.capacitance2)}`,
    `.save ${VECTOR_CAPACITOR1_VOLTAGE} ${VECTOR_SERIES_CURRENT} ` +
      `${VECTOR_CAPACITOR2_VOLTAGE}`,
    // `uic` starts every capacitor at 0 V instead of solving a DC operating
    // point, so the result is a genuine inrush. Repeating the step as `tmax`
    // forces ngspice to emit evenly spaced samples.
    `.tran ${step} ${spiceNumber(analysis.stop)} 0 ${step} uic`,
    '.end',
    '',
  ].join('\n');
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
