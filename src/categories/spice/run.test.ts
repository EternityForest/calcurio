import createNgspiceModule from '@o.z/ngspice-wasm';
import { describe, expect, it } from 'vitest';
import {
  findCapacitorType,
  resolveCapacitor,
} from '../../models/capacitor-types.js';
import {
  findInductorType,
  resolveInductor,
} from '../../models/inductor-types.js';
import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_CAPACITOR2_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
  buildNetlist,
} from './circuit.js';
import type { InrushCircuit } from './circuit.js';
import { computeMetrics } from './metrics.js';
import { findVector, parseRawFile } from './rawfile.js';
import { runNgspice } from './run.js';

/** A linear circuit: an air-core inductor and C0G capacitors. */
function linearCircuit(): InrushCircuit {
  const inductor = resolveInductor(findInductorType('air')!, 100e-6, 10, 25);
  const capacitor1 = resolveCapacitor(
    findCapacitorType('c0g-0603')!,
    470e-6,
    50,
  );
  const capacitor2 = resolveCapacitor(
    findCapacitorType('c0g-0603')!,
    100e-6,
    50,
  );
  return {
    sourceVoltage: 400,
    seriesResistance: 0.5,
    dampingResistance: 1,
    inductor,
    capacitor1,
    capacitor2,
  };
}

/** A saturating inductor and DC-biased ceramic capacitors. */
function nonlinearCircuit(): InrushCircuit {
  const inductor = resolveInductor(
    findInductorType('ferrite-drum')!,
    100e-6,
    8,
    25,
  );
  const capacitor1 = resolveCapacitor(
    findCapacitorType('x7r-0805')!,
    10e-6,
    16,
  );
  const capacitor2 = resolveCapacitor(findCapacitorType('x7r-0603')!, 1e-6, 16);
  return {
    sourceVoltage: 12,
    seriesResistance: 0.2,
    dampingResistance: 0.5,
    inductor,
    capacitor1,
    capacitor2,
  };
}

/**
 * End-to-end check against the real ngspice build. It is intentionally slow
 * because it instantiates the WebAssembly module and runs a full transient.
 */
describe('runNgspice', () => {
  it('simulates the linear inrush circuit into a physically sensible result', async () => {
    const analysis = { step: 10e-6, stop: 10e-3 };
    const bytes = await runNgspice(
      buildNetlist(linearCircuit(), analysis),
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
      seriesResistance: 0.5,
      dampingResistance: 1,
    });

    // The lightly damped load capacitor overshoots its final value.
    expect(metrics.peakCapacitor1Voltage).toBeGreaterThan(410);
    expect(metrics.peakSeriesCurrent).toBeGreaterThan(0);

    // A constant supply delivers (C1 + C2) * V of charge, so it supplies
    // twice the energy stored at the end; the other half is burnt in the
    // resistors regardless of their values.
    const stored = 0.5 * (470e-6 + 100e-6) * 400 ** 2;
    const dissipated =
      metrics.energySeriesResistance + metrics.energyDampingResistance;
    expect(dissipated).toBeGreaterThan(stored * 0.95);
    expect(dissipated).toBeLessThan(stored * 1.05);
  }, 120_000);

  it('simulates a nonlinear circuit with a saturating inductor and biased capacitors', async () => {
    const circuit = nonlinearCircuit();
    expect(circuit.inductor.linear).toBe(false);
    expect(circuit.capacitor1.nonlinear).toBe(true);

    // The lightly damped LC circuit rings for several milliseconds, so the
    // window has to outlast the settling or the final sample is mid-oscillation.
    const bytes = await runNgspice(
      buildNetlist(circuit, { step: 10e-6, stop: 10e-3 }),
      createNgspiceModule,
    );
    const data = parseRawFile(bytes);
    const capacitor1 = findVector(data, VECTOR_CAPACITOR1_VOLTAGE)!;
    const current = findVector(data, VECTOR_SERIES_CURRENT)!;

    // The transient settles on the supply voltage and every sample is finite,
    // which is all this smoke test needs from the saturation and bias laws.
    expect(capacitor1.at(-1)!).toBeCloseTo(12, 0);
    for (let index = 0; index < current.length; index += 1) {
      expect(Number.isFinite(capacitor1[index]!)).toBe(true);
      expect(Number.isFinite(current[index]!)).toBe(true);
    }
  }, 120_000);

  it('reports the simulator diagnostic when ngspice aborts', async () => {
    // A behavioural inductor in a stiff linear LC circuit makes ngspice abort
    // with "TRAN: Timestep too small", which surfaces as a non-zero exit. The
    // thrown value is an opaque object, so the message must carry the log.
    const stiff = [
      '* stiff behavioural inductor',
      'V1 1 0 400',
      'VsenseL 1 2 0',
      'BL 2 3 V = (100e-6) * ddt(i(VsenseL))',
      'R1 3 4 0.001',
      'C1 4 0 470u',
      '.save v(4) i(vsensel)',
      '.tran 100n 100m 0 100n uic',
      '.end',
      '',
    ].join('\n');

    let failure: unknown;
    try {
      await runNgspice(stiff, createNgspiceModule);
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain('The simulation failed');
    expect(message).toContain('ExitStatus');
    expect(message).toContain('Timestep too small');
    expect(message).not.toContain('[object Object]');
  }, 120_000);
});
