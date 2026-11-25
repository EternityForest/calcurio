import { describe, expect, it, vi } from 'vitest';
import { StateLoadError } from './errors.js';
import { missing } from './missing.js';
import {
  CalculatorRuntime,
  MAX_REFINEMENT_ROUNDS,
  nearlyEqual,
} from './runtime.js';
import type { CalculatorDefinition, VariableDefinition } from './types.js';

type MutableDefinition = Omit<CalculatorDefinition, 'variables'> & {
  variables: VariableDefinition[];
};

function doublingDefinition(): MutableDefinition {
  return {
    id: 'doubling',
    title: 'Doubling',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: (state) =>
          state['b'] === null ? missing(['b']) : (state['b'] as number) * 2,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
        computable: (state) =>
          state['a'] === null ? missing(['a']) : (state['a'] as number) / 2,
      },
      {
        name: 'c',
        label: 'C',
        unit: 'V',
      },
    ],
    testCases: [{ a: 2, b: 1, c: null }],
  };
}

describe('nearlyEqual', () => {
  it('treats nulls as equal only to null', () => {
    expect(nearlyEqual(null, null)).toBe(true);
    expect(nearlyEqual(null, 0)).toBe(false);
    expect(nearlyEqual(0, null)).toBe(false);
  });

  it('treats identical values as equal', () => {
    expect(nearlyEqual(0, 0)).toBe(true);
    expect(nearlyEqual(1, 1)).toBe(true);
  });

  it('uses an absolute tolerance near zero', () => {
    expect(nearlyEqual(0, 1e-12)).toBe(true);
    expect(nearlyEqual(0, 1e-6)).toBe(false);
  });

  it('uses a relative tolerance for large values', () => {
    expect(nearlyEqual(1e12, 1e12 + 1000)).toBe(true);
    expect(nearlyEqual(1e12, 1e12 + 1e6)).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(nearlyEqual(Number.NaN, Number.NaN)).toBe(false);
    expect(nearlyEqual(Number.POSITIVE_INFINITY, 1)).toBe(false);
  });
});

