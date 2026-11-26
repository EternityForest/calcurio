import { describe, expect, it, vi } from 'vitest';
import { ohmsLaw } from '../categories/electrical/ohms-law.js';
import { StateLoadError } from './errors.js';
import { missing } from './missing.js';
import {
  CalculatorRuntime,
  MAX_REFINEMENT_ROUNDS,
  nearlyEqual,
} from './runtime.js';
import { TableRegistry } from './tables.js';
import type {
  CalcState,
  CalculatorDefinition,
  TableDefinition,
  VariableDefinition,
} from './types.js';
import { unchanged } from './unchanged.js';

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

function singleComputableDefinition(): CalculatorDefinition {
  return {
    id: 'single-computable',
    title: 'Single computable',
    variables: [
      {
        name: 'total',
        label: 'Total',
        unit: 'V',
        computable: (state) =>
          state['part'] === null
            ? missing(['part'])
            : (state['part'] as number) * 2,
      },
      {
        name: 'part',
        label: 'Part',
        unit: 'V',
      },
    ],
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

  it('opens a variable in its default display unit', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'F',
      defaultDisplayUnit: 'µF',
    };
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.displayUnitFor('a')).toBe('µF');
    expect(runtime.setDisplayText('a', '2')).toEqual({ ok: true });
    expect(runtime.state['a']).toBeCloseTo(2e-6, 15);
    expect(runtime.formattedValue('a')).toBe('2');
  });

  it('offers a default display unit missing from unitOptions', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'F',
      unitOptions: ['F', 'nF'],
      defaultDisplayUnit: 'µF',
    };
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.unitChoices('a')).toEqual(['F', 'µF', 'nF']);
    expect(runtime.displayUnitFor('a')).toBe('µF');
  });

  it('restores the default display unit on reset and loadState', () => {
    const definition = doublingDefinition();
    definition.variables[0] = {
      ...definition.variables[0]!,
      unit: 'F',
      defaultDisplayUnit: 'µF',
    };
    const runtime = new CalculatorRuntime(definition);
    runtime.setDisplayUnit('a', 'nF');
    runtime.reset();
    expect(runtime.displayUnitFor('a')).toBe('µF');

    runtime.setDisplayUnit('a', 'nF');
    runtime.loadState({ a: 2e-6, b: 1e-6, c: null }, { a: 'nF' });
    expect(runtime.displayUnitFor('a')).toBe('nF');

    const fresh = new CalculatorRuntime(definition);
    fresh.loadState({ a: 2e-6, b: 1e-6, c: null });
    expect(fresh.displayUnitFor('a')).toBe('µF');
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

  it('unpins a computable variable when every value is pinned', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12000');
    runtime.setDisplayText('current', '120');
    expect(runtime.isPinned('resistance')).toBe(false);

    runtime.setDisplayText('resistance', '200');
    expect(runtime.isPinned('voltage')).toBe(false);
    expect(runtime.isPinned('current')).toBe(true);
    expect(runtime.isPinned('resistance')).toBe(true);
    expect(runtime.state['voltage']).toBeCloseTo(24000, 9);
  });

  it('prefers a computable variable when breaking a deadlock', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12000');
    runtime.setDisplayText('current', '120');
    runtime.setDisplayText('resistance', '');
    expect(runtime.isPinned('voltage')).toBe(true);
    expect(runtime.isPinned('current')).toBe(true);
    expect(runtime.isPinned('resistance')).toBe(true);

    runtime.setDisplayText('voltage', '13000');
    expect(runtime.isPinned('resistance')).toBe(false);
    expect(runtime.state['current']).toBeCloseTo(120, 9);
    expect(runtime.state['resistance']).toBeCloseTo(108.33333333333333, 9);
  });

  it('falls back to the head of the compute order when nothing is computable', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('voltage', '12000');
    runtime.setDisplayText('current', '');
    runtime.setDisplayText('resistance', '');
    expect(runtime.isPinned('voltage')).toBe(true);
    expect(runtime.isPinned('current')).toBe(true);
    expect(runtime.isPinned('resistance')).toBe(true);

    runtime.setDisplayText('voltage', '13000');
    expect(runtime.isPinned('voltage')).toBe(true);
    expect(runtime.isPinned('current')).toBe(false);
    expect(runtime.isPinned('resistance')).toBe(true);
    expect(runtime.state['current']).toBeNull();
  });

  it('keeps a typed value when it is the only computable variable', () => {
    const runtime = new CalculatorRuntime(singleComputableDefinition());
    runtime.setDisplayText('total', '8');
    expect(runtime.state['total']).toBe(8);
    expect(runtime.isPinned('total')).toBe(true);
    expect(runtime.errors).toEqual([]);
  });

  it('reports a contradictory fully pinned state', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.loadState({ voltage: 12000, current: 120, resistance: 200 });
    expect(runtime.state).toEqual({
      voltage: 12000,
      current: 120,
      resistance: 200,
    });
    expect(runtime.errors).toHaveLength(1);
    expect(runtime.errors[0]).toContain('cannot all hold at once');
    expect(runtime.errors[0]).toContain('Voltage, Current, and Resistance');
  });

  it('accepts a consistent fully pinned state', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.loadState({ voltage: 12000, current: 120, resistance: 100 });
    expect(runtime.errors).toEqual([]);
  });

  it('resolves a contradictory state when a value is calculated', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.loadState({ voltage: 12000, current: 120, resistance: 200 });
    expect(runtime.errors).toHaveLength(1);

    runtime.calculate('resistance');
    expect(runtime.errors).toEqual([]);
    expect(runtime.state['resistance']).toBeCloseTo(100, 9);
    expect(runtime.state['voltage']).toBe(12000);
    expect(runtime.state['current']).toBe(120);
  });

  it('lists computable peers as plot targets', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(runtime.graphTargets('a')).toEqual(['b']);
    expect(runtime.graphTargets('c')).toEqual(['a', 'b']);
    expect(() => runtime.graphTargets('missing')).toThrow(RangeError);
  });

  it('samples a target across an axis without touching live state', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('resistance', '100');
    runtime.setDisplayText('current', '120');
    const before = runtime.state;

    const sampler = runtime.beginSample('voltage', 'current');
    expect(sampler.axis).toBe('voltage');
    expect(sampler.target).toBe('current');
    expect(sampler.sample(500)).toBeCloseTo(5, 9);
    expect(sampler.sample(1000)).toBeCloseTo(10, 9);
    expect(runtime.state).toEqual(before);

    sampler.stop();
    expect(() => sampler.sample(0)).toThrow(Error);
    expect(runtime.state).toEqual(before);
  });

  it('reports null while the target cannot be computed', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    runtime.setDisplayText('resistance', '0');
    const sampler = runtime.beginSample('voltage', 'current');
    expect(sampler.sample(1000)).toBeNull();
    sampler.stop();
  });

  it('rejects invalid plot pairs', () => {
    const runtime = new CalculatorRuntime(ohmsLaw);
    expect(() => runtime.beginSample('voltage', 'voltage')).toThrow(RangeError);
    expect(() => runtime.beginSample('voltage', 'missing')).toThrow(RangeError);

    const doubling = new CalculatorRuntime(doublingDefinition());
    expect(() => doubling.beginSample('a', 'c')).toThrow(RangeError);
  });
});

