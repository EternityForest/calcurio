import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import {
  capacitanceAtVoltage,
  capacitorTypesTable,
  findCapacitorType,
  resolveCapacitor,
} from '../../models/capacitor-types.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { capacitanceAtDcBias } from './capacitance-at-dc-bias.js';

const tables = new TableRegistry([inductorTypesTable, capacitorTypesTable]);

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(capacitanceAtDcBias, tables);
}

/** Fills every input for one type and bias, with a 10 µF, 16 V part. */
function biased(type: string, voltage: string): CalculatorRuntime {
  const rt = runtime();
  rt.setSelection('capacitorType', type);
  rt.setDisplayText('capacitance', '0.00001');
  rt.setDisplayText('voltageRating', '16');
  rt.setDisplayText('biasVoltage', voltage);
  return rt;
}

describe('capacitance at a DC bias', () => {
  it('reports what it still needs before any value is entered', () => {
    const rt = runtime();
    expect(rt.isMissing('biasedCapacitance')).toBe(true);
    expect(rt.missingLabel('biasedCapacitance')).toContain('Rated capacitance');
  });

  it('keeps the rated capacitance for a linear dielectric', () => {
    const rt = biased('c0g-0603', '16');
    expect(rt.state['biasedCapacitance']).toBeCloseTo(1e-5, 18);
  });

  it('matches the DC-bias model for a ceramic', () => {
    const rt = biased('x7r-0805', '16');
    const model = resolveCapacitor(findCapacitorType('x7r-0805')!, 1e-5, 16);
    expect(rt.state['biasedCapacitance']).toBeCloseTo(
      capacitanceAtVoltage(model, 16),
      18,
    );
    expect(rt.state['biasedCapacitance']).toBeLessThan(1e-5);
  });

  it('loses more capacitance at a higher bias', () => {
    expect(biased('x7r-0805', '8').state['biasedCapacitance']).toBeGreaterThan(
      biased('x7r-0805', '16').state['biasedCapacitance'] as number,
    );
  });
});
