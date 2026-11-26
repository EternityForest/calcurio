import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { configControl } from '../../framework/components/config-control.js';
import { rowKey, rowLabel } from '../../framework/tables.js';
import type {
  CalcValue,
  ConfigValue,
  TableDefinition,
  VariableDefinition,
} from '../../framework/types.js';
import {
  isNumberVariable,
  isTableFieldVariable,
  isTableSelectVariable,
  isTextVariable,
} from '../../framework/types.js';
import { unitsByMeasure } from '../../framework/units.js';
import type { CalculatorCatalog, CatalogEntry } from '../../custom/catalog.js';
import {
  resolveFieldConfig,
  standaloneDefinition,
  wireOptions,
} from '../../custom/steps.js';
import type { WireOption } from '../../custom/steps.js';
import { STEP_VALUE_NAME, wirePath } from '../../custom/types.js';
import type {
  CustomDefinition,
  CustomStep,
  StepVariable,
  SubcalcStep,
  TextStep,
  VariableStep,
} from '../../custom/types.js';
import { wireMatches } from '../../custom/validate.js';

let nextDialogId = 0;

/**
 * Edits one step of a custom: its label, a subcalculator's settings and
 * starting values, and the wiring and visibility of every field. The step id
 * is fixed, so wires into the step keep working while it is edited.
 */
export class CustomStepDialog extends LitElement {
  static override properties = {
    catalog: { attribute: false },
    custom: { attribute: false },
    stepIndex: { attribute: false },
    onApply: { attribute: false },
  };

  declare catalog: CalculatorCatalog | undefined;
  declare custom: CustomDefinition | undefined;
  declare stepIndex: number;
  declare onApply: ((step: CustomStep) => void) | undefined;

