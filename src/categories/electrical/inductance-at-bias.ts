/**
 * Inductance of a part at a given current bias. The user picks a material
 * class and the part's rated inductance and saturation current, and the
 * calculator reports the inductance the saturation model gives at the chosen
 * operating current.
 */

import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import {
  findInductorType,
  inductanceAtCurrent,
  resolveInductor,
} from '../../models/inductor-types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export const inductanceAtBias: CalculatorDefinition = {
  id: 'inductance-at-bias',
  title: 'Inductance at a current bias',
  description:
    'Inductance of a real part at a chosen operating current. The current ' +
    'bias is compared with the rated saturation current, and the material ' +
    'sets how sharply the core saturates.',
  variables: [
    {
      name: 'inductance',
      label: 'Rated inductance',
      unit: 'H',
      description: 'Inductance at zero current, as the part is rated.',
      validate: (state) => {
        const inductance = valueOf(state, 'inductance');
        return inductance !== null && inductance <= 0
          ? 'Inductance must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'inductorType',
      label: 'Inductor type',
      table: 'inductor-types',
      description:
        'Material and construction class, which sets the saturation shape.',
    },
    {
      name: 'saturationCurrent',
      label: 'Rated saturation current',
      unit: 'A',
      description:
        'Current at which the inductor reaches its saturation drop, quoted ' +
        'at 25 °C.',
      validate: (state) => {
        const current = valueOf(state, 'saturationCurrent');
        return current !== null && current <= 0
          ? 'Saturation current must be greater than zero.'
          : undefined;
      },
    },
    {
      name: 'temperature',
      label: 'Temperature',
      unit: '°C',
      default: 25,
      description:
        'Operating temperature. The saturation current is derated linearly ' +
        'from the 25 °C rating to the 100 °C figure in the table.',
    },
    {
      name: 'biasCurrent',
      label: 'Operating current',
      unit: 'A',
      description: 'Current the inductor carries in use.',
    },
    {
      name: 'biasedInductance',
      label: 'Inductance at this current',
      unit: 'H',
      editable: false,
      description: 'Inductance the model gives at the operating current.',
      computable: (state) => {
        const type = state['inductorType'];
        const inductance = valueOf(state, 'inductance');
        const saturationCurrent = valueOf(state, 'saturationCurrent');
        const temperature = valueOf(state, 'temperature');
        const biasCurrent = valueOf(state, 'biasCurrent');
        if (
          typeof type !== 'string' ||
          inductance === null ||
          saturationCurrent === null ||
          temperature === null ||
          biasCurrent === null
        ) {
          return missing([
            ...(typeof type !== 'string' ? ['inductorType'] : []),
            ...(inductance === null ? ['inductance'] : []),
            ...(saturationCurrent === null ? ['saturationCurrent'] : []),
            ...(temperature === null ? ['temperature'] : []),
            ...(biasCurrent === null ? ['biasCurrent'] : []),
          ]);
        }
        const resolved = findInductorType(type);
        if (resolved === null) {
          return missing([]);
        }
        const model = resolveInductor(
          resolved,
          inductance,
          saturationCurrent,
          temperature,
        );
        return inductanceAtCurrent(model, biasCurrent);
      },
    },
  ],
};
