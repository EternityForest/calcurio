/**
 * Capacitor inrush transient calculator. The circuit and timing are handed to
 * ngspice, which returns the waveforms; the calculator reports peak voltage,
 * peak current, and the energy burned in each series resistance, and shows the
 * current and voltage traces.
 */

import { errorMessage } from '../../framework/errors.js';
import type { ComputeStateContext } from '../../framework/output.js';
import type { CalcState, CalculatorDefinition } from '../../framework/types.js';
import { unchanged } from '../../framework/unchanged.js';
import { convertUnit } from '../../framework/units.js';
import { createInrushChart } from './chart.js';
import {
  VECTOR_CAPACITOR1_VOLTAGE,
  VECTOR_SERIES_CURRENT,
  VECTOR_TIME,
  buildNetlist,
} from './circuit.js';
import { computeMetrics } from './metrics.js';
import { findVector } from './rawfile.js';
import type { RawFile } from './rawfile.js';
import { simulate } from './simulate.js';

/** Runs needing more samples than this are refused before ngspice starts. */
const MAX_SAMPLES = 5_000_000;

/**
 * A validator that complains only about values the user has actually entered;
 * blank fields are reported by the runtime's "needs a value" hint instead.
 */
function aboveZero(
  name: string,
  message: string,
): (state: Readonly<CalcState>) => string | undefined {
  return (state) => {
    const value = state[name];
    if (typeof value === 'number' && Number.isFinite(value) && value <= 0) {
      return message;
    }
    return undefined;
  };
}

/** Reads a positive input, failing with a message fit for the UI. */
function positive(
  state: Readonly<CalcState>,
  name: string,
  label: string,
): number {
  const value = state[name];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return value;
}

/** Cross-checks the step against the length once both have values. */
function checkTiming(state: Readonly<CalcState>): string | undefined {
  const step = state['step'];
  const length = state['length'];
  if (typeof step !== 'number' || typeof length !== 'number') {
    return undefined;
  }
  if (step <= 0) {
    return 'The time step must be greater than zero.';
  }
  if (length <= 0) {
    return 'The simulation length must be greater than zero.';
  }
  const stepSeconds = convertUnit(step, 'ns', 's');
  const stopSeconds = convertUnit(length, 'ms', 's');
  if (stepSeconds > stopSeconds) {
    return 'The time step cannot be longer than the simulation.';
  }
  const samples = Math.round(stopSeconds / stepSeconds) + 1;
  if (samples > MAX_SAMPLES) {
    return `That needs ${samples} samples; use a longer time step.`;
  }
  return undefined;
}

/** Draws the run's waveforms, falling back to text if plotting is impossible. */
async function drawGraph(
  context: ComputeStateContext,
  data: RawFile,
): Promise<void> {
  const time = findVector(data, VECTOR_TIME);
  const current = findVector(data, VECTOR_SERIES_CURRENT);
  const voltage = findVector(data, VECTOR_CAPACITOR1_VOLTAGE);
  if (
    time === undefined ||
    current === undefined ||
    voltage === undefined ||
    context.signal.aborted
  ) {
    return;
  }

  try {
    const chart = await createInrushChart({ time, current, voltage });
    context.display(chart.node, () => chart.dispose());
  } catch (error) {
    context.display(`The graph could not be drawn: ${errorMessage(error)}`);
  }
}

