import type {
  CalculatorDefinition,
  TableSource,
} from '../../framework/types.js';
import { ampHoursTimeAmps } from './amp-hours-time-amps.js';
import { capacitorStoredEnergy } from './capacitor-stored-energy.js';
import { capacitorTypesTable } from '../../models/capacitor-types.js';
import { energyWattsTime } from './energy-watts-time.js';
import { inductorStoredEnergy } from './inductor-stored-energy.js';
import { inductorTypesTable } from '../../models/inductor-types.js';
import { capacitanceAtDcBias } from './capacitance-at-dc-bias.js';
import { capacitorImpedance } from './capacitor-impedance.js';
import { capacitorParallel } from './capacitor-parallel.js';
import { eSeriesCapacitors, eSeriesResistors } from './e-series.js';
import { friis } from './friis.js';
import { highPassRlc } from './high-pass-rlc.js';
import { inductanceAtBias } from './inductance-at-bias.js';
import { inductorImpedance } from './inductor-impedance.js';
import { lowPassRlc } from './low-pass-rlc.js';
import { ohmsLaw } from './ohms-law.js';
import { pcbTraceResistance } from './pcb-trace-resistance.js';
import { resistorParallel } from './resistor-parallel.js';
import { voltageDivider } from './voltage-divider.js';
import { wireGaugeTable } from './wire-gauge.js';
import { wireMetalsTable } from './wire-metals.js';
import { wireResistance } from './wire-resistance.js';

export const tables: readonly TableSource[] = [
  inductorTypesTable,
  capacitorTypesTable,
  eSeriesResistors,
  eSeriesCapacitors,
  wireGaugeTable,
  wireMetalsTable,
];

export const calculators: readonly CalculatorDefinition[] = [
  ohmsLaw,
  voltageDivider,
  resistorParallel,
  capacitorParallel,
  pcbTraceResistance,
  lowPassRlc,
  highPassRlc,
  inductorImpedance,
  capacitorImpedance,
  inductanceAtBias,
  capacitanceAtDcBias,
  wireResistance,
  friis,
  ampHoursTimeAmps,
  energyWattsTime,
  capacitorStoredEnergy,
  inductorStoredEnergy,
];
