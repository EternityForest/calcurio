import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { ValueUpdateResult } from '../runtime.js';
import type { UnitSymbol } from '../units.js';

const COMMIT_DELAY_MS = 100;

let nextFieldId = 0;

/** One row offered by a table-select dropdown. */
export interface FieldChoice {
  readonly key: string;
  readonly label: string;
}

interface FieldBase {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly editable: boolean;
  readonly computable: boolean;
  readonly pinned: boolean;
  readonly issues: readonly string[];
  /** Whether the field is emphasised (its value arrives over a wire). */
  readonly highlight?: boolean;
}

/** A numeric value with a unit selector. */
export interface NumberFieldModel extends FieldBase {
  readonly kind: 'number';
  /** Value already converted to the display unit and formatted. */
  readonly value: string;
  /** Shown when the field has no value, for example "Needs current". */
  readonly placeholder: string;
  readonly unit: UnitSymbol;
  readonly unitChoices: readonly UnitSymbol[];
  /** Whether this value can be plotted on the X axis of a graph. */
  readonly plottable: boolean;
}

/** A dropdown that selects one row of a table. */
export interface TableSelectFieldModel extends FieldBase {
  readonly kind: 'tableSelect';
  /** Selected row key, or an empty string when nothing is selected. */
  readonly value: string;
  readonly choices: readonly FieldChoice[];
  /**
   * Whether to offer a "Find closest" button. Shown only while no row is
   * selected and the referencing fields already hold values to match.
   */
  readonly findClosest?: boolean;
}

/** A free text value. */
export interface TextFieldModel extends FieldBase {
  readonly kind: 'text';
  readonly value: string;
  /** Shown when the field has no value. */
  readonly placeholder: string;
}

/** Everything a single value field needs, derived from the runtime. */
export type FieldModel =
  NumberFieldModel | TableSelectFieldModel | TextFieldModel;

/**
 * One labelled value box with a unit selector and an optional Calculate
 * button. Commits are debounced while typing and flushed on blur or Enter.
 */
export class VariableField extends LitElement {
  static override properties = {
    model: { attribute: false },
  };

  declare model: FieldModel | undefined;

  onCommit: (text: string) => ValueUpdateResult = () => ({ ok: true });
  onUnitChange: (unit: UnitSymbol) => void = () => {};
  onSelectionChange: (key: string) => ValueUpdateResult = () => ({ ok: true });
  onFindClosest: () => void = () => {};
  onCalculate: () => void = () => {};
  onPlot: () => void = () => {};

