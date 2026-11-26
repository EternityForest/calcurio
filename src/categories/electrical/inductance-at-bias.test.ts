import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import {
  findInductorType,
  inductanceAtCurrent,
  inductorTypesTable,
  resolveInductor,
} from '../../models/inductor-types.js';
import { inductanceAtBias } from './inductance-at-bias.js';

const tables = new TableRegistry([inductorTypesTable, capacitorTypesTable]);

function runtime(): CalculatorRuntime {
  return new CalculatorRuntime(inductanceAtBias, tables);
}

/** Fills every input with a linear air-core part at a given bias. */
function airCore(bias: string): CalculatorRuntime {
  const rt = runtime();
  rt.setSelection('inductorType', 'air');
  rt.setDisplayText('inductance', '0.0001');
  rt.setDisplayText('saturationCurrent', '2');
  rt.setDisplayText('biasCurrent', bias);
  return rt;
}

describe('inductance at a current bias', () => {
  it('defaults the temperature to 25 °C', () => {
    expect(runtime().state['temperature']).toBe(25);
  });

  it('reports what it still needs before any value is entered', () => {
    const rt = runtime();
    expect(rt.isMissing('biasedInductance')).toBe(true);
    expect(rt.missingLabel('biasedInductance')).toContain('Rated inductance');
  });

  it('keeps the rated inductance for a part that does not saturate', () => {
    expect(airCore('5').state['biasedInductance']).toBeCloseTo(1e-4, 15);
  });

  it('matches the saturation model at a high bias', () => {
    const rt = runtime();
    rt.setSelection('inductorType', 'iron-powder');
    rt.setDisplayText('inductance', '0.0001');
    rt.setDisplayText('saturationCurrent', '2');
    rt.setDisplayText('biasCurrent', '2');

    const model = resolveInductor(
      findInductorType('iron-powder')!,
      1e-4,
      2,
      25,
    );
    expect(rt.state['biasedInductance']).toBeCloseTo(
      inductanceAtCurrent(model, 2),
      15,
    );
    expect(rt.state['biasedInductance']).toBeLessThan(1e-4);
  });

  it('drops further as the part is driven harder', () => {
    const low = airCore('1');
    low.setSelection('inductorType', 'iron-powder');
    const high = airCore('1');
    high.setSelection('inductorType', 'iron-powder');
    high.setDisplayText('biasCurrent', '4');

    expect(low.state['biasedInductance']).toBeGreaterThan(
      high.state['biasedInductance'] as number,
    );
  });

  it('saturates sooner when the part runs hot', () => {
    const cold = airCore('3');
    cold.setSelection('inductorType', 'ferrite-drum');
    const hot = airCore('3');
    hot.setSelection('inductorType', 'ferrite-drum');
    hot.setDisplayText('temperature', '100');

    expect(hot.state['biasedInductance']).toBeLessThan(
      cold.state['biasedInductance'] as number,
    );
  });
});