  private working: CustomStep | null = null;
  private readonly titleId = `calc-custom-step-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the modal for the step at `stepIndex` of `custom`. */
  open(custom: CustomDefinition, stepIndex: number): void {
    this.custom = custom;
    this.stepIndex = stepIndex;
    const step = custom.steps[stepIndex];
    this.working = step === undefined ? null : cloneStep(step);
    this.requestUpdate();
    void this.updateComplete.then(() => this.showDialog());
  }

  close(): void {
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
    const step = this.working;
    if (step === null) {
      return nothing;
    }
    return html`
      <dialog
        class="calc-dialog calc-custom-step-dialog"
        aria-labelledby=${this.titleId}
        @close=${() => this.requestUpdate()}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Edit step</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Cancel
            </button>
          </header>
          <label class="calc-custom-text">
            <span class="calc-field-label">Step label</span>
            <input
              class="form-control"
              type="text"
              data-testid="step-label"
              maxlength="80"
              .value=${step.label}
              @input=${this.handleLabel}
            />
          </label>
          ${this.renderBody(step)}
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="apply-step"
              @click=${this.handleApply}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>
    `;
  }

  private renderBody(step: CustomStep): TemplateResult {
    switch (step.kind) {
      case 'subcalc':
        return this.renderSubcalc(step);
      case 'variable':
        return this.renderVariable(step);
      case 'text':
        return this.renderText(step);
    }
  }

  private renderSubcalc(step: SubcalcStep): TemplateResult {
    const entry = this.catalog?.get(step.calculatorRef);
    if (entry === undefined) {
      return html`
        <p class="alert danger">
          The subcalculator "${step.calculatorRef}" is not available.
        </p>
      `;
    }
    const definitions = localDefinitions(entry, step);
    return html`
      <p class="help">
        Subcalculator: <strong>${entry.definition.title}</strong>
      </p>
      ${
        entry.config.length === 0
          ? nothing
          : html`
              <div class="calc-config">
                <h3 class="calc-section-title">Settings</h3>
                <div class="calc-config-fields">
                  ${entry.config.map((field) =>
                    this.renderConfigField(entry, step, field.name),
                  )}
                </div>
              </div>
            `
      }
      <h3 class="calc-section-title">Fields</h3>
      <div class="calc-fields">
        ${definitions.map((definition) =>
          this.renderSubcalcField(step, definition),
        )}
      </div>
    `;
  }

  private renderConfigField(
    entry: CatalogEntry,
    step: SubcalcStep,
    name: string,
  ): TemplateResult {
    const field = entry.config.find((candidate) => candidate.name === name);
    if (field === undefined) {
      return html``;
    }
    return html`
      <label class="calc-config-field">
        <span class="calc-config-label">${field.label}</span>
        ${configControl(field, step.config[field.name], (value: ConfigValue) =>
          this.applyConfig(field.name, value),
        )}
      </label>
      ${
        field.description === undefined
          ? nothing
          : html`<p class="help calc-config-help">${field.description}</p>`
      }
    `;
  }

  private renderSubcalcField(
    step: SubcalcStep,
    definition: VariableDefinition,
  ): TemplateResult {
    const name = definition.name;
    const wiring = step.variables[name] ?? {};
    const wired = wiring.takeFrom !== undefined;
    const selfPath = wirePath(step.id, name);
    const compatible = this.optionsFor(definition, selfPath);
    return html`
      <div
        class="calc-field ${wired ? 'highlight' : ''}"
        data-testid=${`step-field-${name}`}
      >
        <div class="calc-field-header">
          <span class="calc-field-label">${definition.label}</span>
          <label class="calc-custom-hidden">
            <input
              type="checkbox"
              data-testid=${`hidden-${name}`}
              ?checked=${wiring.hidden === true}
              @change=${(event: Event) =>
                this.handleHidden(event, (next) => this.setWiring(name, next))}
            />
            Hidden
          </label>
        </div>
        ${
          wired
            ? html`<p class="help calc-field-source">
                Taken from ${this.sourceLabel(step, name) ?? wiring.takeFrom}
              </p>`
            : nothing
        }
        <label class="calc-custom-wire">
          <span class="help">Take from</span>
          <select
            class="form-control"
            data-testid=${`take-from-${name}`}
            @change=${(event: Event) =>
              this.handleTakeFrom(event, (next) => this.setWiring(name, next))}
          >
            <option value="" ?selected=${!wired}>— none —</option>
            ${compatible.map(
              (option) => html`
                <option
                  value=${option.path}
                  ?selected=${option.path === wiring.takeFrom}
                >
                  ${option.stepLabel}: ${option.variableLabel}
                </option>
              `,
            )}
          </select>
        </label>
        ${this.renderValue(definition, step.values[name] ?? null, wired)}
        ${
          definition.description === undefined
            ? nothing
            : html`<p class="help calc-field-help">
                ${definition.description}
              </p>`
        }
      </div>
    `;
  }

  private renderValue(
    definition: VariableDefinition,
    value: CalcValue,
    wired: boolean,
  ): TemplateResult | typeof nothing {
    if (!canSeed(definition)) {
      return html`<p class="help calc-field-help">
        Computed by the subcalculator.
      </p>`;
    }
    if (isTableSelectVariable(definition)) {
      const table = this.catalog?.getTable(definition.table);
      return html`
        <div class="calc-field-input">
          <select
            class="form-control calc-table-select"
            data-testid=${`value-${definition.name}`}
            ?disabled=${wired}
            @change=${(event: Event) =>
              this.handleValue(event, definition.name)}
          >
            <option value="" ?selected=${typeof value !== 'string'}>
              — none —
            </option>
            ${(table?.rows ?? []).map((row) => {
              const key = rowKey(table as TableDefinition, row) ?? '';
              return html`
                <option value=${key} ?selected=${key === value}>
                  ${rowLabel(table as TableDefinition, row)}
                </option>
              `;
            })}
          </select>
        </div>
      `;
    }
    if (isTextVariable(definition)) {
      return html`
        <div class="calc-field-input">
          <input
            class="form-control calc-value-input"
            type="text"
            data-testid=${`value-${definition.name}`}
            ?disabled=${wired}
            .value=${typeof value === 'string' ? value : ''}
            @change=${(event: Event) =>
              this.handleValue(event, definition.name)}
          />
        </div>
      `;
    }
    return html`
      <div class="calc-field-input">
        <input
          class="form-control calc-value-input"
          type="number"
          step="any"
          data-testid=${`value-${definition.name}`}
          ?disabled=${wired}
          .value=${typeof value === 'number' ? String(value) : ''}
          @change=${(event: Event) => this.handleValue(event, definition.name)}
        />
        <span class="help calc-custom-unit">${definition.unit}</span>
      </div>
    `;
  }

  private renderVariable(step: VariableStep): TemplateResult {
    const definition = standaloneDefinition(step);
    const wired = step.variable.takeFrom !== undefined;
    const compatible = this.optionsFor(
      definition,
      wirePath(step.id, STEP_VALUE_NAME),
    );
    return html`
      <label class="calc-custom-text">
        <span class="calc-field-label">Unit</span>
        <select
          class="form-control"
          data-testid="step-unit"
          @change=${this.handleUnit}
        >
          ${[...unitsByMeasure()].map(
            ([measure, units]) => html`
              <optgroup label=${measure}>
                ${units.map(
                  (unit) => html`
                    <option value=${unit} ?selected=${unit === step.unit}>
                      ${unit}
                    </option>
                  `,
                )}
              </optgroup>
            `,
          )}
        </select>
      </label>
      <label class="calc-custom-text">
        <span class="calc-field-label">Default</span>
        <input
          class="form-control"
          type="number"
          step="any"
          data-testid="step-default"
          ?disabled=${wired}
          .value=${step.default === undefined ? '' : String(step.default)}
          @change=${this.handleDefault}
        />
      </label>
      ${this.renderStandaloneWiring(compatible, wired, step.variable, 'value')}
    `;
  }

  private renderText(step: TextStep): TemplateResult {
    const definition = standaloneDefinition(step);
    const wired = step.variable.takeFrom !== undefined;
    const compatible = this.optionsFor(
      definition,
      wirePath(step.id, STEP_VALUE_NAME),
    );
    return html`
      <label class="calc-custom-text">
        <span class="calc-field-label">Default text</span>
        <input
          class="form-control"
          type="text"
          data-testid="step-default"
          ?disabled=${wired}
          .value=${step.default ?? ''}
          @change=${this.handleText}
        />
      </label>
      ${this.renderStandaloneWiring(compatible, wired, step.variable, 'value')}
    `;
  }

  private renderStandaloneWiring(
    compatible: readonly WireOption[],
    wired: boolean,
    wiring: StepVariable,
    testKey: string,
  ): TemplateResult {
    const source = wired ? this.labelForPath(wiring.takeFrom) : null;
    return html`
      <div class="calc-field ${wired ? 'highlight' : ''}">
        <div class="calc-field-header">
          <span class="calc-field-label">Wiring</span>
          <label class="calc-custom-hidden">
            <input
              type="checkbox"
              data-testid="hidden-value"
              ?checked=${wiring.hidden === true}
              @change=${(event: Event) =>
                this.handleHidden(event, (next) =>
                  this.setStandaloneWiring(next),
                )}
            />
            Hidden
          </label>
        </div>
        ${
          wired
            ? html`<p class="help calc-field-source">
                Taken from ${source ?? wiring.takeFrom}
              </p>`
            : nothing
        }
        <label class="calc-custom-wire">
          <span class="help">Take from</span>
          <select
            class="form-control"
            data-testid=${`take-from-${testKey}`}
            @change=${(event: Event) =>
              this.handleTakeFrom(event, (next) =>
                this.setStandaloneWiring(next),
              )}
          >
            <option value="" ?selected=${!wired}>— none —</option>
            ${compatible.map(
              (option) => html`
                <option
                  value=${option.path}
                  ?selected=${option.path === wiring.takeFrom}
                >
                  ${option.stepLabel}: ${option.variableLabel}
                </option>
              `,
            )}
          </select>
        </label>
      </div>
    `;
  }

  /** Wire paths a field of this custom may take its value from. */
  private optionsFor(
    definition: VariableDefinition,
    selfPath: string,
  ): readonly WireOption[] {
    return this.allOptions().filter(
      (option) =>
        option.path !== selfPath && wireMatches(option.definition, definition),
    );
  }

  private allOptions(): readonly WireOption[] {
    const custom = this.custom;
    const catalog = this.catalog;
    const step = this.working;
    if (custom === undefined || catalog === undefined || step === null) {
      return [];
    }
    const steps = custom.steps.map((candidate, index) =>
      index === this.stepIndex ? step : candidate,
    );
    return wireOptions({ ...custom, steps }, catalog);
  }

  private labelForPath(path: string | undefined): string | null {
    if (path === undefined) {
      return null;
    }
    const option = this.allOptions().find(
      (candidate) => candidate.path === path,
    );
    return option === undefined
      ? null
      : `${option.stepLabel}: ${option.variableLabel}`;
  }

  private sourceLabel(step: SubcalcStep, name: string): string | null {
    return this.labelForPath(step.variables[name]?.takeFrom);
  }

  private applyConfig(name: string, value: ConfigValue): void {
    const step = this.working;
    const entry = this.catalog?.get(
      step?.kind === 'subcalc' ? step.calculatorRef : '',
    );
    if (step === null || step.kind !== 'subcalc' || entry === undefined) {
      return;
    }
    const config = { ...step.config, [name]: value };
    const known = new Set(
      localDefinitions(entry, { ...step, config }).map(
        (definition) => definition.name,
      ),
    );
    this.working = {
      ...step,
      config,
      values: pickKnown(step.values, known),
      variables: pickKnown(step.variables, known),
    };
    this.requestUpdate();
  }

  private setWiring(
    name: string,
    update: (wiring: StepVariable) => StepVariable,
  ): void {
    const step = this.working;
    if (step === null || step.kind !== 'subcalc') {
      return;
    }
    const wiring = step.variables[name] ?? {};
    this.working = {
      ...step,
      variables: { ...step.variables, [name]: update(wiring) },
    };
    this.requestUpdate();
  }

  private setStandaloneWiring(
    update: (wiring: StepVariable) => StepVariable,
  ): void {
    const step = this.working;
    if (step === null || step.kind === 'subcalc') {
      return;
    }
    this.working = { ...step, variable: update(step.variable) };
    this.requestUpdate();
  }

  private readonly handleLabel = (event: Event): void => {
    const target = event.target;
    const step = this.working;
    if (step !== null && target instanceof HTMLInputElement) {
      this.working = { ...step, label: target.value };
    }
  };

  private readonly handleTakeFrom = (
    event: Event,
    apply: (update: (wiring: StepVariable) => StepVariable) => void,
  ): void => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const path = target.value.trim();
    apply((wiring) => withTakeFrom(wiring, path === '' ? undefined : path));
  };

  private readonly handleHidden = (
    event: Event,
    apply: (update: (wiring: StepVariable) => StepVariable) => void,
  ): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const hidden = target.checked;
    apply((wiring) => ({ ...wiring, hidden }));
  };

  private readonly handleValue = (event: Event, name: string): void => {
    const step = this.working;
    const target = event.target;
    if (
      step === null ||
      step.kind !== 'subcalc' ||
      (!(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLSelectElement))
    ) {
      return;
    }
    const definition = localDefinitions(
      this.catalog?.requireEntry(step.calculatorRef) as CatalogEntry,
      step,
    ).find((candidate) => candidate.name === name);
    if (definition === undefined) {
      return;
    }
    const parsed = parseValue(definition, target.value);
    this.working = {
      ...step,
      values: { ...step.values, [name]: parsed },
    };
  };

  private readonly handleUnit = (event: Event): void => {
    const target = event.target;
    const step = this.working;
    if (
      step !== null &&
      step.kind === 'variable' &&
      target instanceof HTMLSelectElement
    ) {
      this.working = { ...step, unit: target.value as VariableStep['unit'] };
    }
  };

  private readonly handleDefault = (event: Event): void => {
    const target = event.target;
    const step = this.working;
    if (
      step === null ||
      step.kind !== 'variable' ||
      !(target instanceof HTMLInputElement)
    ) {
      return;
    }
    const parsed = Number(target.value);
    this.working = Number.isFinite(parsed)
      ? { ...step, default: parsed }
      : withoutDefault(step);
  };

  private readonly handleText = (event: Event): void => {
    const target = event.target;
    const step = this.working;
    if (
      step === null ||
      step.kind !== 'text' ||
      !(target instanceof HTMLInputElement)
    ) {
      return;
    }
    const text = target.value.trim();
    this.working =
      text === '' ? withoutDefault(step) : { ...step, default: text };
  };

  private readonly handleApply = (): void => {
    const step = this.working;
    if (step !== null) {
      this.onApply?.(step);
    }
    this.close();
  };

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-dialog');
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
}

/** Whether a field's stored value can seed the subcalculator. */
function canSeed(definition: VariableDefinition): boolean {
  if (!isNumberVariable(definition)) {
    return true;
  }
  return (
    definition.computable === undefined && !isTableFieldVariable(definition)
  );
}

/** The variable list a step contributes for its own settings. */
function localDefinitions(
  entry: CatalogEntry,
  step: SubcalcStep,
): readonly VariableDefinition[] {
  return entry.variables(resolveFieldConfig(entry.config, step.config));
}

/** Keeps only the entries whose names are still part of the step. */
function pickKnown<T>(
  record: Readonly<Record<string, T>>,
  known: ReadonlySet<string>,
): Record<string, T> {
  const kept: Record<string, T> = {};
  for (const [name, value] of Object.entries(record)) {
    if (known.has(name)) {
      kept[name] = value;
    }
  }
  return kept;
}

/** Parses a field's on-screen text into the value the step stores. */
function parseValue(definition: VariableDefinition, text: string): CalcValue {
  if (isTableSelectVariable(definition) || isTextVariable(definition)) {
    const trimmed = text.trim();
    return trimmed === '' ? null : trimmed;
  }
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Adds or removes `takeFrom`, keeping the rest of the wiring. */
function withTakeFrom(
  wiring: StepVariable,
  takeFrom: string | undefined,
): StepVariable {
  if (takeFrom === undefined) {
    return withoutKey(wiring, 'takeFrom');
  }
  return { ...wiring, takeFrom };
}

function withoutKey(wiring: StepVariable, key: 'takeFrom'): StepVariable {
  const { [key]: _removed, ...rest } = wiring;
  return rest;
}

function withoutDefault<T extends VariableStep | TextStep>(step: T): T {
  const { default: _removed, ...rest } = step;
  return rest as T;
}

/** Deep copy of a step, so edits can be abandoned by closing the dialog. */
export function cloneStep(step: CustomStep): CustomStep {
  if (step.kind === 'subcalc') {
    return {
      kind: 'subcalc',
      id: step.id,
      label: step.label,
      ...(step.hidden === undefined ? {} : { hidden: step.hidden }),
      calculatorRef: step.calculatorRef,
      config: { ...step.config },
      values: { ...step.values },
      variables: cloneWiringRecord(step.variables),
    };
  }
  if (step.kind === 'variable') {
    return {
      kind: 'variable',
      id: step.id,
      label: step.label,
      ...(step.hidden === undefined ? {} : { hidden: step.hidden }),
      unit: step.unit,
      ...(step.default === undefined ? {} : { default: step.default }),
      variable: cloneWiring(step.variable),
    };
  }
  return {
    kind: 'text',
    id: step.id,
    label: step.label,
    ...(step.hidden === undefined ? {} : { hidden: step.hidden }),
    ...(step.default === undefined ? {} : { default: step.default }),
    variable: cloneWiring(step.variable),
  };
}

function cloneWiringRecord(
  record: Readonly<Record<string, StepVariable>>,
): Record<string, StepVariable> {
  const copy: Record<string, StepVariable> = {};
  for (const [name, wiring] of Object.entries(record)) {
    copy[name] = cloneWiring(wiring);
  }
  return copy;
}

function cloneWiring(wiring: StepVariable): StepVariable {
  return {
    ...(wiring.takeFrom === undefined ? {} : { takeFrom: wiring.takeFrom }),
    ...(wiring.hidden === undefined ? {} : { hidden: wiring.hidden }),
  };
}

customElements.define('calc-custom-step-dialog', CustomStepDialog);
