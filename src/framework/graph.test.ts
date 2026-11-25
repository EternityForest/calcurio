import { describe, expect, it } from 'vitest';
import { missing } from './missing.js';
import { CalculatorRuntime } from './runtime.js';
import type { RuntimeSampler } from './runtime.js';
import type { CalculatorDefinition } from './types.js';
import {
  DEFAULT_GRAPH_STEPS,
  DRAW_BUDGET_MS,
  GraphSweep,
  MAX_GRAPH_STEPS,
  axisStepValues,
  baseUnitOf,
  buildGraphPlan,
  defaultGraphRange,
  formatGraphNumber,
} from './graph.js';

/** A sampler that records the axis values it was asked for. */
class StubSampler implements RuntimeSampler {
  readonly axis = 'a';
  readonly target = 'b';
  readonly calls: number[] = [];
  stopCount = 0;
  private readonly compute: (axisValue: number) => number | null;

  constructor(compute: (axisValue: number) => number | null) {
    this.compute = compute;
  }

  sample(axisValue: number): number | null {
    this.calls.push(axisValue);
    return this.compute(axisValue);
  }

  stop(): void {
    this.stopCount += 1;
  }
}

/** A clock that advances by `step` on every reading. */
function steppedClock(step: number): () => number {
  let current = 0;
  return () => {
    current += step;
    return current;
  };
}

function drain(sweep: GraphSweep): {
  points: { x: number; y: number }[];
  batches: number;
} {
  const points: { x: number; y: number }[] = [];
  let batches = 0;
  let done = false;
  while (!done) {
    batches += 1;
    if (batches > 10_000) {
      throw new Error('The sweep never reported completion.');
    }
    const batch = sweep.nextBatch();
    points.push(...batch.points);
    done = batch.done;
  }
  return { points, batches };
}

describe('defaultGraphRange', () => {
  it('spreads a positive value by 100% each way', () => {
    expect(defaultGraphRange(10)).toEqual({ min: 0, max: 20 });
  });

  it('spreads a negative value by 100% each way', () => {
    expect(defaultGraphRange(-10)).toEqual({ min: -20, max: 0 });
  });

  it('falls back to a unit interval around zero', () => {
    expect(defaultGraphRange(0)).toEqual({ min: -1, max: 1 });
  });

  it('falls back when there is no finite value', () => {
    expect(defaultGraphRange(null)).toEqual({ min: 0, max: 1 });
    expect(defaultGraphRange(Number.NaN)).toEqual({ min: 0, max: 1 });
    expect(defaultGraphRange(Number.POSITIVE_INFINITY)).toEqual({
      min: 0,
      max: 1,
    });
  });
});

describe('axisStepValues', () => {
  it('counts steps as intervals and includes both ends', () => {
    const values = axisStepValues(0, 10, 10);
    expect(values).toHaveLength(11);
    expect(values[0]).toBe(0);
    expect(values[5]).toBe(5);
    expect(values[10]).toBe(10);
  });

  it('keeps the exact endpoints despite rounding', () => {
    const values = axisStepValues(0.1, 0.3, 2);
    expect(values).toEqual([0.1, 0.2, 0.3]);
  });

  it('returns a single value when the limits match', () => {
    expect(axisStepValues(2, 2, 5)).toEqual([2]);
  });

  it('rejects steps that are not a positive whole number', () => {
    expect(() => axisStepValues(0, 10, 0)).toThrow(RangeError);
    expect(() => axisStepValues(0, 10, -1)).toThrow(RangeError);
    expect(() => axisStepValues(0, 10, 1.5)).toThrow(RangeError);
  });

  it('rejects a maximum below the minimum', () => {
    expect(() => axisStepValues(10, 0, 5)).toThrow(RangeError);
  });

  it('rejects non-finite limits', () => {
    expect(() => axisStepValues(Number.NaN, 1, 5)).toThrow(RangeError);
    expect(() => axisStepValues(0, Number.POSITIVE_INFINITY, 5)).toThrow(
      RangeError,
    );
  });

  it('rejects more steps than the safety limit', () => {
    expect(() => axisStepValues(0, 10, MAX_GRAPH_STEPS + 1)).toThrow(
      RangeError,
    );
  });
});

