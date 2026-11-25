import { describe, expect, it } from 'vitest';
import { missing } from './missing.js';
import { assertCalculatorTests, runCalculatorTests } from './testing.js';
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
    ],
    testCases: [{ a: 2, b: 1 }],
  };
}

describe('runCalculatorTests', () => {
  it('passes a consistent definition', () => {
    expect(runCalculatorTests(doublingDefinition())).toEqual([]);
  });

  it('passes when there are no test cases', () => {
    const definition: CalculatorDefinition = {
      id: 'empty',
      title: 'Empty',
      variables: [{ name: 'a', label: 'A', unit: 'V' }],
    };
    expect(runCalculatorTests(definition)).toEqual([]);
  });

  it('reports a wrong computed value', () => {
    const definition: CalculatorDefinition = {
      id: 'wrong',
      title: 'Wrong',
      variables: [
        {
          name: 'a',
          label: 'A',
          unit: 'V',
          computable: (state) => (state['b'] === null ? missing(['b']) : 3),
        },
        {
          name: 'b',
          label: 'B',
          unit: 'V',
          computable: (state) =>
            state['a'] === null ? missing(['a']) : (state['a'] as number) / 2,
        },
      ],
      testCases: [{ a: 2, b: 1 }],
    };

    const failures = runCalculatorTests(definition);
    expect(failures).toHaveLength(3);
    const mismatches = failures.filter((failure) => failure.variable === 'a');
    expect(mismatches).toHaveLength(2);
    expect(mismatches[0]?.message).toContain('expected 2');
    expect(mismatches[0]?.message).toContain('got 3');
    expect(
      failures.some(
        (failure) =>
          failure.variable === null &&
          failure.message.includes('cannot all hold at once'),
      ),
    ).toBe(true);
  });

  it('reports validation issues', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      validate: (state) => (state['a'] === 2 ? 'A is unlucky.' : undefined),
    };

    const failures = runCalculatorTests(definition);
    expect(failures.length).toBeGreaterThan(0);
    expect(
      failures.some((failure) => failure.message.includes('A is unlucky.')),
    ).toBe(true);
  });

  it('reports compute errors', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      computable: () => {
        throw new Error('boom');
      },
    };

    const failures = runCalculatorTests(definition);
    expect(
      failures.some((failure) => failure.message.includes('A failed: boom')),
    ).toBe(true);
  });

  it('honours the supplied tolerances', () => {
    const definition: CalculatorDefinition = {
      id: 'tolerance',
      title: 'Tolerance',
      variables: [
        {
          name: 'a',
          label: 'A',
          unit: 'V',
          computable: (state) =>
            state['b'] === null
              ? missing(['b'])
              : (state['b'] as number) + 1e-12,
        },
        {
          name: 'b',
          label: 'B',
          unit: 'V',
        },
      ],
      testCases: [{ a: 1, b: 1 }],
    };

    expect(runCalculatorTests(definition)).toEqual([]);
    expect(
      runCalculatorTests(definition, {
        absoluteTolerance: 0,
        relativeTolerance: 0,
      }),
    ).toHaveLength(2);
  });
});

describe('assertCalculatorTests', () => {
  it('does nothing for a passing definition', () => {
    expect(() => assertCalculatorTests(doublingDefinition())).not.toThrow();
  });

  it('throws with case and variable details', () => {
    const definition: CalculatorDefinition = {
      id: 'wrong',
      title: 'Wrong',
      variables: [
        {
          name: 'a',
          label: 'A',
          unit: 'V',
          computable: (state) => (state['b'] === null ? missing(['b']) : 3),
        },
        {
          name: 'b',
          label: 'B',
          unit: 'V',
        },
      ],
      testCases: [{ a: 2, b: 1 }],
    };

    expect(() => assertCalculatorTests(definition)).toThrow(
      'Calculator "wrong" failed 2 check(s)',
    );
    expect(() => assertCalculatorTests(definition)).toThrow('case 1 [a]');
  });
});
