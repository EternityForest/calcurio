import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { ValueUpdateResult } from '../runtime.js';
import type { UnitSymbol } from '../units.js';

const COMMIT_DELAY_MS = 250;

let nextFieldId = 0;

/** Everything a single value field needs, derived from the runtime. */
export interface FieldModel {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  /** Value already converted to the display unit and formatted. */
  readonly value: string;
  /** Shown when the field has no value, for example "Needs current". */
  readonly placeholder: string;
  readonly unit: UnitSymbol;
  readonly unitChoices: readonly UnitSymbol[];
  readonly editable: boolean;
  readonly computable: boolean;
  readonly pinned: boolean;
  readonly issues: readonly string[];
}

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
  onCalculate: () => void = () => {};

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
    const input = this.inputElement;
    if (model === undefined || input === null) {
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
      <div class="calc-field" data-variable=${model.name}>
        <div class="calc-field-header">
          <label class="calc-field-label" for=${this.inputId}>
            ${model.label}
          </label>
          ${
            model.pinned
              ? html`<span class="calc-badge" title="Held fixed by the user">
                  input
                </span>`
              : nothing
          }
        </div>
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
          ${
            model.computable
              ? html`
                  <button
                    class="button calc-calculate"
                    type="button"
                    title=${`Solve for ${model.label}`}
                    data-testid=${`calculate-${model.name}`}
                    @click=${this.handleCalculate}
                  >
                    Calculate
                  </button>
                `
              : nothing
          }
        </div>
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

  private get inputElement(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input.calc-value-input');
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
    const unit = this.model?.unitChoices.find(
      (choice) => choice === target.value,
    );
    if (unit === undefined) {
      return;
    }
    this.onUnitChange(unit);
  };

  private readonly handleCalculate = (): void => {
    this.cancelTimer();
    if (this.commitNow()) {
      this.onCalculate();
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
