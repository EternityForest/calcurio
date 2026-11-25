import { formatNumber } from './format.js';
import {
  CalculatorRuntime,
  DEFAULT_ABSOLUTE_TOLERANCE,
  DEFAULT_RELATIVE_TOLERANCE,
  nearlyEqual,
} from './runtime.js';
import type {
  CalcState,
  CalcValue,
  CalculatorDefinition,
  TableResolver,
  VariableDefinition,
} from './types.js';
import { isTableSelectVariable } from './types.js';

export interface CalculatorTestOptions {
  readonly relativeTolerance?: number;
  readonly absoluteTolerance?: number;
  /** Tables the calculator refers to. Required for table-select variables. */
  readonly tables?: TableResolver;
}

export interface CalculatorTestFailure {
  /** Zero-based index into `definition.testCases`. */
  readonly caseIndex: number;
  /** Variable being solved for, or null for the full-state check. */
  readonly variable: string | null;
  readonly message: string;
}

/**
 * Checks a calculator's test cases. For each case it verifies the full state,
 * then separately removes every computable variable and solves for it again,
 * comparing all values with a floating point tolerance.
 */
export function runCalculatorTests(
  definition: CalculatorDefinition,
  options: CalculatorTestOptions = {},
): readonly CalculatorTestFailure[] {
  const relativeTolerance =
    options.relativeTolerance ?? DEFAULT_RELATIVE_TOLERANCE;
  const absoluteTolerance =
    options.absoluteTolerance ?? DEFAULT_ABSOLUTE_TOLERANCE;
  const failures: CalculatorTestFailure[] = [];

  for (const [caseIndex, expected] of (definition.testCases ?? []).entries()) {
    const fullRuntime = new CalculatorRuntime(definition, options.tables);
    fullRuntime.loadState(expected);
    verify(
      fullRuntime,
      definition,
      expected,
      caseIndex,
      'full state',
      relativeTolerance,
      absoluteTolerance,
      failures,
    );

    // A `computeState` calculator never solves single variables: the whole
    // state is produced at once, so only the full-state check applies.
    if (definition.computeState !== undefined) {
      continue;
    }

    for (const variable of definition.variables) {
      if (!isSolvable(variable)) {
        continue;
      }
      const partial: CalcState = { ...expected, [variable.name]: null };

      const fillRuntime = new CalculatorRuntime(definition, options.tables);
      fillRuntime.loadState(partial);
      verify(
        fillRuntime,
        definition,
        expected,
        caseIndex,
        `solving "${variable.name}" in compute order`,
        relativeTolerance,
        absoluteTolerance,
        failures,
      );

      const solveRuntime = new CalculatorRuntime(definition, options.tables);
      solveRuntime.loadState(partial);
      solveRuntime.calculate(variable.name);
      verify(
        solveRuntime,
        definition,
        expected,
        caseIndex,
        `solving "${variable.name}" with Calculate`,
        relativeTolerance,
        absoluteTolerance,
        failures,
      );
    }
  }

  return failures;
}

/** True for any variable the runtime can derive from the rest of the state. */
function isSolvable(variable: VariableDefinition): boolean {
  if (isTableSelectVariable(variable)) {
    return true;
  }
  return (
    variable.computable !== undefined ||
    variable.tableSelect !== undefined
  );
}

/** Throws a detailed error when any calculator test check fails. */
export function assertCalculatorTests(
  definition: CalculatorDefinition,
  options: CalculatorTestOptions = {},
): void {
  const failures = runCalculatorTests(definition, options);
  if (failures.length === 0) {
    return;
  }
  const lines = failures.map((failure) => {
    const variable = failure.variable === null ? '' : ` [${failure.variable}]`;
    return `- case ${failure.caseIndex + 1}${variable}: ${failure.message}`;
  });
  throw new Error(
    `Calculator "${definition.id}" failed ${failures.length} ` +
      `check(s):\n${lines.join('\n')}`,
  );
}

function verify(
  runtime: CalculatorRuntime,
  definition: CalculatorDefinition,
  expected: Readonly<CalcState>,
  caseIndex: number,
  context: string,
  relativeTolerance: number,
  absoluteTolerance: number,
  failures: CalculatorTestFailure[],
): void {
  for (const error of runtime.errors) {
    failures.push({
      caseIndex,
      variable: null,
      message: `${context}: ${error}`,
    });
  }
  for (const issue of runtime.validationIssues) {
    failures.push({
      caseIndex,
      variable: null,
      message: `${context}: ${issue.label}: ${issue.message}`,
    });
  }

  const state = runtime.state;
  for (const variable of definition.variables) {
    const expectedValue = expected[variable.name] ?? null;
    const actualValue = state[variable.name] ?? null;
    if (
      !nearlyEqual(
        actualValue,
        expectedValue,
        relativeTolerance,
        absoluteTolerance,
      )
    ) {
      failures.push({
        caseIndex,
        variable: variable.name,
        message:
          `${context}: expected ${describeValue(expectedValue)}, ` +
          `got ${describeValue(actualValue)}.`,
      });
    }
  }
}

function describeValue(value: CalcValue): string {
  if (value === null) {
    return 'no value';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return formatNumber(value);
}
