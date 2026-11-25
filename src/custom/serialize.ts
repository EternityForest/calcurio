import { CustomDefinitionError } from '../framework/errors.js';
import type {
  CalcValue,
  CalculatorConfig,
  CalcState,
  ConfigValue,
} from '../framework/types.js';
import { isUnitSymbol } from '../framework/units.js';
import { isValidIdentifier } from '../framework/validate.js';
import { CUSTOM_VERSION } from './types.js';
import type { CustomDefinition, CustomStep, StepVariable } from './types.js';

/** Longest text accepted from a stored custom (labels, defaults, row keys). */
export const MAX_CUSTOM_STRING_LENGTH = 2000;

/** Renders a custom as the JSON shown in the export box and written to files. */
export function customToJson(custom: CustomDefinition): string {
  return `${JSON.stringify(custom, null, 2)}\n`;
}

/** Parses exported JSON text back into a custom, raising on anything broken. */
export function customFromJson(text: string): CustomDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new CustomDefinitionError('The custom text is not valid JSON.', {
      cause: error,
    });
  }
  return parseCustom(parsed);
}

/**
 * Structural parse of a custom. Checks every field's shape and primitive type
 * without needing a catalog, so stored and pasted customs can be trusted
 * before they reach the compiler. Catalog-dependent checks live in
 * `validate.ts`.
 */
export function parseCustom(value: unknown): CustomDefinition {
  if (!isRecord(value)) {
    throw invalid('A custom must be an object.');
  }
  if (value['version'] !== CUSTOM_VERSION) {
    throw invalid(`A custom version must be ${CUSTOM_VERSION}.`);
  }
  const id = requireString(value, 'id', 'A custom');
  if (!isValidIdentifier(id)) {
    throw invalid(
      `Custom id "${id}" must use lowercase letters, digits, and hyphens.`,
    );
  }
  const title = requireString(value, 'title', 'A custom');
  const description = optionalString(value, 'description', 'A custom');
  const rawSteps = value['steps'];
  if (!Array.isArray(rawSteps)) {
    throw invalid('A custom must have a "steps" array.');
  }
  const steps = rawSteps.map((step, index) => parseStep(step, index));
  return {
    version: CUSTOM_VERSION,
    id,
    title,
    steps,
    ...(description === undefined ? {} : { description }),
  };
}

function parseStep(value: unknown, index: number): CustomStep {
  const where = `Step ${index + 1}`;
  if (!isRecord(value)) {
    throw invalid(`${where} must be an object.`);
  }
  const id = requireString(value, 'id', where);
  const label = requireString(value, 'label', where);
  const hidden = optionalBoolean(value, 'hidden', where);
  const shared = {
    id,
    label,
    ...(hidden === undefined ? {} : { hidden }),
  };

  switch (value['kind']) {
    case 'subcalc':
      return {
        kind: 'subcalc',
        ...shared,
        calculatorId: requireString(value, 'calculatorId', where),
        config: parseConfig(value['config'], where),
        values: parseState(value['values'], where),
        variables: parseVariables(value['variables'], where),
      };
    case 'variable': {
      const unit = requireString(value, 'unit', where);
      if (!isUnitSymbol(unit)) {
        throw invalid(`${where} has an unknown unit "${unit}".`);
      }
      const fallback = optionalFiniteNumber(value, 'default', where);
      return {
        kind: 'variable',
        ...shared,
        unit,
        ...(fallback === undefined ? {} : { default: fallback }),
        variable: parseStepVariable(value['variable'], `${where} value`),
      };
    }
    case 'text': {
      const fallback = optionalString(value, 'default', where);
      return {
        kind: 'text',
        ...shared,
        ...(fallback === undefined ? {} : { default: fallback }),
        variable: parseStepVariable(value['variable'], `${where} value`),
      };
    }
    default:
      throw invalid(`${where} has an unknown kind.`);
  }
}

function parseStepVariable(value: unknown, where: string): StepVariable {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw invalid(`${where} wiring must be an object.`);
  }
  const takeFrom = optionalString(value, 'takeFrom', where);
  const hidden = optionalBoolean(value, 'hidden', where);
  return {
    ...(takeFrom === undefined ? {} : { takeFrom }),
    ...(hidden === undefined ? {} : { hidden }),
  };
}

function parseConfig(value: unknown, where: string): CalculatorConfig {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw invalid(`${where} settings must be an object.`);
  }
  const config: Record<string, ConfigValue> = {};
  for (const [name, raw] of Object.entries(value)) {
    config[name] = parseConfigValue(raw, `${where} setting "${name}"`);
  }
  return config;
}

function parseState(value: unknown, where: string): CalcState {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw invalid(`${where} values must be an object.`);
  }
  const state: CalcState = {};
  for (const [name, raw] of Object.entries(value)) {
    state[name] = parseCell(raw, `${where} value "${name}"`);
  }
  return state;
}

function parseVariables(
  value: unknown,
  where: string,
): Record<string, StepVariable> {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw invalid(`${where} variables must be an object.`);
  }
  const variables: Record<string, StepVariable> = {};
  for (const [name, raw] of Object.entries(value)) {
    variables[name] = parseStepVariable(raw, `${where} variable "${name}"`);
  }
  return variables;
}

function parseConfigValue(value: unknown, where: string): ConfigValue {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalid(`${where} must be a finite number.`);
    }
    return value;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  throw invalid(`${where} must be a number, text, or true/false.`);
}

function parseCell(value: unknown, where: string): CalcValue {
  if (value === null) {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw invalid(`${where} must be a finite number.`);
    }
    return value;
  }
  if (typeof value === 'string') {
    if (value.length > MAX_CUSTOM_STRING_LENGTH) {
      throw invalid(`${where} is too long.`);
    }
    return value;
  }
  throw invalid(`${where} must be a number, text, or null.`);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  where: string,
): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw invalid(`${where} must have a "${key}" string.`);
  }
  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  where: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalid(`${where} "${key}" must be a string.`);
  }
  if (value.length > MAX_CUSTOM_STRING_LENGTH) {
    throw invalid(`${where} "${key}" is too long.`);
  }
  return value;
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
  where: string,
): boolean | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw invalid(`${where} "${key}" must be true or false.`);
  }
  return value;
}

function optionalFiniteNumber(
  record: Record<string, unknown>,
  key: string,
  where: string,
): number | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalid(`${where} "${key}" must be a finite number.`);
  }
  return value;
}

function invalid(message: string): CustomDefinitionError {
  return new CustomDefinitionError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