function computeStateDefinition(
  computeState: NonNullable<CalculatorDefinition['computeState']>,
): CalculatorDefinition {
  return {
    id: 'compute-state',
    title: 'Compute state',
    variables: [
      { name: 'a', label: 'A', unit: 'V' },
      { name: 'b', label: 'B', unit: 'V' },
      { name: 'sum', label: 'Sum', unit: 'V', computable: () => unchanged() },
    ],
    computeState,
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('computeState', () => {
  it('reports the computeState mode', () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state) => ({ ...state })),
    );
    expect(runtime.hasComputeState).toBe(true);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.outputDisplay).toEqual([]);
  });

  it('runs computeState and merges the returned state', async () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state) => ({ ...state, sum: 3 })),
    );
    runtime.setDisplayText('a', '1');
    runtime.setDisplayText('b', '2');
    expect(runtime.state['sum']).toBeNull();

    await runtime.computeState();
    expect(runtime.state['sum']).toBe(3);
    expect(runtime.isRunning).toBe(false);
    expect(runtime.errors).toEqual([]);
  });

  it('does not recompute derived values from edits in computeState mode', () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state) => ({ ...state })),
    );
    runtime.setDisplayText('a', '1');
    runtime.setDisplayText('b', '2');
    expect(runtime.state['sum']).toBeNull();
  });

  it('hands computeState a frozen copy of the live state', async () => {
    let received: Readonly<CalcState> | null = null;
    let frozen = false;
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state) => {
        received = state;
        frozen = Object.isFrozen(state);
        return { ...state };
      }),
    );
    runtime.setDisplayText('a', '1');
    await runtime.computeState();

    expect(frozen).toBe(true);
    expect(received).toEqual({ a: 1, b: null, sum: null });
    runtime.setDisplayText('a', '5');
    expect(received!['a']).toBe(1);
  });

  it('only starts a run once every input has a value', () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state) => ({ ...state })),
    );
    expect(runtime.canRunComputeState()).toBe(false);
    runtime.setDisplayText('a', '1');
    expect(runtime.canRunComputeState()).toBe(false);
    runtime.setDisplayText('b', '2');
    expect(runtime.canRunComputeState()).toBe(true);
  });

  it('never allows a run without computeState', () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    expect(runtime.canRunComputeState()).toBe(false);
    expect(runtime.hasComputeState).toBe(false);
  });

  it('rejects a concurrent run', async () => {
    const gate = deferred<CalcState>();
    const runtime = new CalculatorRuntime(
      computeStateDefinition(() => gate.promise),
    );
    const run = runtime.computeState();
    expect(runtime.isRunning).toBe(true);
    await expect(runtime.computeState()).rejects.toThrow('already running');
    gate.resolve({});
    await run;
    expect(runtime.isRunning).toBe(false);
  });

  it('cancels an in-flight run and discards its result', async () => {
    const gate = deferred<CalcState>();
    const runtime = new CalculatorRuntime(
      computeStateDefinition(() => gate.promise),
    );
    runtime.setDisplayText('a', '1');
    const run = runtime.computeState();
    runtime.cancelComputeState();
    gate.resolve({ a: 1, b: null, sum: 99 });
    await run;
    expect(runtime.isRunning).toBe(false);
    expect(runtime.state['sum']).toBeNull();
    expect(runtime.errors).toEqual([]);
  });

  it('aborts the signal handed to computeState', async () => {
    const gate = deferred<void>();
    let signal: AbortSignal | null = null;
    const runtime = new CalculatorRuntime(
      computeStateDefinition(async (state, context) => {
        signal = context.signal;
        await gate.promise;
        return { ...state };
      }),
    );
    const run = runtime.computeState();
    expect(signal).not.toBeNull();
    expect(signal!.aborted).toBe(false);
    runtime.cancelComputeState();
    expect(signal!.aborted).toBe(true);
    gate.resolve();
    await run;
  });

  it('reports a computeState failure', async () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition(() => {
        throw new Error('boom');
      }),
    );
    await runtime.computeState();
    expect(runtime.errors).toHaveLength(1);
    expect(runtime.errors[0]).toContain('failed: boom');
    expect(runtime.isRunning).toBe(false);
  });

  it('rejects an invalid state returned by computeState', async () => {
    const runtime = new CalculatorRuntime(
      computeStateDefinition(() => null as unknown as CalcState),
    );
    await runtime.computeState();
    expect(runtime.errors[0]).toContain('invalid state');
  });

  it('clears the display before the next run and calls dispose', async () => {
    const dispose = vi.fn();
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state, context) => {
        context.display('first');
        context.display('second', dispose);
        return { ...state };
      }),
    );

    await runtime.computeState();
    expect(runtime.outputDisplay).toHaveLength(2);
    expect(runtime.outputDisplay[0]?.content).toBe('first');
    expect(runtime.outputDisplay[1]?.content).toBe('second');
    expect(dispose).not.toHaveBeenCalled();

    await runtime.computeState();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(runtime.outputDisplay).toHaveLength(2);
  });

  it('clears the display on reset', async () => {
    const dispose = vi.fn();
    const runtime = new CalculatorRuntime(
      computeStateDefinition((state, context) => {
        context.display('x', dispose);
        return { ...state };
      }),
    );
    await runtime.computeState();
    expect(runtime.outputDisplay).toHaveLength(1);
    runtime.reset();
    expect(runtime.outputDisplay).toEqual([]);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('ignores display items added after cancellation', async () => {
    const dispose = vi.fn();
    const gate = deferred<void>();
    const runtime = new CalculatorRuntime(
      computeStateDefinition(async (state, context) => {
        await gate.promise;
        context.display('late', dispose);
        return { ...state };
      }),
    );
    const run = runtime.computeState();
    runtime.cancelComputeState();
    gate.resolve();
    await run;
    expect(runtime.outputDisplay).toEqual([]);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('throws when computeState is missing', async () => {
    const runtime = new CalculatorRuntime(doublingDefinition());
    await expect(runtime.computeState()).rejects.toThrow('has no computeState');
  });
});

describe('defaults', () => {
  it('starts plain inputs at their default and restores them on reset', () => {
    const definition: CalculatorDefinition = {
      id: 'defaults',
      title: 'Defaults',
      variables: [
        { name: 'step', label: 'Step', unit: 's', default: 100 },
        { name: 'length', label: 'Length', unit: 's', default: 0.1 },
        {
          name: 'double',
          label: 'Double',
          unit: 's',
          computable: (state) =>
            state['step'] === null
              ? missing(['step'])
              : (state['step'] as number) * 2,
        },
      ],
    };
    const runtime = new CalculatorRuntime(definition);
    expect(runtime.state['step']).toBe(100);
    expect(runtime.state['length']).toBe(0.1);
    expect(runtime.state['double']).toBe(200);

    runtime.setDisplayText('step', '250');
    expect(runtime.state['double']).toBe(500);

    runtime.reset();
    expect(runtime.state['step']).toBe(100);
    expect(runtime.state['length']).toBe(0.1);
    expect(runtime.state['double']).toBe(200);
  });

  it('starts a standalone table select at its default and restores it on reset', () => {
    const registry = new TableRegistry([materialsTable]);
    const runtime = new CalculatorRuntime(selectDefinition('copper'), registry);

    expect(runtime.state['material']).toBe('copper');
    expect(runtime.isPinned('material')).toBe(true);

    runtime.setSelection('material', 'silver');
    expect(runtime.state['material']).toBe('silver');

    runtime.reset();
    expect(runtime.state['material']).toBe('copper');
  });

  it('ignores a table-select default that names no row', () => {
    const registry = new TableRegistry([materialsTable]);
    const runtime = new CalculatorRuntime(
      selectDefinition('unobtainium'),
      registry,
    );

    expect(runtime.state['material']).toBeNull();
  });

  it('lets a table-driven select derive its row instead of a default', () => {
    const registry = new TableRegistry([materialsTable]);
    const runtime = new CalculatorRuntime(fieldSelectDefinition(), registry);

    expect(runtime.state['material']).toBeNull();

    runtime.setDisplayText('resistivity', '2');
    expect(runtime.state['material']).toBe('silver');
  });
});

/** A small table with one numeric column for the default tests. */
const materialsTable: TableDefinition = {
  id: 'materials',
  title: 'Materials',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    { key: 'resistivity', label: 'Resistivity', unit: 'Ω' },
  ],
  rows: [
    { id: 'copper', label: 'Copper', resistivity: 1 },
    { id: 'silver', label: 'Silver', resistivity: 2 },
  ],
};

/** A definition with one standalone table select and an optional default. */
function selectDefinition(defaultKey?: string): CalculatorDefinition {
  return {
    id: 'select-default',
    title: 'Select default',
    variables: [
      {
        name: 'material',
        label: 'Material',
        table: 'materials',
        ...(defaultKey === undefined ? {} : { default: defaultKey }),
      },
    ],
  };
}

/** A definition whose select is driven by a referencing table field. */
function fieldSelectDefinition(): CalculatorDefinition {
  return {
    id: 'field-select',
    title: 'Field select',
    variables: [
      {
        name: 'material',
        label: 'Material',
        table: 'materials',
        default: 'copper',
      },
      {
        name: 'resistivity',
        label: 'Resistivity',
        unit: 'Ω',
        tableSelect: 'material',
        tableField: 'resistivity',
      },
    ],
  };
}

/**
 * A table whose area and diameter columns describe the same circle, used to
 * exercise equivalent variables.
 */
const shapesTable: TableDefinition = {
  id: 'shapes',
  title: 'Shapes',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    { key: 'area', label: 'Area', unit: 'mm2' },
    { key: 'diameter', label: 'Diameter', unit: 'mm' },
  ],
  rows: [
    { id: 'small', label: 'Small', area: Math.PI / 4, diameter: 1 },
    { id: 'large', label: 'Large', area: Math.PI, diameter: 2 },
  ],
};

