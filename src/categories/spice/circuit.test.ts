import { describe, expect, it } from 'vitest';
import type { CapacitorModel } from '../../models/capacitor-types.js';
import type { InductorModel } from '../../models/inductor-types.js';
import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_CAPACITOR2_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
  buildNetlist,
} from './circuit.js';
import type { InrushCircuit, TranAnalysis } from './circuit.js';

function fixedInductor(inductance: number): InductorModel {
  return {
    linear: true,
    inductance,
    infinity: inductance,
    saturationCurrent: Number.POSITIVE_INFINITY,
    deratedCurrent: Number.POSITIVE_INFINITY,
    kneeCurrent: Number.POSITIVE_INFINITY,
    knee: 1,
  };
}

function fixedCapacitor(capacitance: number): CapacitorModel {
  return {
    nonlinear: false,
    capacitance,
    saturated: capacitance,
    kneeVoltage: Number.POSITIVE_INFINITY,
    exponent: 1,
  };
}

const circuit: InrushCircuit = {
  sourceVoltage: 10,
  seriesResistance: 2,
  dampingResistance: 4,
  inductor: fixedInductor(1),
  capacitor1: fixedCapacitor(3),
  capacitor2: fixedCapacitor(5),
};

const analysis: TranAnalysis = { step: 0.001, stop: 1 };

describe('buildNetlist', () => {
  it('wires the supply, series elements and both capacitor branches', () => {
    expect(buildNetlist(circuit, analysis)).toBe(
      [
        '* Capacitor inrush transient',
        'V1 1 0 10',
        'VsenseL 1 2 0',
        'L1 2 3 1',
        'R1 3 4 2',
        'C1 4 0 3',
        'R2 4 5 4',
        'C2 5 0 5',
        '.save v(4) i(vsensel) v(5)',
        '.tran 0.001 1 0 0.001 uic',
        '.end',
        '',
      ].join('\n'),
    );
  });

  it('emits a behavioural inductor whose law mirrors the saturation model', () => {
    const netlist = buildNetlist(
      {
        ...circuit,
        inductor: {
          linear: false,
          inductance: 2,
          infinity: 0.5,
          saturationCurrent: 3,
          deratedCurrent: 3,
          kneeCurrent: 3,
          knee: 2,
        },
      },
      analysis,
    );

    expect(netlist).toContain(
      'BL 2 3 V = (0.5 + (2 - 0.5) / (1 + (abs(i(VsenseL)) / 3) ** 2)) * ' +
        'ddt(i(VsenseL))',
    );
  });

  it('emits a behavioural capacitor whose law mirrors the DC-bias model', () => {
    const netlist = buildNetlist(
      {
        ...circuit,
        capacitor1: {
          nonlinear: true,
          capacitance: 3,
          saturated: 1,
          kneeVoltage: 10,
          exponent: 2,
        },
      },
      analysis,
    );

    expect(netlist).toContain(
      'Bcap1 4 0 I = (1 + (3 - 1) / (1 + (abs(v(4)) / 10) ** 2)) * ' +
        'ddt(v(4))',
    );
    expect(netlist).toContain('C2 5 0 5');
  });

  it('uses the vector names the parser and metrics expect', () => {
    expect(VECTOR_TIME).toBe('time');
    expect(VECTOR_CAPACITOR1_VOLTAGE).toBe('v(4)');
    expect(VECTOR_SERIES_CURRENT).toBe('i(vsensel)');
    expect(VECTOR_CAPACITOR2_VOLTAGE).toBe('v(5)');
  });

  it('rejects a value that is not a finite number', () => {
    expect(() =>
      buildNetlist({ ...circuit, sourceVoltage: Number.NaN }, analysis),
    ).toThrow(RangeError);
    expect(() =>
      buildNetlist(circuit, { ...analysis, step: Number.POSITIVE_INFINITY }),
    ).toThrow(RangeError);
  });
});
