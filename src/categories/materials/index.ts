import type {
  CalculatorDefinition,
  TableDefinition,
} from '../../framework/types.js';
import { materialsTable } from '../../models/materials.js';
import { energyAndTemperatureChange } from './energy-and-temperature-change.js';
import { phaseChangeHeat } from './phase-change-heat.js';
import { volumeVsWeight } from './volume-vs-weight.js';

export const tables: readonly TableDefinition[] = [materialsTable];

export const calculators: readonly CalculatorDefinition[] = [
  energyAndTemperatureChange,
  phaseChangeHeat,
  volumeVsWeight,
];
