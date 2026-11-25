/**
 * Builds the output-display graph shown after a run: series current and load
 * capacitor voltage against time. Chart.js is imported on demand so it stays
 * out of the category bundle until a simulation actually runs.
 */

import type { Chart, ChartConfiguration } from 'chart.js';
import { chartIndices } from './decimate.js';

const DEFAULT_MAX_POINTS = 1000;
const DEFAULT_CURRENT_COLOR = '#2563eb';
const DEFAULT_VOLTAGE_COLOR = '#dc2626';
const GRID_COLOR = 'rgba(128, 128, 128, 0.25)';

/** Vectors drawn by the inrush graph, all the same length. */
export interface InrushChartData {
  /** Time in seconds. */
  readonly time: Float64Array;
  /** Current through the series branch, in amps. */
  readonly current: Float64Array;
  /** Load capacitor voltage, in volts. */
  readonly voltage: Float64Array;
}

/** A ready-to-display graph and the hook that tears it down. */
export interface OutputChart {
  readonly node: HTMLElement;
  dispose(): void;
}

/**
 * Draws the inrush waveforms into a detached element. The caller decides when
 * to show it and must call `dispose` (the runtime does this for items from
 * `context.display`) so the chart instance is released.
 */
export async function createInrushChart(
  data: InrushChartData,
  maxPoints = DEFAULT_MAX_POINTS,
): Promise<OutputChart> {
  const node = document.createElement('div');
  node.className = 'calc-output-canvas';
  const canvas = document.createElement('canvas');
  node.append(canvas);

  const indices = chartIndices([data.current, data.voltage], maxPoints);
  const millis = (index: number): number => data.time[index]! * 1000;
  const currentPoints = indices.map((index) => ({
    x: millis(index),
    y: data.current[index]!,
  }));
  const voltagePoints = indices.map((index) => ({
    x: millis(index),
    y: data.voltage[index]!,
  }));

  const styles = getComputedStyle(node);
  const textColor = styles.color || 'currentColor';
  const currentColor =
    styles.getPropertyValue('--accent-color').trim() || DEFAULT_CURRENT_COLOR;

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Series current',
          data: currentPoints,
          yAxisID: 'current',
          borderColor: currentColor,
          backgroundColor: currentColor,
          borderWidth: 2,
        },
        {
          label: 'Capacitor voltage',
          data: voltagePoints,
          yAxisID: 'voltage',
          borderColor: DEFAULT_VOLTAGE_COLOR,
          backgroundColor: DEFAULT_VOLTAGE_COLOR,
          borderWidth: 2,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      color: textColor,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Time (ms)' },
          grid: { color: GRID_COLOR },
        },
        current: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Series current (A)' },
          grid: { color: GRID_COLOR },
        },
        voltage: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Capacitor 1 voltage (V)' },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: { legend: { display: true } },
    },
  };

  const module = await import('chart.js/auto');
  const ChartConstructor = module.default;
  const chart: Chart = new ChartConstructor(canvas, config);

  return {
    node,
    dispose(): void {
      chart.destroy();
    },
  };
}
