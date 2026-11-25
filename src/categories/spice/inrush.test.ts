import { describe, expect, it } from 'vitest';
import type { ComputeStateContext } from '../../framework/output.js';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { isTableSelectVariable } from '../../framework/types.js';
import { isUnchanged } from '../../framework/unchanged.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { inrushTransient } from './inrush.js';

const tables = new TableRegistry([inductorTypesTable, capacitorTypesTable]);

/** A context that only records that it was asked to run. */
function context(): ComputeStateContext {
  return { signal: new AbortController().signal, display: () => {} };
}

describe('inrush transient calculator', () => {
  it('has a stable identity and a state-level solver', () => {
    expect(inrushTransient.id).toBe('inrush-transient');
    expect(inrushTransient.title).toBe('Inrush Transient');
    expect(inrushTransient.computeState).toBeTypeOf('function');
  });

  it('defaults the timing and temperature fields', () => {
    const runtime = new CalculatorRuntime(inrushTransient, tables);
    expect(runtime.state['step']).toBe(100);
    expect(runtime.state['length']).toBe(100);
    expect(runtime.state['temperature']).toBe(25);
  });

  it('offers an inductor type and a capacitor type per capacitor', () => {
    const runtime = new CalculatorRuntime(inrushTransient, tables);
    for (const name of ['inductorType', 'capacitor1Type', 'capacitor2Type']) {
      expect(runtime.isTableSelect(name)).toBe(true);
      expect(runtime.tableFor(name)?.id).toBe(
        name === 'inductorType' ? 'inductor-types' : 'capacitor-types',
      );
    }
  });

  it('leaves every computable variable unchanged by design', () => {
    const computable = inrushTransient.variables.flatMap((variable) =>
      isTableSelectVariable(variable) || variable.computable === undefined
        ? []
        : [variable.computable],
    );
    expect(computable.length).toBeGreaterThan(0);
    for (const compute of computable) {
      expect(isUnchanged(compute({}))).toBe(true);
    }
  });

  it('passes its (empty) definition test suite', () => {
    expect(() => assertCalculatorTests(inrushTransient)).not.toThrow();
  });

  it('rejects a time step longer than the simulation', () => {
    const runtime = new CalculatorRuntime(inrushTransient, tables);
    runtime.setDisplayText('step', '1000');
    runtime.setDisplayText('length', '0.0001');

    expect(runtime.validationIssues.map((issue) => issue.message)).toContain(
      'The time step cannot be longer than the simulation.',
    );
  });

  it('refuses a run whose sample count would be too large', () => {
    const runtime = new CalculatorRuntime(inrushTransient, tables);
    runtime.setDisplayText('step', '1');
    runtime.setDisplayText('length', '1000000');

    expect(
      runtime.validationIssues.some((issue) =>
        issue.message.startsWith('That needs'),
      ),
    ).toBe(true);
  });

  it('reports missing inputs before it starts a simulation', async () => {
    const result = inrushTransient.computeState!(
      { step: 100, length: 100 },
      context(),
    );

    await expect(Promise.resolve(result)).rejects.toThrow('source voltage');
  });

  it('asks for a missing type once the values are present', async () => {
    const result = inrushTransient.computeState!(
      {
        sourceVoltage: 400,
        seriesInductance: 1e-4,
        saturationCurrent: 10,
        seriesResistance: 0.5,
        capacitance1: 470e-6,
        capacitor1VoltageRating: 50,
        dampingResistance: 1,
        capacitance2: 100e-6,
        capacitor2VoltageRating: 50,
        temperature: 25,
        step: 100,
        length: 100,
      },
      context(),
    );

    await expect(Promise.resolve(result)).rejects.toThrow('inductor type');
  });
});
