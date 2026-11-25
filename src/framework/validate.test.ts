import { describe, expect, it } from 'vitest';
import { CalculatorDefinitionError } from './errors.js';
import type { CalculatorDefinition } from './types.js';
import type { UnitSymbol } from './units.js';
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

  it('rejects a definition without a computable variable', () => {
    const definition = baseDefinition();
    expect(() =>
      validateCalculatorDefinition({
        ...definition,
        variables: definition.variables.map((variable) => {
          const { computable: _computable, ...rest } = variable;
          return rest;
        }),
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
});