describe('CalculatorRuntime', () => {
  it('starts with every value empty', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(runtime.state).toEqual({ a: null, b: null, c: null });
  });

  it('starts the compute order with every computable variable', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(runtime.computeOrder).toEqual(['a', 'b']);
  });

  it('reports missing dependencies', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(runtime.isMissing('a')).toBe(true);
    expect(runtime.isMissing('b')).toBe(true);
    expect(runtime.missingNeedsFor('a')).toEqual(['b']);
    expect(runtime.missingLabel('a')).toBe('Needs B');
  });

  it('converts display text into the base unit', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'mV',
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.setDisplayUnit('a', 'V');
    expect(runtime.setDisplayText('a', '2')).toEqual({ ok: true });
    expect(runtime.state['a']).toBeCloseTo(2000, 12);
    expect(runtime.formattedValue('a')).toBe('2');
  });

  it('rejects malformed display text', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    const result = runtime.setDisplayText('a', 'not a number');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('not a number');
  });

  it('rejects edits to read-only variables', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      editable: false,
    };
    const runtime = new CalculatorRuntime(definition);
    const result = runtime.setDisplayText('a', '1');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('read-only');
  });

  it('changes display units without changing stored values', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'mV',
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.setDisplayText('a', '1000');
    expect(runtime.state['a']).toBe(1000);
    runtime.setDisplayUnit('a', 'V');
    expect(runtime.state['a']).toBe(1000);
    expect(runtime.displayUnitFor('a')).toBe('V');
    expect(runtime.formattedValue('a')).toBe('1');
  });

  it('rejects unavailable or incompatible display units', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(() => runtime.setDisplayUnit('a', 'A')).toThrow(RangeError);
  });

  it('pins the changed value and recomputes the rest', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.setDisplayText('a', '2');
    expect(runtime.state).toEqual({ a: 2, b: 1, c: null });
    expect(runtime.isPinned('a')).toBe(true);
    expect(runtime.isPinned('b')).toBe(false);
  });

  it('solves for a variable on demand', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.setDisplayText('b', '1');
    expect(runtime.state['a']).toBe(2);
    runtime.calculate('a');
    expect(runtime.computeOrder[0]).toBe('a');
    expect(runtime.state['a']).toBe(2);
    expect(runtime.isPinned('b')).toBe(true);
  });

  it('rejects calculating a non-computable variable', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(() => runtime.calculate('c')).toThrow('not computable');
  });

  it('does not restart rounds for input: false variables', () => {
    const calls = { a: 0, b: 0 };
    const definition: CalculatorDefinition = {
      id: 'input-false',
      title: 'Input false',
      variables: [
        {
          name: 'a',
          label: 'A',
          unit: 'V',
          input: false,
          computable: (state) => {
            calls.a += 1;
            return state['b'] === null ? missing(['b']) : 2;
          },
        },
        {
          name: 'b',
          label: 'B',
          unit: 'V',
          computable: (state) => {
            calls.b += 1;
            return state['a'] === null ? missing(['a']) : 1;
          },
        },
      ],
    };
    const runtime = new CalculatorRuntime(definition);
    calls.a = 0;
    calls.b = 0;
    runtime.setDisplayText('b', '1');
    expect(calls.a).toBe(1);
  });

  it('reports a cycle after the refinement limit', () => {
    const definition: CalculatorDefinition = {
      id: 'cycle',
      title: 'Cycle',
      variables: [
        {
          name: 'a',
          label: 'A',
          unit: 'V',
          computable: (state) =>
            (state['b'] === null ? 0 : (state['b'] as number)) + 1,
        },
        {
          name: 'b',
          label: 'B',
          unit: 'V',
          computable: (state) =>
            (state['a'] === null ? 0 : (state['a'] as number)) + 1,
        },
      ],
    };
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.errors).toHaveLength(1);
    expect(runtime.errors[0]).toContain(
      `did not settle after ${MAX_REFINEMENT_ROUNDS} rounds`,
    );
  });

  it('clears values and display units on reset', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'mV',
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.setDisplayText('a', '1000');
    runtime.setDisplayUnit('a', 'V');
    runtime.reset();
    expect(runtime.state).toEqual({ a: null, b: null, c: null });
    expect(runtime.displayUnitFor('a')).toBe('mV');
    expect(runtime.computeOrder).toEqual(['a', 'b']);
  });

  it('loads a saved state and pins every populated value', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.loadState({ a: 2, b: 1, c: null });
    expect(runtime.state).toEqual({ a: 2, b: 1, c: null });
    expect(runtime.isPinned('a')).toBe(true);
    expect(runtime.isPinned('b')).toBe(true);
    expect(runtime.isPinned('c')).toBe(false);
  });

  it('loads saved display units', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'mV',
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.loadState({ a: 1000, b: 1, c: null }, { a: 'V' });
    expect(runtime.displayUnitFor('a')).toBe('V');
    expect(runtime.formattedValue('a')).toBe('1');
  });

  it('rejects invalid saved states', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(() => runtime.loadState({ a: 2, b: 1, c: null, extra: 1 })).toThrow(
      StateLoadError,
    );
    expect(() => runtime.loadState({ a: 2, b: 1 })).toThrow(StateLoadError);
    expect(() => runtime.loadState({ a: Number.NaN, b: 1, c: null })).toThrow(
      StateLoadError,
    );
    expect(() =>
      runtime.loadState({ a: 2, b: 1, c: null }, { a: 'A' }),
    ).toThrow(StateLoadError);
    expect(() =>
      runtime.loadState({ a: 2, b: 1, c: null }, { extra: 'V' }),
    ).toThrow(StateLoadError);
  });

  it('returns a detached snapshot', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    runtime.setDisplayText('a', '2');
    const snapshot = runtime.snapshot();
    snapshot.state['a'] = 99;
    expect(runtime.state['a']).toBe(2);
  });

  it('notifies subscribers until they unsubscribe', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);
    runtime.setDisplayText('a', '2');
    expect(listener).toHaveBeenCalled();
    const calls = listener.mock.calls.length;
    unsubscribe();
    runtime.setDisplayText('b', '1');
    expect(listener).toHaveBeenCalledTimes(calls);
  });

  it('collects validation messages', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      validate: (state) =>
        state['a'] === 2 ? ['A must not be two.', 'A is unlucky.'] : undefined,
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.setDisplayText('a', '2');
    expect(runtime.validationIssues).toHaveLength(2);
    expect(runtime.issuesFor('a').map((issue) => issue.message)).toEqual([
      'A must not be two.',
      'A is unlucky.',
    ]);
  });

  it('turns validator exceptions into validation issues', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      validate: () => {
        throw new Error('boom');
      },
    };
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.validationIssues[0]?.message).toContain(
      'Validation failed: boom',
    );
  });

  it('exposes definition metadata', () => {
    const definition = doublingDefinition();
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.definition).toBe(definition);
    expect(runtime.variables).toBe(definition.variables);
    expect(runtime.variable('a').label).toBe('A');
    expect(runtime.isComputable('a')).toBe(true);
    expect(runtime.isComputable('c')).toBe(false);
    expect(runtime.isEditable('a')).toBe(true);
    expect(runtime.unitChoices('a')).toContain('V');
  });
});