export const inrushTransient: CalculatorDefinition = {
  id: 'inrush-transient',
  title: 'Inrush Transient',
  description:
    'Simulates switching a supply through an inductance and resistance onto ' +
    'two capacitors, the second behind its own resistance. Fill in the ' +
    'circuit, then press Run simulation to get the peaks, the energy ' +
    'dissipated in the resistors, and a graph of the waveforms.',
  variables: [
    {
      name: 'sourceVoltage',
      label: 'Source voltage',
      unit: 'V',
      description: 'Voltage switched onto the circuit at the start.',
      validate: aboveZero('sourceVoltage', 'Enter a voltage above zero.'),
    },
    {
      name: 'seriesInductance',
      label: 'Series inductance',
      unit: 'H',
      description: 'Inductance between the supply and the capacitors.',
      validate: aboveZero(
        'seriesInductance',
        'The inductance must be greater than zero.',
      ),
    },
    {
      name: 'seriesResistance',
      label: 'Series resistance',
      unit: 'Ω',
      description: 'Resistance in series with the inductance.',
      validate: aboveZero(
        'seriesResistance',
        'The series resistance must be greater than zero.',
      ),
    },
    {
      name: 'capacitance1',
      label: 'Capacitance 1',
      unit: 'F',
      description: 'Capacitor directly across the load.',
      validate: aboveZero(
        'capacitance1',
        'Capacitance 1 must be greater than zero.',
      ),
    },
    {
      name: 'dampingResistance',
      label: 'Damping resistance',
      unit: 'Ω',
      description: 'Resistance in series with the second capacitor.',
      validate: aboveZero(
        'dampingResistance',
        'The damping resistance must be greater than zero.',
      ),
    },
    {
      name: 'capacitance2',
      label: 'Capacitance 2',
      unit: 'F',
      description: 'Capacitor behind the damping resistance.',
      validate: aboveZero(
        'capacitance2',
        'Capacitance 2 must be greater than zero.',
      ),
    },
    {
      name: 'step',
      label: 'Time step',
      unit: 'ns',
      unitOptions: ['ns', 'mu', 'ms', 's'],
      default: 100,
      description: 'Spacing ngspice uses for the stored samples.',
      validate: checkTiming,
    },
    {
      name: 'length',
      label: 'Simulation length',
      unit: 'ms',
      unitOptions: ['ns', 'mu', 'ms', 's'],
      default: 100,
      description: 'How much time the simulation covers.',
    },
    {
      name: 'peakCapacitor1Voltage',
      label: 'Peak capacitor 1 voltage',
      unit: 'V',
      editable: false,
      description: 'Largest load capacitor voltage of the run.',
      computable: () => unchanged(),
    },
    {
      name: 'peakSeriesCurrent',
      label: 'Peak series current',
      unit: 'A',
      editable: false,
      description: 'Largest current through the series resistance.',
      computable: () => unchanged(),
    },
    {
      name: 'energySeriesResistance',
      label: 'Energy in series resistance',
      unit: 'J',
      editable: false,
      description: 'Energy dissipated in the series resistance.',
      computable: () => unchanged(),
    },
    {
      name: 'energyDampingResistance',
      label: 'Energy in damping resistance',
      unit: 'J',
      editable: false,
      description: 'Energy dissipated in the damping resistance.',
      computable: () => unchanged(),
    },
  ],
  async computeState(state, context) {
    const circuit = {
      sourceVoltage: positive(state, 'sourceVoltage', 'The source voltage'),
      seriesInductance: positive(
        state,
        'seriesInductance',
        'The series inductance',
      ),
      seriesResistance: positive(
        state,
        'seriesResistance',
        'The series resistance',
      ),
      capacitance1: positive(state, 'capacitance1', 'Capacitance 1'),
      dampingResistance: positive(
        state,
        'dampingResistance',
        'The damping resistance',
      ),
      capacitance2: positive(state, 'capacitance2', 'Capacitance 2'),
    };
    const analysis = {
      step: convertUnit(positive(state, 'step', 'The time step'), 'ns', 's'),
      stop: convertUnit(
        positive(state, 'length', 'The simulation length'),
        'ms',
        's',
      ),
    };

    const netlist = buildNetlist(circuit, analysis);
    const data = await simulate(netlist, context.signal);
    const metrics = computeMetrics(data, {
      seriesResistance: circuit.seriesResistance,
      dampingResistance: circuit.dampingResistance,
    });
    await drawGraph(context, data);

    return { ...state, ...metrics };
  },
};
