/**
 * Capacitance of a part at a DC bias. The user picks a dielectric and package
 * and enters the rated capacitance and voltage rating, and the calculator
 * reports the capacitance the DC-bias model gives at the chosen voltage.
 */

import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import {
  capacitanceAtVoltage,
  findCapacitorType,
  resolveCapacitor,
} from '../../models/capacitor-types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export const capacitanceAtDcBias: CalculatorDefinition = {
  id: 'capacitance-at-dc-bias',
  title: 'Capacitance at a DC bias',
  description:
    'Effective capacitance of a real part at a DC voltage. Ceramic ' +
    'dielectrics lose capacitance as they are biased, and the model ' +
    'estimates how much at the chosen voltage.',
  variables: [
    {
      name: 'capacitance',
      label: 'Rated capacitance',
      unit: 'F',
      defaultDisplayUnit: 'µF',
      description: 'Capacitance at zero bias, as the part is rated.',
      validate: (state) => {
        const capacitance = valueOf(state, 'capacitance');
        return capacitance !== null && capacitance <= 0
          ? 'Capacitance must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'capacitorType',
      label: 'Capacitor type',
      table: 'capacitor-types',
      description: 'Dielectric and package, which set the DC-bias behaviour.',
    },
    {
      name: 'voltageRating',
      label: 'Voltage rating',
      unit: 'V',
      description:
        'Working voltage of the part. Caps the knee voltage of the ' +
        'DC-bias model; not used by linear types such as C0G.',
      validate: (state) => {
        const rating = valueOf(state, 'voltageRating');
        return rating !== null && rating <= 0
          ? 'Voltage rating must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'biasVoltage',
      label: 'DC bias voltage',
      unit: 'V',
      description: 'DC voltage across the capacitor in use.',
    },
    {
      name: 'biasedCapacitance',
      label: 'Capacitance at this voltage',
      unit: 'F',
      defaultDisplayUnit: 'µF',
      editable: false,
      description: 'Capacitance the model gives at the DC bias voltage.',
      computable: (state) => {
        const type = state['capacitorType'];
        const capacitance = valueOf(state, 'capacitance');
        const voltageRating = valueOf(state, 'voltageRating');
        const biasVoltage = valueOf(state, 'biasVoltage');
        if (
          typeof type !== 'string' ||
          capacitance === null ||
          voltageRating === null ||
          biasVoltage === null
        ) {
          return missing([
            ...(typeof type !== 'string' ? ['capacitorType'] : []),
            ...(capacitance === null ? ['capacitance'] : []),
            ...(voltageRating === null ? ['voltageRating'] : []),
            ...(biasVoltage === null ? ['biasVoltage'] : []),
          ]);
        }
        const resolved = findCapacitorType(type);
        if (resolved === null) {
          return missing([]);
        }
        const model = resolveCapacitor(resolved, capacitance, voltageRating);
        return capacitanceAtVoltage(model, biasVoltage);
      },
    },
  ],
};