  private localError = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly inputId = `calc-value-${nextFieldId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override disconnectedCallback(): void {
    this.cancelTimer();
    super.disconnectedCallback();
  }

  override updated(): void {
    const model = this.model;
    if (model === undefined) {
      return;
    }
    if (model.kind === 'tableSelect') {
      const select = this.querySelect();
      if (select !== null && select.value !== model.value) {
        select.value = model.value;
      }
      return;
    }
    const input = this.inputElement;
    if (input === null) {
      return;
    }
    if (document.activeElement === input) {
      return;
    }
    if (input.value !== model.value) {
      input.value = model.value;
    }
  }

  override render(): TemplateResult | typeof nothing {
    const model = this.model;
    if (model === undefined) {
      return nothing;
    }

    const issues = [
      ...model.issues,
      ...(this.localError === '' ? [] : [this.localError]),
    ];

    return html`
      <div
        class="calc-field ${model.highlight === true ? 'highlight' : ''}"
        data-variable=${model.name}
      >
        <div class="calc-field-header">
          <label class="calc-field-label" for=${this.inputId}>
            ${model.label}
          </label>
          ${this.renderPinnedBadge(model)}
        </div>
        ${
          model.kind === 'tableSelect'
            ? this.renderSelect(model)
            : model.kind === 'text'
              ? this.renderTextInput(model)
              : this.renderNumberInput(model)
        }
        ${
          model.description === ''
            ? nothing
            : html`<p class="help calc-field-help">${model.description}</p>`
        }
        ${
          issues.length === 0
            ? nothing
            : html`
                <ul class="calc-errors" role="alert">
                  ${issues.map((issue) => html`<li>${issue}</li>`)}
                </ul>
              `
        }
      </div>
    `;
  }

  private renderPinnedBadge(
    model: FieldModel,
  ): TemplateResult | typeof nothing {
    if (!model.pinned) {
      return nothing;
    }
    return html`
      <span class="calc-badge" title="Held fixed by the user">input</span>
    `;
  }

  private renderNumberInput(model: NumberFieldModel): TemplateResult {
    return html`
      <div class="calc-field-input">
        <input
          id=${this.inputId}
          class="form-control calc-value-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          data-testid=${`value-${model.name}`}
          ?readonly=${!model.editable}
          placeholder=${model.placeholder}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeydown}
        />
        <select
          class="form-control calc-unit-select"
          aria-label=${`Unit for ${model.label}`}
          data-testid=${`unit-${model.name}`}
          @change=${this.handleUnitChange}
        >
          ${model.unitChoices.map(
            (unit) => html`
              <option value=${unit} ?selected=${unit === model.unit}>
                ${unit}
              </option>
            `,
          )}
        </select>
        ${this.renderCalculateButton(model)} ${this.renderPlotButton(model)}
      </div>
    `;
  }

  private renderTextInput(model: TextFieldModel): TemplateResult {
    return html`
      <div class="calc-field-input">
        <input
          id=${this.inputId}
          class="form-control calc-value-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          data-testid=${`value-${model.name}`}
          ?readonly=${!model.editable}
          placeholder=${model.placeholder}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeydown}
        />
        ${this.renderCalculateButton(model)}
      </div>
    `;
  }

  private renderSelect(model: TableSelectFieldModel): TemplateResult {
    return html`
      <div class="calc-field-input">
        <select
          id=${this.inputId}
          class="form-control calc-table-select"
          data-testid=${`value-${model.name}`}
          ?disabled=${!model.editable}
          @change=${this.handleSelectionChange}
        >
          <option value="" ?selected=${model.value === ''}>
            — choose a row —
          </option>
          ${model.choices.map(
            (choice) => html`
              <option
                value=${choice.key}
                ?selected=${choice.key === model.value}
              >
                ${choice.label}
              </option>
            `,
          )}
        </select>
        ${this.renderCalculateButton(model)}
        ${this.renderFindClosestButton(model)}
      </div>
    `;
  }

  private renderFindClosestButton(
    model: TableSelectFieldModel,
  ): TemplateResult | typeof nothing {
    if (model.findClosest !== true) {
      return nothing;
    }
    return html`
      <button
        class="button calc-find-closest"
        type="button"
        title="Select the row closest to the values already entered"
        data-testid=${`find-closest-${model.name}`}
        @click=${this.handleFindClosest}
      >
        Find closest
      </button>
    `;
  }

  private renderCalculateButton(
    model: FieldModel,
  ): TemplateResult | typeof nothing {
    if (!model.computable) {
      return nothing;
    }
    return html`
      <button
        class="button calc-calculate"
        type="button"
        title=${`Solve for ${model.label}`}
        data-testid=${`calculate-${model.name}`}
        @click=${this.handleCalculate}
      >
        Calculate
      </button>
    `;
  }

  private renderPlotButton(
    model: NumberFieldModel,
  ): TemplateResult | typeof nothing {
    if (!model.plottable) {
      return nothing;
    }
    return html`
      <button
        class="button calc-plot"
        type="button"
        title=${`Plot ${model.label} on the X axis`}
        data-testid=${`plot-${model.name}`}
        @click=${this.handlePlot}
      >
        Plot
      </button>
    `;
  }

  private get inputElement(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input.calc-value-input');
  }

  private querySelect(): HTMLSelectElement | null {
    return this.querySelector<HTMLSelectElement>('select.calc-table-select');
  }

  private readonly handleInput = (): void => {
    this.localError = '';
    this.cancelTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.commitNow();
    }, COMMIT_DELAY_MS);
  };

  private readonly handleChange = (): void => {
    this.cancelTimer();
    this.commitNow();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    this.cancelTimer();
    this.commitNow();
  };

  private readonly handleUnitChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const model = this.model;
    if (model === undefined || model.kind !== 'number') {
      return;
    }
    const unit = model.unitChoices.find((choice) => choice === target.value);
    if (unit === undefined) {
      return;
    }
    this.onUnitChange(unit);
  };

  private readonly handleSelectionChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.localError = '';
    const result = this.onSelectionChange(target.value);
    if (!result.ok) {
      this.localError = result.message ?? 'That row cannot be selected.';
    }
    this.requestUpdate();
  };

  private readonly handleFindClosest = (): void => {
    this.localError = '';
    this.onFindClosest();
  };

  private readonly handleCalculate = (): void => {
    this.cancelTimer();
    if (this.model?.kind === 'tableSelect') {
      this.onCalculate();
      return;
    }
    if (this.commitNow()) {
      this.onCalculate();
    }
  };

  private readonly handlePlot = (): void => {
    this.cancelTimer();
    if (this.commitNow()) {
      this.onPlot();
    }
  };

  private commitNow(): boolean {
    const input = this.inputElement;
    if (input === null) {
      return false;
    }
    const result = this.onCommit(input.value);
    if (!result.ok) {
      this.localError = result.message ?? 'Invalid value.';
      this.requestUpdate();
      return false;
    }
    if (this.localError !== '') {
      this.localError = '';
      this.requestUpdate();
    }
    return true;
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

customElements.define('calc-variable-field', VariableField);