/**
 * A definition with an area/diameter equivalent group and a downstream
 * perimeter computed from the diameter.
 */
function equivalentDefinition(): CalculatorDefinition {
  return {
    id: 'equivalent',
    title: 'Equivalent',
    variables: [
      { name: 'shape', label: 'Shape', table: 'shapes' },
      {
        name: 'area',
        label: 'Area',
        unit: 'mm2',
        tableSelect: 'shape',
        tableField: 'area',
        equivalent: {
          diameter: (area) => 2 * Math.sqrt(area / Math.PI),
        },
      },
      {
        name: 'diameter',
        label: 'Diameter',
        unit: 'mm',
        tableSelect: 'shape',
        tableField: 'diameter',
        equivalent: {
          area: (diameter) => Math.PI * (diameter / 2) ** 2,
        },
      },
      {
        name: 'perimeter',
        label: 'Perimeter',
        unit: 'mm',
        computable: (state) => {
          const diameter = state['diameter'];
          return typeof diameter === 'number' && Number.isFinite(diameter)
            ? Math.PI * diameter
            : missing(['diameter']);
        },
      },
    ],
  };
}

describe('CalculatorRuntime equivalent variables', () => {
  function runtime(): CalculatorRuntime {
    return new CalculatorRuntime(
      equivalentDefinition(),
      new TableRegistry([shapesTable]),
    );
  }

  it('fills an equivalent group from a value that matches no table row', () => {
    const calc = runtime();
    calc.setDisplayText('diameter', '3');
    expect(calc.state['shape']).toBeNull();
    expect(calc.state['area']).toBeCloseTo(Math.PI * (3 / 2) ** 2, 9);
    expect(calc.errors).toEqual([]);
  });

  it('recomputes downstream values after filling a group', () => {
    const calc = runtime();
    calc.setDisplayText('area', '4');
    expect(calc.state['diameter']).toBeCloseTo(2 * Math.sqrt(4 / Math.PI), 9);
    expect(calc.state['perimeter']).toBeCloseTo(
      Math.PI * 2 * Math.sqrt(4 / Math.PI),
      9,
    );
  });

  it('prefers a table row when the typed value matches one', () => {
    const calc = runtime();
    calc.setDisplayText('diameter', '2');
    expect(calc.state['shape']).toBe('large');
    expect(calc.state['area']).toBeCloseTo(Math.PI, 9);
  });

  it('leaves an equivalent group alone when two members hold values', () => {
    const calc = runtime();
    calc.loadState({ shape: null, area: 1, diameter: 5, perimeter: null });
    expect(calc.state['area']).toBe(1);
    expect(calc.state['diameter']).toBe(5);
  });
});
