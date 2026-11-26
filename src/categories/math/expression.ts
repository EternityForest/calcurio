import { Parser } from 'expr-eval';
import { missing } from '../../framework/missing.js';
import type { MissingValue } from '../../framework/missing.js';
import type {
  CalcState,
  CalculatorConfig,
  CalculatorDefinition,
  ConfigFieldDefinition,
  VariableDefinition,
} from '../../framework/types.js';

/** Fewest and most extra inputs an expression accepts beyond `x`. */
export const MIN_EXTRA_VARIABLES = 0;
export const MAX_EXTRA_VARIABLES = 8;

/** Names the extra inputs take, in order. `x` is always present. */
const EXTRA_VARIABLE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Shared parser. expr-eval parses and evaluates without `eval`, so a formula
 * typed into the field can never run arbitrary code. Assignment, function
 * definitions, the `in` operator, and member access are switched off so an
 * expression can only read the inputs it is offered.
 */
const parser = new Parser({
  allowMemberAccess: false,
  operators: { assignment: false, fndef: false, in: false },
});

/** Config field letting the user choose how many extra inputs to show. */
export const expressionConfig: readonly ConfigFieldDefinition[] = [
  {
    name: 'extras',
    label: 'Extra variables',
    kind: 'number',
    default: MIN_EXTRA_VARIABLES,
    min: MIN_EXTRA_VARIABLES,
    max: MAX_EXTRA_VARIABLES,
    description: 'How many extra inputs, named a, b, c, and so on, to show.',
  },
];

/** Reads the extra-input count from config, clamped to the allowed range. */
export function extraCount(config: CalculatorConfig): number {
  const raw = config['extras'];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return MIN_EXTRA_VARIABLES;
  }
  return Math.min(
    MAX_EXTRA_VARIABLES,
    Math.max(MIN_EXTRA_VARIABLES, Math.round(raw)),
  );
}

/** The input names a calculator with `count` extras offers, `x` first. */
export function scopeNames(count: number): string[] {
  return ['x', ...EXTRA_VARIABLE_NAMES.slice(0, count)];
}

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Reads the expression text, or null when the field is empty. */
function expressionOf(state: Readonly<CalcState>): string | null {
  const value = state['expression'];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** A usable expression, or the reason it could not be compiled. */
type Compiled =
  | {
      readonly ok: true;
      /** Input names the expression reads. */
      readonly used: readonly string[];
      readonly evaluate: (scope: Record<string, number>) => number;
    }
  | { readonly ok: false; readonly message: string };

/**
 * Parses an expression and checks that it only names the offered inputs.
 * Returns a callable when it is usable, or a message describing the syntax
 * error or the unknown variable.
 */
export function compileExpression(
  text: string,
  names: readonly string[],
): Compiled {
  let parsed;
  try {
    parsed = parser.parse(text);
  } catch (error) {
    return { ok: false, message: messageOf(error) };
  }
  const unknown = parsed.variables().filter((name) => !names.includes(name));
  if (unknown.length > 0) {
    const plural = unknown.length > 1 ? 's' : '';
    return {
      ok: false,
      message:
        `Unknown variable${plural} ` +
        `${unknown.map((name) => `"${name}"`).join(', ')}. ` +
        `Available: ${names.join(', ')}.`,
    };
  }
  return {
    ok: true,
    used: parsed.variables(),
    evaluate: (scope) => parsed.evaluate(scope) as number,
  };
}

/** Evaluates `y` from the expression, or reports what it still needs. */
function evaluateY(
  state: Readonly<CalcState>,
  names: readonly string[],
): number | MissingValue {
  const text = expressionOf(state);
  if (text === null) {
    return missing(['expression']);
  }
  const compiled = compileExpression(text, names);
  if (!compiled.ok) {
    // The problem is reported on the expression field, so clear y silently.
    return missing([]);
  }
  const scope: Record<string, number> = {};
  const needed: string[] = [];
  for (const name of compiled.used) {
    const value = valueOf(state, name);
    if (value === null) {
      needed.push(name);
    } else {
      scope[name] = value;
    }
  }
  if (needed.length > 0) {
    return missing(needed);
  }
  try {
    const result = compiled.evaluate(scope);
    return Number.isFinite(result) ? result : missing([]);
  } catch {
    return missing([]);
  }
}

function buildVariables(
  config: CalculatorConfig,
): readonly VariableDefinition[] {
  const count = extraCount(config);
  const names = scopeNames(count);
  const variables: VariableDefinition[] = [
    {
      name: 'expression',
      label: 'Expression',
      description:
        `Formula in ${names.join(', ')}. Supports + - * / ^, parentheses, ` +
        'and functions such as sin, cos, sqrt, log, abs, and min.',
      validate: (state) => {
        const text = expressionOf(state);
        if (text === null) {
          return undefined;
        }
        const compiled = compileExpression(text, names);
        return compiled.ok ? undefined : compiled.message;
      },
    },
    {
      name: 'x',
      label: 'x',
      unit: '1',
      default: 0,
      description: 'The value of x in the expression.',
    },
  ];
  for (const name of scopeNames(count).slice(1)) {
    variables.push({
      name,
      label: name,
      unit: '1',
      description: `The value of ${name} in the expression.`,
    });
  }
  variables.push({
    name: 'y',
    label: 'y',
    unit: '1',
    editable: false,
    description: 'The value the expression evaluates to.',
    computable: (state) => evaluateY(state, names),
  });
  return variables;
}

/** Evaluates an expression in x plus up to eight extra inputs. */
export const expression: CalculatorDefinition = {
  id: 'expression',
  title: 'Expression',
  description:
    'Evaluate a formula in x and any number of extra inputs a, b, c, …. The ' +
    'number of extra inputs is a setting.',
  config: expressionConfig,
  variables: buildVariables({ extras: MIN_EXTRA_VARIABLES }),
  buildVariables,
  testCases: [
    { expression: '2 + 3', x: 0, y: 5 },
    { expression: 'x^2 - 1', x: 4, y: 15 },
    { expression: 'sin(x) + cos(x)', x: 0, y: 1 },
    { expression: 'sqrt(abs(x)) + min(x, 2)', x: -9, y: 3 - 9 },
  ],
};
