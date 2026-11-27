import { describe, expect, it } from 'vitest';
import { CalculatorDefinitionError } from './errors.js';
import type {
  CalculatorDefinition,
  NumberVariableDefinition,
} from './types.js';
import { isTableSelectVariable } from './types.js';
import type { UnitSymbol } from './units.js';
import { unchanged } from './unchanged.js';
import { isValidIdentifier, validateCalculatorDefinition } from './validate.js';

function baseDefinition(): CalculatorDefinition {
  return {
    id: 'sample',
    title: 'Sample',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: () => 1,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
      },
    ],
    testCases: [{ a: 1, b: 1 }],
  };
}

describe('isValidIdentifier', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(isValidIdentifier('ohms-law')).toBe(true);
    expect(isValidIdentifier('basic2')).toBe(true);
  });

  it('rejects other forms', () => {
    expect(isValidIdentifier('OhmsLaw')).toBe(false);
    expect(isValidIdentifier('ohms_law')).toBe(false);
    expect(isValidIdentifier('-ohms')).toBe(false);
    expect(isValidIdentifier('ohms--law')).toBe(false);
  });
});

describe('validateCalculatorDefinition', () => {
  it('accepts a valid definition', () => {
    expect(() => validateCalculatorDefinition(baseDefinition())).not.toThrow();
  });

  it('rejects an invalid id', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({ ...definition, id: 'Bad Id' }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects an empty title', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({ ...definition, title: '  ' }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a definition without variables', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({ ...definition, variables: [] }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects duplicate variable names', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [definition.variables[0]!, definition.variables[0]!],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects invalid variable names', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, name: '1bad' },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects empty labels', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, label: ' ' },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects unknown units', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, unit: 'not-a-unit' as UnitSymbol },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects unknown unit options', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...definition.variables[0]!,
            unitOptions: ['not-a-unit' as UnitSymbol],
          },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects duplicate unit options', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, unitOptions: ['V', 'V'] },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects unit options of a different measure', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, unitOptions: ['A'] },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('accepts a default display unit of the same measure', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...definition.variables[0]!,
            unit: 'F',
            defaultDisplayUnit: 'uF',
          },
          definition.variables[1]!,
        ],
      }),
    ).not.toThrow();
  });

  it('rejects an unknown default display unit', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...definition.variables[0]!,
            defaultDisplayUnit: 'not-a-unit' as UnitSymbol,
          },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a default display unit of a different measure', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...definition.variables[0]!, defaultDisplayUnit: 'A' },
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects test cases with unknown variables', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        testCases: [{ a: 1, b: 1, c: 2 }],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects test cases with missing variables', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        testCases: [{ a: 1 }],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects non-finite test values', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        testCases: [{ a: Number.NaN, b: 1 }],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('accepts null test values', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        testCases: [{ a: null, b: 1 }],
      }),
    ).not.toThrow();
  });

  it('accepts computeState when every computable returns unchanged', () => {
    expect(() =>
      validateCalculatorDefinition({
        id: 'compute-state-ok',
        title: 'Compute state',
        variables: [
          { name: 'a', label: 'A', unit: 'V' },
          { name: 'b', label: 'B', unit: 'V', computable: () => unchanged() },
        ],
        computeState: (state) => ({ ...state }),
      }),
    ).not.toThrow();
  });

  it('rejects computeState when a computable computes a value', () => {
    expect(() =>
      validateCalculatorDefinition({
        id: 'compute-state-bad',
        title: 'Compute state',
        variables: [
          { name: 'a', label: 'A', unit: 'V' },
          { name: 'b', label: 'B', unit: 'V', computable: () => 1 },
        ],
        computeState: (state) => ({ ...state }),
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a non-function computeState', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        computeState: 'nope' as unknown as NonNullable<
          CalculatorDefinition['computeState']
        >,
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('accepts a default on a plain input variable', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          definition.variables[0]!,
          {
            ...definition.variables[1]!,
            default: 5,
          } as NumberVariableDefinition,
        ],
      }),
    ).not.toThrow();
  });

  it('rejects a default on a computable variable', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...definition.variables[0]!,
            default: 5,
          } as NumberVariableDefinition,
          definition.variables[1]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a non-finite default', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          definition.variables[0]!,
          {
            ...definition.variables[1]!,
            default: Number.NaN,
          } as NumberVariableDefinition,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });
});

describe('validateCalculatorDefinition equivalent', () => {
  function equivalentDefinition(): CalculatorDefinition {
    return {
      id: 'equivalent',
      title: 'Equivalent',
      variables: [
        {
          name: 'area',
          label: 'Area',
          unit: 'mm^2',
          equivalent: {
            diameter: (area) => 2 * Math.sqrt(area / Math.PI),
          },
        },
        {
          name: 'diameter',
          label: 'Diameter',
          unit: 'mm',
          equivalent: {
            area: (diameter) => Math.PI * (diameter / 2) ** 2,
          },
        },
        { name: 'total', label: 'Total', unit: 'mm', computable: () => 1 },
      ],
    };
  }

  it('accepts a symmetric equivalent pair', () => {
    expect(() =>
      validateCalculatorDefinition(equivalentDefinition()),
    ).not.toThrow();
  });

  it('rejects an entry that names an unknown variable', () => {
    const definition = equivalentDefinition();
    const area = definition.variables[0] as NumberVariableDefinition;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...area, equivalent: { nope: (value) => value } },
          definition.variables[1]!,
          definition.variables[2]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects an entry that names the variable itself', () => {
    const definition = equivalentDefinition();
    const area = definition.variables[0] as NumberVariableDefinition;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          { ...area, equivalent: { area: (value) => value } },
          definition.variables[1]!,
          definition.variables[2]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects an entry whose conversion is not a function', () => {
    const definition = equivalentDefinition();
    const area = definition.variables[0] as NumberVariableDefinition;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...area,
            equivalent: { diameter: 5 } as unknown as Readonly<
              Record<string, (value: number) => number>
            >,
          },
          definition.variables[1]!,
          definition.variables[2]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a non-object equivalent map', () => {
    const definition = equivalentDefinition();
    const area = definition.variables[0] as NumberVariableDefinition;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          {
            ...area,
            equivalent: 'nope' as unknown as Readonly<
              Record<string, (value: number) => number>
            >,
          },
          definition.variables[1]!,
          definition.variables[2]!,
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });


  it('rejects a pair that is only declared one way', () => {
    const definition = equivalentDefinition();
    const area = definition.variables[0] as NumberVariableDefinition;
    const diameter = definition.variables[1] as NumberVariableDefinition;
    const { equivalent: _ignored, ...withoutEquivalent } = diameter;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [area, withoutEquivalent, definition.variables[2]!],
      }),
    ).toThrow(CalculatorDefinitionError);
  });

  it('rejects a computable variable that also declares equivalence', () => {
    const definition = equivalentDefinition();
    const total = definition.variables[2] as NumberVariableDefinition;
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: [
          definition.variables[0]!,
          definition.variables[1]!,
          { ...total, equivalent: { area: (value) => value } },
        ],
      }),
    ).toThrow(CalculatorDefinitionError);
  });
});
