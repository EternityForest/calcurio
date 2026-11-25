import { describe, expect, it } from 'vitest';
import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_CAPACITOR2_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
  buildNetlist,
} from './circuit.js';
import type { InrushCircuit, TranAnalysis } from './circuit.js';

const circuit: InrushCircuit = {
  sourceVoltage: 10,
  seriesInductance: 1,
  seriesResistance: 2,
  capacitance1: 3,
  dampingResistance: 4,
  capacitance2: 5,
};

const analysis: TranAnalysis = { step: 0.001, stop: 1 };

describe('buildNetlist', () => {
  it('wires the supply, series elements and both capacitor branches', () => {
    expect(buildNetlist(circuit, analysis)).toBe(
      [
        '* Capacitor inrush transient',
        'V1 1 0 10',
        'L1 1 2 1',
        'R1 2 3 2',
        'C1 3 0 3',
        'R2 3 4 4',
        'C2 4 0 5',
        '.save v(3) i(l1) v(4)',
        '.tran 0.001 1 0 0.001 uic',
        '.end',
        '',
      ].join('\n'),
    );
  });

  it('uses the vector names the parser and metrics expect', () => {
    expect(VECTOR_TIME).toBe('time');
    expect(VECTOR_CAPACITOR1_VOLTAGE).toBe('v(3)');
    expect(VECTOR_SERIES_CURRENT).toBe('i(l1)');
    expect(VECTOR_CAPACITOR2_VOLTAGE).toBe('v(4)');
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
