import { missing } from '../../framework/missing.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';

function valueOf(state: Readonly<CalcState>, name: string): number | null {
  const value = state[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * PCB trace resistance calculator.
 * Uses the formula: R = ρ * L / (W * T)
 * where ρ = 1.72e-8 Ω·m (copper resistivity)
 *
 * Inputs:
 * - Width in mils (1 mil = 0.001 inch)
 * - Copper thickness in oz (1 oz = 1.378 mils of copper)
 * - Length in mm
 *
 * Output:
 * - Resistance in milliohms
 */
export const pcbTraceResistance: CalculatorDefinition = {
  id: 'pcb-trace-resistance',
  title: 'PCB trace resistance',
  description:
    'Calculate the resistance of a copper trace on a PCB. ' +
    'Enter the trace width in mils, copper thickness in ounces, and length in millimeters.',
  variables: [
    {
      name: 'widthMils',
      label: 'Width',
      unit: 'mm',
      description: 'Trace width in mils (1 mil = 0.001 inch).',
    },
    {
      name: 'thicknessOz',
      label: 'Copper thickness',
      unit: 'mm',
      description: 'Copper weight in ounces (1 oz ≈ 1.378 mils thick).',
    },
    {
      name: 'lengthMm',
      label: 'Length',
      unit: 'mm',
      description: 'Trace length in millimeters.',
    },
    {
      name: 'resistanceMOhms',
      label: 'Resistance',
      unit: 'mohm',
      description: 'Trace resistance in milliohms.',
      computable: (state) => {
        const widthMils = valueOf(state, 'widthMils');
        const thicknessOz = valueOf(state, 'thicknessOz');
        const lengthMm = valueOf(state, 'lengthMm');
        if (
          widthMils === null ||
          thicknessOz === null ||
          lengthMm === null
        ) {
          return missing([
            ...(widthMils === null ? ['widthMils'] : []),
            ...(thicknessOz === null ? ['thicknessOz'] : []),
            ...(lengthMm === null ? ['lengthMm'] : []),
          ]);
        }
        if (widthMils <= 0 || thicknessOz <= 0 || lengthMm <= 0) {
          return missing([]);
        }
        // R = ρ * L / (W * T)
        // ρ = 1.72e-8 Ω·m
        // Convert: width_mils → m: widthMils * 2.54e-5
        //          thickness_oz → m: thicknessOz * 3.5e-5
        //          length_mm → m: lengthMm * 1e-3
        // Result in Ω, convert to mΩ by multiplying by 1000
        // R_mΩ = 1.72e-8 * (lengthMm * 1e-3) / (widthMils * 2.54e-5 * thicknessOz * 3.5e-5) * 1000
        // R_mΩ = 19.35 * lengthMm / (widthMils * thicknessOz)
        const rho = 1.72e-8;
        const widthM = widthMils * 2.54e-5;
        const thicknessM = thicknessOz * 3.5e-5;
        const lengthM = lengthMm * 1e-3;
        const resistance = (rho * lengthM) / (widthM * thicknessM);
        return resistance * 1000; // Convert to milliohms
      },
    },
  ],
  testCases: [
    { widthMils: 10, thicknessOz: 1, lengthMm: 100, resistanceMOhms: 19.35 },
    { widthMils: 10, thicknessOz: 1, lengthMm: 50, resistanceMOhms: 9.675 },
    { widthMils: 20, thicknessOz: 1, lengthMm: 100, resistanceMOhms: 9.675 },
    { widthMils: 10, thicknessOz: 2, lengthMm: 100, resistanceMOhms: 9.675 },
    { widthMils: 5, thicknessOz: 0.5, lengthMm: 100, resistanceMOhms: 77.4 },
  ],
};