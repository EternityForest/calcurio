import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Discharge through a sharp-edged orifice under a falling head. The flow is
 * Q = Cd·A·√(2gh), with the orifice area taken from its diameter and the head
 * measured from the centre of the orifice to the free surface.
 */
export const orificeFlow: CalculatorDefinition = {
  id: 'orifice-flow',
  title: 'Orifice flow',
  description:
    'Flow through a submerged orifice under a head, Q = Cd·A·√(2gh). The ' +
    'discharge coefficient defaults to 0.62 for a sharp-edged opening.',
  variables: [
    {
      name: 'dischargeCoefficient',
      label: 'Discharge coefficient',
      unit: '1',
      default: 0.62,
      description:
        'Ratio of actual to ideal flow. About 0.62 for a sharp-edged ' +
        'orifice, higher for a rounded or bell-mouthed one.',
      validate: (state) => {
        const coefficient = valueOf(state, 'dischargeCoefficient');
        return coefficient !== null && (coefficient <= 0 || coefficient > 1)
          ? 'Discharge coefficient must be between 0 and 1.'
          : undefined;
      },
    },
    {
      name: 'orificeDiameter',
      label: 'Orifice diameter',
      unit: 'mm',
      description: 'Diameter of the opening.',
      validate: (state) => {
        const diameter = valueOf(state, 'orificeDiameter');
        return diameter !== null && diameter <= 0
          ? 'Orifice diameter must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'head',
      label: 'Head',
      unit: 'm',
      description:
        'Height of the free surface above the centre of the orifice.',
      validate: (state) => {
        const head = valueOf(state, 'head');
        return head !== null && head < 0
          ? 'Head must not be negative.'
          : undefined;
      },
    },
    {
      name: 'gravity',
      label: 'Gravity',
      unit: 'm/s2',
      default: 9.80665,
      description: 'Acceleration due to gravity.',
      validate: (state) => {
        const gravity = valueOf(state, 'gravity');
        return gravity !== null && gravity <= 0
          ? 'Gravity must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'flowRate',
      label: 'Flow rate',
      unit: 'm3/s',
      defaultDisplayUnit: 'l/min',
      editable: false,
      description: 'Volumetric flow through the orifice.',
      computable: (state) => {
        const coefficient = valueOf(state, 'dischargeCoefficient');
        const diameter = valueOf(state, 'orificeDiameter');
        const head = valueOf(state, 'head');
        const gravity = valueOf(state, 'gravity');
        if (
          coefficient === null ||
          diameter === null ||
          head === null ||
          gravity === null
        ) {
          return missing([
            ...(coefficient === null ? ['dischargeCoefficient'] : []),
            ...(diameter === null ? ['orificeDiameter'] : []),
            ...(head === null ? ['head'] : []),
            ...(gravity === null ? ['gravity'] : []),
          ]);
        }
        const area = (Math.PI * (diameter / 1000) ** 2) / 4;
        return coefficient * area * Math.sqrt(2 * gravity * head);
      },
    },
  ],
  testCases: [
    {
      dischargeCoefficient: 0.62,
      orificeDiameter: 50,
      head: 1,
      gravity: 9.80665,
      flowRate: 0.005391342409245851,
    },
    {
      dischargeCoefficient: 0.6,
      orificeDiameter: 100,
      head: 2,
      gravity: 9.80665,
      flowRate: 0.029514230533752468,
    },
    {
      dischargeCoefficient: 0.98,
      orificeDiameter: 10,
      head: 0.5,
      gravity: 9.80665,
      flowRate: 0.0002410328826923118,
    },
  ],
};
