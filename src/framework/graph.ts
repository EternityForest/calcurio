import { formatNumber, parseNumberText } from './format.js';
import type { CalculatorRuntime, RuntimeSampler } from './runtime.js';
import { convertUnit } from './units.js';
import type { UnitSymbol } from './units.js';

/**
 * Longest a single drawing batch may run before yielding to the browser. One
 * frame at 60 Hz, so a long sweep keeps the plot and its controls responsive.
 */
export const DRAW_BUDGET_MS = 1000 / 60;

/** Steps offered in the plot dialog before the user changes them. */
export const DEFAULT_GRAPH_STEPS = 100;

/** Upper bound on steps, to keep one sweep's memory use sane. */
export const MAX_GRAPH_STEPS = 100_000;

/** A closed interval on the horizontal axis, in the chosen display unit. */
export interface GraphRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Defaults a plot range to the current value plus and minus 100%. A missing or
 * zero value has no meaningful spread, so it falls back to a small interval.
 */
export function defaultGraphRange(value: number | null): GraphRange {
  if (value === null || !Number.isFinite(value)) {
    return { min: 0, max: 1 };
  }
  const span = Math.abs(value) === 0 ? 1 : Math.abs(value);
  return { min: value - span, max: value + span };
}

/**
 * Evenly spaced axis values, including both ends. `steps` counts the intervals
 * between samples, so the result holds `steps + 1` values.
 */
export function axisStepValues(
  min: number,
  max: number,
  steps: number,
): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError('Axis limits must be finite numbers.');
  }
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError('Steps must be a positive whole number.');
  }
  if (steps > MAX_GRAPH_STEPS) {
    throw new RangeError(`Steps must not exceed ${MAX_GRAPH_STEPS}.`);
  }
  if (max < min) {
    throw new RangeError('The maximum must not be less than the minimum.');
  }
  if (max === min) {
    return [min];
  }
  const values = new Array<number>(steps + 1);
  const width = max - min;
  for (let index = 0; index <= steps; index += 1) {
    values[index] = min + (width * index) / steps;
  }
  values[0] = min;
  values[steps] = max;
  return values;
}

/** One plotted point, in base units for both axes. */
export interface GraphPoint {
  readonly x: number;
  readonly y: number;
}

/** Points produced in one drawing batch. */
export interface GraphBatch {
  readonly points: readonly GraphPoint[];
  readonly done: boolean;
}

export interface GraphSweepOptions {
  readonly sampler: RuntimeSampler;
  /** Axis values in base units, in plot order. */
  readonly axisValues: readonly number[];
  readonly budgetMs?: number;
  readonly now?: () => number;
}

/**
 * Walks the axis values, sampling the target for each. Every `nextBatch` keeps
 * working until the time budget runs out or the sweep finishes, so a long run
 * yields to the browser between batches instead of freezing it.
 */
export class GraphSweep {
  private readonly sampler: RuntimeSampler;
  private readonly axisValues: readonly number[];
  private readonly budgetMs: number;
  private readonly now: () => number;
  private index = 0;
  private stopped = false;

  constructor(options: GraphSweepOptions) {
    if (options.axisValues.length === 0) {
      throw new RangeError('A sweep needs at least one axis value.');
    }
    const budget = options.budgetMs ?? DRAW_BUDGET_MS;
    if (!Number.isFinite(budget) || budget <= 0) {
      throw new RangeError('The drawing budget must be a positive number.');
    }
    this.sampler = options.sampler;
    this.axisValues = options.axisValues;
    this.budgetMs = budget;
    this.now = options.now ?? (() => performance.now());
  }

  /** Total number of axis values in the sweep. */
  get total(): number {
    return this.axisValues.length;
  }

  /** Number of axis values sampled so far. */
  get progress(): number {
    return this.index;
  }

