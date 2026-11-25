import type {
  CalculatorDefinition,
  TableSource,
} from '../../framework/types.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { capacitanceAtDcBias } from './capacitance-at-dc-bias.js';
import { capacitorImpedance } from './capacitor-impedance.js';
import { eSeriesCapacitors, eSeriesResistors } from './e-series.js';
import { highPassRlc } from './high-pass-rlc.js';
import { inductanceAtBias } from './inductance-at-bias.js';
import { inductorImpedance } from './inductor-impedance.js';
import { lowPassRlc } from './low-pass-rlc.js';
import { ohmsLaw } from './ohms-law.js';
import { voltageDivider } from './voltage-divider.js';

export const tables: readonly TableSource[] = [
  inductorTypesTable,
  capacitorTypesTable,
  eSeriesResistors,
  eSeriesCapacitors,
];

export const calculators: readonly CalculatorDefinition[] = [
  ohmsLaw,
  voltageDivider,
  lowPassRlc,
  highPassRlc,
  inductorImpedance,
  capacitorImpedance,
  inductanceAtBias,
  capacitanceAtDcBias,
];
