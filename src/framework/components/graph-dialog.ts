import type { Chart, ChartConfiguration } from 'chart.js';
import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../errors.js';
import { formatNumber } from '../format.js';
import {
  DEFAULT_GRAPH_STEPS,
  GraphSweep,
  baseUnitOf,
  buildGraphPlan,
  formatGraphNumber,
  defaultGraphRange,
} from '../graph.js';
import type { GraphPlan, GraphPoint } from '../graph.js';
import type { CalculatorRuntime } from '../runtime.js';
import { convertUnit } from '../units.js';
import type { UnitSymbol } from '../units.js';

let nextDialogId = 0;

/** Fallback line colour when the theme does not expose an accent. */
const DEFAULT_LINE_COLOR = '#2563eb';
const GRID_COLOR = 'rgba(128, 128, 128, 0.25)';

/**
 * Modal for plotting one variable against another. The X axis is the field the
 * user asked to plot; the Y axis is any other computable variable. Points are
 * sampled on the runtime's isolated copy in time-budgeted batches, so a long
 * run stays cancellable instead of freezing the page.
 */
export class GraphDialog extends LitElement {
  static override properties = {
    runtime: { attribute: false },
  };

  declare runtime: CalculatorRuntime | undefined;

  private axisName = '';
  private targetName = '';
  private axisUnit: UnitSymbol | null = null;
  private minText = '';
  private maxText = '';
  private stepsText = String(DEFAULT_GRAPH_STEPS);
  private running = false;
  private error = '';
  private status = '';
  private readonly points: GraphPoint[] = [];
  private sweep: GraphSweep | null = null;
  private rafId: number | null = null;
  private chart: Chart | null = null;
  private readonly titleId = `calc-graph-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override disconnectedCallback(): void {
    this.stopRun('');
    this.destroyChart();
    super.disconnectedCallback();
  }

  /** Resets the form for `xName` and opens the modal. */
  open(xName: string): void {
    const runtime = this.runtime;
    if (runtime === undefined) {
      return;
    }
    this.stopRun('');
    this.axisName = xName;
    this.axisUnit = runtime.displayUnitFor(xName) ?? baseUnitOf(runtime, xName);
    this.targetName = runtime.graphTargets(xName)[0] ?? '';
    this.stepsText = String(DEFAULT_GRAPH_STEPS);
    this.applyDefaultRange();
    this.points.length = 0;
    this.error = '';
    this.status = '';
    this.chart?.update('none');
    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.showDialog();
    });
  }

  /** Stops any run and closes the modal. */
  close(): void {
    this.stopRun('');
    const dialog = this.dialogElement;
    if (dialog === null) {
      return;
    }
    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  override render(): TemplateResult | typeof nothing {
    const runtime = this.runtime;
    if (runtime === undefined || this.axisName === '') {
      return nothing;
    }
    const axisLabel = runtime.variable(this.axisName).label;
    const targets = runtime.graphTargets(this.axisName);

    return html`
      <dialog
        class="calc-dialog calc-graph-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Plot ${axisLabel}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${
            targets.length === 0
              ? html`
                  <p class="alert warning">
                    This calculator has no other computable value to plot.
                  </p>
                `
              : this.renderControls(runtime, targets)
          }
          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }
          ${
            this.statusText === ''
              ? nothing
              : html`<p class="help calc-status" role="status">
                  ${this.statusText}
                </p>`
          }

          <div class="calc-graph-canvas">
            <canvas data-testid="graph-canvas"></canvas>
          </div>
        </div>
      </dialog>
    `;
  }

  private renderControls(
    runtime: CalculatorRuntime,
    targets: readonly string[],
  ): TemplateResult {
    const unit = this.axisUnit ?? baseUnitOf(runtime, this.axisName);
    const choices = runtime.unitChoices(this.axisName);

    return html`
      <div class="calc-graph-settings">
        <label class="calc-field">
          <span class="calc-field-label">Y axis</span>
          <select
            class="form-control"
            data-testid="graph-target"
            ?disabled=${this.running}
            @change=${this.handleTargetChange}
          >
            ${targets.map((name) => {
              const label = runtime.variable(name).label;
              const yUnit = baseUnitOf(runtime, name);
              return html`
                <option value=${name} ?selected=${name === this.targetName}>
                  ${label} (${yUnit})
                </option>
              `;
            })}
          </select>
        </label>

        <label class="calc-field">
          <span class="calc-field-label">X unit</span>
          <select
            class="form-control"
            data-testid="graph-unit"
            ?disabled=${this.running}
            @change=${this.handleUnitChange}
          >
            ${choices.map(
              (choice) => html`
                <option value=${choice} ?selected=${choice === unit}>
                  ${choice}
                </option>
              `,
            )}
          </select>
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Minimum (${unit})</span>
          <input
            class="form-control"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            data-testid="graph-min"
            ?disabled=${this.running}
            .value=${this.minText}
            @input=${this.handleMinInput}
          />
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Maximum (${unit})</span>
          <input
            class="form-control"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            data-testid="graph-max"
            ?disabled=${this.running}
            .value=${this.maxText}
            @input=${this.handleMaxInput}
          />
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Steps</span>
          <input
            class="form-control"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            data-testid="graph-steps"
            ?disabled=${this.running}
            .value=${this.stepsText}
            @input=${this.handleStepsInput}
          />
        </label>
      </div>

      <div class="calc-graph-actions">
        <button
          class="button"
          type="button"
          data-testid="graph-run"
          ?disabled=${this.running}
          @click=${this.handleRun}
        >
          Plot
        </button>
        <button
          class="button danger"
          type="button"
          data-testid="graph-stop"
          ?disabled=${!this.running}
          @click=${this.handleStop}
        >
          Stop
        </button>
      </div>
    `;
  }

  private get statusText(): string {
    if (this.running && this.sweep !== null) {
      return `Plotting ${this.sweep.progress} of ${this.sweep.total} points…`;
    }
    if (this.status !== '') {
      return this.status;
    }
    if (this.points.length > 0) {
      return `Plotted ${this.points.length} points.`;
    }
    return '';
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-graph-dialog');
  }

  private showDialog(): void {
    const dialog = this.dialogElement;
    if (dialog === null || dialog.open) {
      return;
    }
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      return;
    }
    dialog.setAttribute('open', '');
  }

  /** Fills the limits from the current value plus and minus 100%. */
  private applyDefaultRange(): void {
    const runtime = this.runtime;
    const unit = this.axisUnit;
    if (runtime === undefined || unit === null) {
      this.minText = '';
      this.maxText = '';
      return;
    }
    const current = runtime.state[this.axisName];
    const numeric = typeof current === 'number' ? current : null;
    const baseUnit = baseUnitOf(runtime, this.axisName);
    const displayValue =
      numeric === null ? null : convertUnit(numeric, baseUnit, unit);
    const range = defaultGraphRange(displayValue);
    this.minText = formatGraphNumber(range.min);
    this.maxText = formatGraphNumber(range.max);
  }

  private readonly handleTargetChange = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.targetName = target.value;
    }
  };

  private readonly handleUnitChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const runtime = this.runtime;
    if (runtime === undefined || this.axisUnit === null) {
      return;
    }
    const unit = runtime
      .unitChoices(this.axisName)
      .find((choice) => choice === target.value);
    if (unit === undefined) {
      return;
    }
    this.rebaseLimits(this.axisUnit, unit);
    this.axisUnit = unit;
    this.requestUpdate();
  };

  /** Rewrites the typed limits so they keep their physical value. */
  private rebaseLimits(from: UnitSymbol, to: UnitSymbol): void {
    const runtime = this.runtime;
    if (runtime === undefined) {
      return;
    }
    const base = baseUnitOf(runtime, this.axisName);
    this.minText = rebaseText(this.minText, from, to, base);
    this.maxText = rebaseText(this.maxText, from, to, base);
  }

  private readonly handleMinInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      this.minText = event.target.value;
    }
  };

  private readonly handleMaxInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      this.maxText = event.target.value;
    }
  };

  private readonly handleStepsInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      this.stepsText = event.target.value;
    }
  };

  private readonly handleRun = (): void => {
    void this.runPlot();
  };

  private readonly handleStop = (): void => {
    this.stopRun('Plot stopped.');
  };

  private readonly handleClose = (): void => {
    this.stopRun('');
    this.destroyChart();
    this.status = '';
    this.requestUpdate();
  };

  private async runPlot(): Promise<void> {
    const runtime = this.runtime;
    const unit = this.axisUnit;
    if (runtime === undefined || unit === null || this.running) {
      return;
    }

    const result = buildGraphPlan({
      runtime,
      axisName: this.axisName,
      targetName: this.targetName,
      axisUnit: unit,
      minText: this.minText,
      maxText: this.maxText,
      stepsText: this.stepsText,
    });
    if (!result.ok) {
      this.error = result.message;
      this.status = '';
      this.requestUpdate();
      return;
    }

    const ready = await this.prepareChart(result.plan);
    if (!ready) {
      return;
    }
    this.beginSweep(runtime, result.plan);
  }

  /**
   * Builds a fresh chart for the plan. Returns false (and sets an error) when
   * the browser cannot draw, so the sweep never starts without a target.
   */
  private async prepareChart(plan: GraphPlan): Promise<boolean> {
    const canvas = this.querySelector<HTMLCanvasElement>(
      'canvas[data-testid="graph-canvas"]',
    );
    if (canvas === null || !hasCanvasSupport(canvas)) {
      this.error = 'Plotting is not available in this browser.';
      this.requestUpdate();
      return false;
    }

    this.destroyChart();
    this.points.length = 0;
    this.error = '';

    const runtime = this.runtime;
    if (runtime === undefined) {
      return false;
    }

    const config = this.chartConfig(runtime, plan);
    try {
      const module = await import('chart.js/auto');
      const ChartConstructor = module.default;
      this.chart = new ChartConstructor(canvas, config);
    } catch (error) {
      this.error = `Could not start the plot: ${errorMessage(error)}`;
      this.requestUpdate();
      return false;
    }
    return true;
  }

  private chartConfig(
    runtime: CalculatorRuntime,
    plan: GraphPlan,
  ): ChartConfiguration<'line'> {
    const styles = getComputedStyle(this);
    const textColor = styles.color || 'currentColor';
    const lineColor =
      styles.getPropertyValue('--accent-color').trim() || DEFAULT_LINE_COLOR;
    const axisLabel = runtime.variable(plan.axisName).label;
    const targetLabel = runtime.variable(plan.targetName).label;

    return {
      type: 'line',
      data: {
        datasets: [
          {
            data: this.points,
            borderColor: lineColor,
            backgroundColor: lineColor,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 8,
            tension: 0,
            fill: false,
            spanGaps: true,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        color: textColor,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: `${axisLabel} (${plan.axisUnit})` },
            grid: { color: GRID_COLOR },
            ticks: {
              callback: (value) =>
                tickText(value, plan.axisBaseUnit, plan.axisUnit),
            },
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: `${targetLabel} (${plan.targetBaseUnit})`,
            },
            grid: { color: GRID_COLOR },
            ticks: {
              callback: (value) =>
                tickText(value, plan.targetBaseUnit, plan.targetBaseUnit),
            },
          },
        },
        plugins: { legend: { display: false } },
      },
    };
  }

  private beginSweep(runtime: CalculatorRuntime, plan: GraphPlan): void {
    this.points.length = 0;
    this.chart?.update('none');

    let sweep: GraphSweep;
    try {
      const sampler = runtime.beginSample(plan.axisName, plan.targetName);
      sweep = new GraphSweep({ sampler, axisValues: plan.axisValues });
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
      return;
    }

    this.sweep = sweep;
    this.running = true;
    this.status = '';
    this.error = '';
    this.requestUpdate();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    const sweep = this.sweep;
    if (sweep === null) {
      return;
    }

    let done: boolean;
    try {
      const batch = sweep.nextBatch();
      for (const point of batch.points) {
        this.points.push(point);
      }
      done = batch.done;
    } catch (error) {
      this.stopRun('');
      this.error = errorMessage(error);
      this.requestUpdate();
      return;
    }

    this.chart?.update('none');

    if (done) {
      this.sweep = null;
      this.running = false;
      this.rafId = null;
      this.status = `Plotted ${this.points.length} of ${sweep.total} points.`;
      this.requestUpdate();
      return;
    }

    this.requestUpdate();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private stopRun(message: string): void {
    this.sweep?.stop();
    this.sweep = null;
    this.cancelAnimation();
    if (this.running) {
      this.running = false;
      this.status = message;
      this.requestUpdate();
    }
  }

  private cancelAnimation(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}

/** True when the canvas can hand out a 2D context for Chart.js. */
function hasCanvasSupport(canvas: HTMLCanvasElement): boolean {
  try {
    return canvas.getContext('2d') !== null;
  } catch {
    return false;
  }
}

/** Formats one axis tick, converting base units into the display unit. */
function tickText(
  value: string | number,
  baseUnit: UnitSymbol,
  displayUnit: UnitSymbol,
): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }
  return formatNumber(convertUnit(numeric, baseUnit, displayUnit));
}

/** Converts a possibly blank limit from one unit to another. */
function rebaseText(
  text: string,
  from: UnitSymbol,
  to: UnitSymbol,
  base: UnitSymbol,
): string {
  const trimmed = text.trim();
  if (trimmed === '') {
    return text;
  }
  const numeric = Number(trimmed.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) {
    return text;
  }
  return formatNumber(convertUnit(convertUnit(numeric, from, base), base, to));
}

customElements.define('calc-graph-dialog', GraphDialog);
