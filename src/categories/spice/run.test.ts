import createNgspiceModule from '@o.z/ngspice-wasm';
import { describe, expect, it } from 'vitest';
import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_CAPACITOR2_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
  buildNetlist,
} from './circuit.js';
import { computeMetrics } from './metrics.js';
import { findVector, parseRawFile } from './rawfile.js';
import { runNgspice } from './run.js';

const CIRCUIT = {
  sourceVoltage: 400,
  seriesInductance: 100e-6,
  seriesResistance: 0.5,
  capacitance1: 470e-6,
  dampingResistance: 1,
  capacitance2: 100e-6,
};

const ANALYSIS = { step: 10e-6, stop: 10e-3 };

/**
 * End-to-end check against the real ngspice build. It is intentionally slow
 * because it instantiates the WebAssembly module and runs a full transient.
 */
describe('runNgspice', () => {
  it('simulates the inrush circuit into a physically sensible result', async () => {
    const bytes = await runNgspice(
      buildNetlist(CIRCUIT, ANALYSIS),
      createNgspiceModule,
    );
    const data = parseRawFile(bytes);

    expect(data.names).toHaveLength(4);
    expect(data.names[0]).toBe(VECTOR_TIME);
    expect(data.names).toEqual(
      expect.arrayContaining([
        VECTOR_CAPACITOR1_VOLTAGE,
        VECTOR_SERIES_CURRENT,
        VECTOR_CAPACITOR2_VOLTAGE,
      ]),
    );
    expect(data.pointCount).toBeGreaterThan(100);

    const capacitor1 = findVector(data, VECTOR_CAPACITOR1_VOLTAGE)!;
    const capacitor2 = findVector(data, VECTOR_CAPACITOR2_VOLTAGE)!;

    // Both capacitors settle to the supply voltage within one percent.
    expect(Math.abs(capacitor1.at(-1)! - 400)).toBeLessThan(4);
    expect(Math.abs(capacitor2.at(-1)! - 400)).toBeLessThan(4);

    const metrics = computeMetrics(data, {
      seriesResistance: CIRCUIT.seriesResistance,
      dampingResistance: CIRCUIT.dampingResistance,
    });

    // The lightly damped load capacitor overshoots its final value.
    expect(metrics.peakCapacitor1Voltage).toBeGreaterThan(410);
    expect(metrics.peakSeriesCurrent).toBeGreaterThan(0);

    // A constant supply delivers (C1 + C2) * V of charge, so it supplies
    // twice the energy stored at the end; the other half is burnt in the
    // resistors regardless of their values.
    const stored =
      0.5 * (CIRCUIT.capacitance1 + CIRCUIT.capacitance2) * 400 ** 2;
    const dissipated =
      metrics.energySeriesResistance + metrics.energyDampingResistance;
    expect(dissipated).toBeGreaterThan(stored * 0.95);
    expect(dissipated).toBeLessThan(stored * 1.05);
  }, 120_000);
});