describe('GraphSweep', () => {
  it('uses one frame of drawing budget by default', () => {
    expect(DRAW_BUDGET_MS).toBeCloseTo(1000 / 60);
  });

  it('finishes in a single batch when the budget is generous', () => {
    const sampler = new StubSampler((value) => value * 2);
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0, 1, 2],
      budgetMs: 1_000_000,
      now: steppedClock(1),
    });

    const batch = sweep.nextBatch();
    expect(batch.done).toBe(true);
    expect(batch.points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]);
    expect(sampler.stopCount).toBe(1);
  });

  it('yields to the browser after each frame of work', () => {
    const sampler = new StubSampler((value) => value * 2);
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0, 1, 2, 3, 4],
      budgetMs: 10,
      now: steppedClock(10),
    });

    const { points, batches } = drain(sweep);
    expect(batches).toBe(5);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
    ]);
    expect(sampler.calls).toEqual([0, 1, 2, 3, 4]);
    expect(sampler.stopCount).toBe(1);
  });

  it('takes at least one step even when the budget is exhausted', () => {
    const sampler = new StubSampler((value) => value);
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0, 1],
      budgetMs: 0.001,
      now: steppedClock(1_000_000),
    });

    const batch = sweep.nextBatch();
    expect(batch.points).toEqual([{ x: 0, y: 0 }]);
    expect(batch.done).toBe(false);
  });

  it('leaves a gap where a point cannot be computed', () => {
    const sampler = new StubSampler((value) =>
      value === 2 ? null : value * 2,
    );
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0, 1, 2, 3],
      budgetMs: 1_000_000,
      now: steppedClock(1),
    });

    expect(sweep.nextBatch().points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 3, y: 6 },
    ]);
  });

  it('stops early when asked and releases the sampler', () => {
    const sampler = new StubSampler((value) => value);
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0, 1, 2],
      budgetMs: 10,
      now: steppedClock(100),
    });

    sweep.stop();
    expect(sampler.stopCount).toBe(1);
    expect(sweep.nextBatch()).toEqual({ points: [], done: true });
    expect(sampler.calls).toEqual([]);
  });

  it('does nothing more once finished', () => {
    const sampler = new StubSampler((value) => value);
    const sweep = new GraphSweep({
      sampler,
      axisValues: [0],
      budgetMs: 1_000_000,
      now: steppedClock(1),
    });

    expect(sweep.nextBatch().done).toBe(true);
    expect(sweep.nextBatch()).toEqual({ points: [], done: true });
    expect(sampler.stopCount).toBe(1);
  });

  it('rejects an empty sweep or an invalid budget', () => {
    const sampler = new StubSampler((value) => value);
    expect(() => new GraphSweep({ sampler, axisValues: [] })).toThrow(
      RangeError,
    );
    expect(
      () => new GraphSweep({ sampler, axisValues: [0], budgetMs: 0 }),
    ).toThrow(RangeError);
    expect(
      () => new GraphSweep({ sampler, axisValues: [0], budgetMs: -1 }),
    ).toThrow(RangeError);
    expect(
      () => new GraphSweep({ sampler, axisValues: [0], budgetMs: Number.NaN }),
    ).toThrow(RangeError);
  });
});

/** Two mutually computable variables plus one that cannot be computed. */
function probeDefinition(): CalculatorDefinition {
  return {
    id: 'probe',
    title: 'Probe',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: (state) => {
          const b = state['b'];
          return typeof b === 'number' ? b * 2 : missing(['b']);
        },
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
        computable: (state) => {
          const a = state['a'];
          return typeof a === 'number' ? a / 2 : missing(['a']);
        },
      },
      { name: 'note', label: 'Note', unit: 'V' },
    ],
  };
}

describe('buildGraphPlan', () => {
  it('builds axis values in the variables base unit', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    const result = buildGraphPlan({
      runtime,
      axisName: 'a',
      targetName: 'b',
      axisUnit: 'V',
      minText: '0',
      maxText: '4',
      stepsText: '4',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.plan.axisValues).toEqual([0, 1, 2, 3, 4]);
    expect(result.plan.axisBaseUnit).toBe('V');
    expect(result.plan.targetBaseUnit).toBe('V');
  });

  it('converts typed limits from the chosen unit', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    const result = buildGraphPlan({
      runtime,
      axisName: 'a',
      targetName: 'b',
      axisUnit: 'mV',
      minText: '0',
      maxText: '4000',
      stepsText: '4',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.plan.axisValues).toEqual([0, 1, 2, 3, 4]);
  });

  it('rejects a Y axis that is not the other variable', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    const result = buildGraphPlan({
      runtime,
      axisName: 'a',
      targetName: 'a',
      axisUnit: 'V',
      minText: '0',
      maxText: '4',
      stepsText: '4',
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a maximum that does not exceed the minimum', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    const input = {
      runtime,
      axisName: 'a',
      targetName: 'b',
      axisUnit: 'V',
      minText: '4',
      maxText: '4',
      stepsText: '4',
    } as const;

    expect(buildGraphPlan(input).ok).toBe(false);
    expect(buildGraphPlan({ ...input, maxText: '1' }).ok).toBe(false);
  });

  it('rejects limits that are blank or not numbers', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    const base = {
      runtime,
      axisName: 'a',
      targetName: 'b',
      axisUnit: 'V',
      minText: '0',
      maxText: '4',
      stepsText: '4',
    } as const;

    expect(buildGraphPlan({ ...base, minText: '' }).ok).toBe(false);
    expect(buildGraphPlan({ ...base, maxText: 'nope' }).ok).toBe(false);
    expect(buildGraphPlan({ ...base, stepsText: '' }).ok).toBe(false);
    expect(buildGraphPlan({ ...base, stepsText: '0' }).ok).toBe(false);
  });

  it('excludes non-computable variables from the Y axis', () => {
    const runtime = new CalculatorRuntime(probeDefinition());
    expect(runtime.graphTargets('a')).toEqual(['b']);
    expect(runtime.graphTargets('note')).toEqual(['a', 'b']);
    expect(baseUnitOf(runtime, 'a')).toBe('V');

    const result = buildGraphPlan({
      runtime,
      axisName: 'a',
      targetName: 'note',
      axisUnit: 'V',
      minText: '0',
      maxText: '4',
      stepsText: '4',
    });
    expect(result.ok).toBe(false);
  });
});

describe('formatGraphNumber', () => {
  it('is blank for a missing value and formatted otherwise', () => {
    expect(formatGraphNumber(null)).toBe('');
    expect(formatGraphNumber(12)).toBe('12');
    expect(formatGraphNumber(1234.5)).toBe('1234.5');
  });
});

describe('graph defaults', () => {
  it('offers a sensible default number of steps', () => {
    expect(DEFAULT_GRAPH_STEPS).toBeGreaterThan(0);
    expect(DEFAULT_GRAPH_STEPS).toBeLessThanOrEqual(MAX_GRAPH_STEPS);
  });
});
