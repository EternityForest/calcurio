/**
 * Turns the vectors of an inrush simulation into the numbers the calculator
 * shows. Everything integrates over the simulated time vector, so uneven
 * sample spacing from ngspice is handled correctly.
 */

import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_CAPACITOR2_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
} from './circuit.js';
import { findVector } from './rawfile.js';
import type { RawFile } from './rawfile.js';

/** Values reported for one inrush run. */
export interface InrushMetrics {
  /** Largest magnitude of the load capacitor voltage, in volts. */
  readonly peakCapacitor1Voltage: number;
  /** Largest magnitude of the current through the series branch, in amps. */
  readonly peakSeriesCurrent: number;
  /** Energy dissipated in the series resistance, in joules. */
  readonly energySeriesResistance: number;
  /** Energy dissipated in the damping resistance, in joules. */
  readonly energyDampingResistance: number;
}

/** Resistor values needed to convert voltages and currents into power. */
export interface MetricContext {
  readonly seriesResistance: number;
  readonly dampingResistance: number;
}

/** Computes every reported value from one simulation result. */
export function computeMetrics(
  data: RawFile,
  context: MetricContext,
): InrushMetrics {
  const time = requireVector(data, VECTOR_TIME);
  const capacitor1 = requireVector(data, VECTOR_CAPACITOR1_VOLTAGE);
  const current = requireVector(data, VECTOR_SERIES_CURRENT);
  const capacitor2 = requireVector(data, VECTOR_CAPACITOR2_VOLTAGE);

  const seriesPower = new Float64Array(current.length);
  const dampingPower = new Float64Array(current.length);
  for (let index = 0; index < current.length; index += 1) {
    const amps = current[index]!;
    seriesPower[index] = amps * amps * context.seriesResistance;
    const volts = capacitor1[index]! - capacitor2[index]!;
    dampingPower[index] = (volts * volts) / context.dampingResistance;
  }

  return {
    peakCapacitor1Voltage: peakMagnitude(capacitor1),
    peakSeriesCurrent: peakMagnitude(current),
    energySeriesResistance: integrate(seriesPower, time),
    energyDampingResistance: integrate(dampingPower, time),
  };
}

/** Largest absolute sample in `values`, or 0 when it is empty. */
export function peakMagnitude(values: Float64Array): number {
  let peak = 0;
  for (const value of values) {
    const magnitude = Math.abs(value);
    if (magnitude > peak) {
      peak = magnitude;
    }
  }
  return peak;
}

/**
 * Trapezoidal integral of `values` over `time`. Both vectors must be the same
 * length; a shorter `time` simply stops the sum early.
 */
export function integrate(values: Float64Array, time: Float64Array): number {
  const count = Math.min(values.length, time.length);
  let total = 0;
  for (let index = 1; index < count; index += 1) {
    const span = time[index]! - time[index - 1]!;
    total += 0.5 * (values[index]! + values[index - 1]!) * span;
  }
  return total;
}

/** Fetches a required vector, blaming the simulation when it is missing. */
function requireVector(data: RawFile, name: string): Float64Array {
  const vector = findVector(data, name);
  if (vector === undefined) {
    throw new Error(`The simulation result has no "${name}" vector.`);
  }
  return vector;
}
