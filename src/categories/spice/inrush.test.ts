import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { isUnchanged } from '../../framework/unchanged.js';
import type { ComputeStateContext } from '../../framework/output.js';
import { isTableSelectVariable } from '../../framework/types.js';
import { inrushTransient } from './inrush.js';

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

  it('defaults the timing fields', () => {
    const runtime = new CalculatorRuntime(inrushTransient);
    expect(runtime.state['step']).toBe(100);
    expect(runtime.state['length']).toBe(100);
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
    const runtime = new CalculatorRuntime(inrushTransient);
    runtime.setDisplayText('step', '1000');
    runtime.setDisplayText('length', '0.0001');

    expect(runtime.validationIssues.map((issue) => issue.message)).toContain(
      'The time step cannot be longer than the simulation.',
    );
  });

  it('refuses a run whose sample count would be too large', () => {
    const runtime = new CalculatorRuntime(inrushTransient);
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
});
