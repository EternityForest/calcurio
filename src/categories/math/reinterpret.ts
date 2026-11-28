import type { CalculatorDefinition } from '../../framework/types.js';
import type {
  CalculatorConfig,
  ConfigFieldDefinition,
  VariableDefinition,
} from '../../framework/types.js';
import { convertUnit, defaultUnitForMeasure, measurementKinds } from '../../framework/units.js';
import type { MeasureName, UnitSymbol } from '../../framework/units.js';

/** Measurement kinds available for selection on each side. */
const MEASURE_KINDS = [...measurementKinds(), '1'];

/** Config field for selecting the measurement kind of Value A. */
const kindConfigA: ConfigFieldDefinition = {
  name: 'kindA',
  label: 'Kind A',
  kind: 'select',
  default: '1',
  options: MEASURE_KINDS,
  description: 'Measurement kind for Value A.',
};

/** Config field for selecting the measurement kind of Value B. */
const kindConfigB: ConfigFieldDefinition = {
  name: 'kindB',
  label: 'Kind B',
  kind: 'select',
  default: '1',
  options: MEASURE_KINDS,
  description: 'Measurement kind for Value B.',
};

/** Reads the kind from config, defaulting to dimensionless. */
function getKind(config: CalculatorConfig, suffix: string): MeasureName | '1' {
  const raw = config[suffix];
  if (typeof raw !== 'string') {
    return '1';
  }
  return MEASURE_KINDS.includes(raw as MeasureName) ? (raw as MeasureName) : '1';
}

/** Converts a value between two units, returning unchanged on failure. */
function convert(value: number, from: UnitSymbol, to: UnitSymbol): number {
  if (from === to) return value;
  try {
    return convertUnit(value, from, to);
  } catch {
    return value;
  }
}

/** Builds variables whose units are driven by the kindA/kindB config. */
function buildVariables(
  config: CalculatorConfig,
): readonly VariableDefinition[] {
  const kindA = getKind(config, 'kindA');
  const kindB = getKind(config, 'kindB');
  const unitA = kindA === 'dimensionless' || kindA === '1'
    ? '1'
    : defaultUnitForMeasure(kindA as MeasureName);
  const unitB = kindB === 'dimensionless' || kindB === '1'
    ? '1'
    : defaultUnitForMeasure(kindB as MeasureName);

  return [
    {
      name: 'valueA',
      label: 'Value A',
      unit: unitA,
      defaultDisplayUnit: unitA,
      description: 'First value. Edit this or Value B to set the quantity.',
      equivalent: {
        valueB: (value: number) => {
          const converted = convert(value, unitA, unitB);
          return typeof converted === 'number' ? String(converted) : '';
        },
      },
    },
    {
      name: 'valueB',
      label: 'Value B',
      unit: unitB,
      defaultDisplayUnit: unitB,
      description: 'Second value, equal to Value A in a different unit.',
      editable: true,
      equivalent: {
        valueA: (value: number) => {
          const converted = convert(value, unitB, unitA);
          return typeof converted === 'number' ? String(converted) : '';
        },
      },
    },
  ];
}

/**
 * Enter a value and see it copy to the other field, reinterpreted in a
 * different unit system. Each field has its own Kind selector so you can
 * compare quantities across measurement systems.
 */
export const reinterpret: CalculatorDefinition = {
  id: 'reinterpret',
  title: 'Reinterpret',
  description:
    'Enter a value and see it copy to the other field, reinterpreted in a ' +
    'different unit system. Each field has its own Kind selector.',
  config: [kindConfigA, kindConfigB],
  variables: buildVariables({ kindA: '1', kindB: '1' }),
  buildVariables,
  testCases: [
    { valueA: 100, valueB: 100 }, // same unit
    { valueA: 0, valueB: 0 },
    { valueA: -42, valueB: -42 },
  ],
};