  /**
   * Samples up to the time budget, always taking at least one step while work
   * remains. Returns the new points and whether the sweep is finished.
   */
  nextBatch(): GraphBatch {
    const points: GraphPoint[] = [];
    if (this.stopped || this.index >= this.axisValues.length) {
      return { points, done: true };
    }

    const deadline = this.now() + this.budgetMs;
    while (this.index < this.axisValues.length) {
      const axisValue = this.axisValues[this.index];
      if (axisValue === undefined) {
        break;
      }
      const value = this.sampler.sample(axisValue);
      if (value !== null) {
        points.push({ x: axisValue, y: value });
      }
      this.index += 1;
      if (this.now() >= deadline) {
        break;
      }
    }

    const done = this.index >= this.axisValues.length;
    if (done) {
      this.sampler.stop();
    }
    return { points, done };
  }

  /** Stops the sweep early and releases the sampler. */
  stop(): void {
    this.stopped = true;
    this.sampler.stop();
  }
}

export interface GraphPlanInput {
  readonly runtime: CalculatorRuntime;
  /** Variable plotted on the X axis (the field the user is plotting). */
  readonly axisName: string;
  /** Computable variable plotted on the Y axis. */
  readonly targetName: string;
  /** Unit the minimum and maximum are typed in. */
  readonly axisUnit: UnitSymbol;
  readonly minText: string;
  readonly maxText: string;
  readonly stepsText: string;
}

/** A validated plot request, with the axis values converted to base units. */
export interface GraphPlan {
  readonly axisName: string;
  readonly targetName: string;
  readonly axisUnit: UnitSymbol;
  readonly axisBaseUnit: UnitSymbol;
  readonly targetBaseUnit: UnitSymbol;
  readonly axisValues: readonly number[];
}

export type GraphPlanResult =
  | { readonly ok: true; readonly plan: GraphPlan }
  | { readonly ok: false; readonly message: string };

/**
 * Turns the plot dialog's text inputs into a validated plan. Limits are typed
 * in the chosen unit and converted to the axis variable's base unit for
 * sampling.
 */
export function buildGraphPlan(input: GraphPlanInput): GraphPlanResult {
  const { runtime, axisName, targetName, axisUnit } = input;
  if (!runtime.graphTargets(axisName).includes(targetName)) {
    return { ok: false, message: 'Choose a variable to plot on the Y axis.' };
  }

  let min: number | null;
  let max: number | null;
  let steps: number | null;
  try {
    min = parseNumberText(input.minText);
    max = parseNumberText(input.maxText);
    steps = parseNumberText(input.stepsText);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  if (min === null || max === null) {
    return { ok: false, message: 'Enter a minimum and a maximum.' };
  }
  if (steps === null) {
    return { ok: false, message: 'Enter a number of steps.' };
  }
  if (max <= min) {
    return {
      ok: false,
      message: 'The maximum must be greater than the minimum.',
    };
  }

  const axisBaseUnit = baseUnitOf(runtime, axisName);
  const targetBaseUnit = baseUnitOf(runtime, targetName);
  let axisValues: number[];
  try {
    axisValues = axisStepValues(
      convertUnit(min, axisUnit, axisBaseUnit),
      convertUnit(max, axisUnit, axisBaseUnit),
      steps,
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    plan: {
      axisName,
      targetName,
      axisUnit,
      axisBaseUnit,
      targetBaseUnit,
      axisValues,
    },
  };
}

/** Formats a numeric value for a plot input, blank when there is no value. */
export function formatGraphNumber(value: number | null): string {
  return value === null ? '' : formatNumber(value);
}

/** Reads the base unit of a numeric variable; throws for non-numeric ones. */
export function baseUnitOf(
  runtime: CalculatorRuntime,
  name: string,
): UnitSymbol {
  const variable = runtime.variable(name);
  if (!('unit' in variable)) {
    throw new RangeError(`${variable.label} has no unit.`);
  }
  return variable.unit;
}
