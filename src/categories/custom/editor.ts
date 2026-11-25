import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../../framework/errors.js';
import type { CalculatorCatalog } from '../../custom/catalog.js';
import { defaultCustomConfig, pruneCustom } from '../../custom/steps.js';
import type {
  CustomDefinition,
  CustomStep,
  SubcalcStep,
  TextStep,
  VariableStep,
} from '../../custom/types.js';
import { customProblems } from '../../custom/validate.js';
import { CUSTOM_VERSION } from '../../custom/types.js';
import type { CustomLibrary } from './library.js';
import { cloneStep } from './step-dialog.js';
import type { CustomStepDialog } from './step-dialog.js';
import type { CalculatorBrowserDialog } from './browser-dialog.js';
import './browser-dialog.js';
import './step-dialog.js';

/** Longest title the editor lets a user type. */
const MAX_TITLE_LENGTH = 80;

let nextDialogId = 0;

/**
 * Builds and edits one custom. Steps are listed in the order they run; each
 * one opens the step dialog for its settings, wiring, and visibility. The
 * editor keeps a private copy, so Cancel discards every change.
 */
export class CustomEditorDialog extends LitElement {
  static override properties = {
    catalog: { attribute: false },
    library: { attribute: false },
    onSaved: { attribute: false },
    onDeleted: { attribute: false },
  };

  declare catalog: CalculatorCatalog | undefined;
  declare library: CustomLibrary | undefined;
  declare onSaved: ((custom: CustomDefinition) => void) | undefined;
  declare onDeleted: ((id: string) => void) | undefined;

  private working: CustomDefinition | null = null;
  private isNew = true;
  private stepIndex = -1;
  private error = '';
  private confirmingDelete = false;
  private readonly titleId = `calc-custom-editor-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the editor for an existing custom, or a blank new one. */
  open(custom: CustomDefinition | null): void {
    this.isNew = custom === null;
    this.working =
      custom === null
        ? {
            version: CUSTOM_VERSION,
            id: 'custom',
            title: '',
            steps: [],
          }
        : cloneCustom(custom);
    this.stepIndex = -1;
    this.error = '';
    this.confirmingDelete = false;
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
    const working = this.working;
    if (working === null) {
      return nothing;
    }
    const problems = this.problems();
    return html`
      <dialog
        class="calc-dialog calc-custom-editor"
        aria-labelledby=${this.titleId}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>
              ${this.isNew ? 'New custom' : 'Edit custom'}
            </h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Cancel
            </button>
          </header>
          <label class="calc-custom-text">
            <span class="calc-field-label">Title</span>
            <input
              class="form-control"
              type="text"
              data-testid="custom-title"
              maxlength=${MAX_TITLE_LENGTH}
              .value=${working.title}
              @input=${this.handleTitle}
            />
          </label>
          <label class="calc-custom-text">
            <span class="calc-field-label">Description</span>
            <input
              class="form-control"
              type="text"
              data-testid="custom-description"
              .value=${working.description ?? ''}
              @input=${this.handleDescription}
            />
          </label>
          <p class="help">Saved as <code>${working.id}</code></p>
          <h3 class="calc-section-title">Steps</h3>
          ${this.renderSteps(working)} ${this.renderAddActions()}
          ${this.renderProblems(problems)} ${this.renderError()}
          <div class="calc-actions">
            ${this.renderDelete()}
            <span class="spacer"></span>
            <button
              class="button"
              type="button"
              data-testid="save-custom"
              ?disabled=${problems.length > 0 || this.library === undefined}
              @click=${this.handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
      <calc-custom-step-dialog
        .catalog=${this.catalog}
        .onApply=${this.applyStep}
      ></calc-custom-step-dialog>
      <calc-calculator-browser
        .catalog=${this.catalog}
        .onChosen=${this.addSubcalc}
      ></calc-calculator-browser>
    `;
  }

  private renderSteps(working: CustomDefinition): TemplateResult {
    if (working.steps.length === 0) {
      return html`
        <p class="help" data-testid="no-steps">
          Add a subcalculator to start building.
        </p>
      `;
    }
    return html`
      <ol class="calc-custom-steps">
        ${working.steps.map((step, index) =>
          this.renderStepRow(step, index, working.steps.length),
        )}
      </ol>
    `;
  }

  private renderStepRow(
    step: CustomStep,
    index: number,
    count: number,
  ): TemplateResult {
    return html`
      <li class="calc-custom-step" data-testid=${`step-${index}`}>
        <span class="calc-custom-step-index">${index + 1}</span>
        <div class="calc-custom-step-main">
          <strong>${step.label}</strong>
          <span class="help">${describeStep(step, this.catalog)}</span>
        </div>
        <label class="calc-custom-hidden">
          <input
            type="checkbox"
            data-testid=${`step-hidden-${index}`}
            ?checked=${step.hidden === true}
            @change=${(event: Event) => this.handleStepHidden(event, index)}
          />
          Hidden
        </label>
        <div class="calc-custom-step-actions">
          <button
            class="button"
            type="button"
            data-testid=${`step-edit-${index}`}
            @click=${() => this.editStep(index)}
          >
            Edit
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-up-${index}`}
            ?disabled=${index === 0}
            @click=${() => this.moveStep(index, -1)}
          >
            ↑
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-down-${index}`}
            ?disabled=${index === count - 1}
            @click=${() => this.moveStep(index, 1)}
          >
            ↓
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-remove-${index}`}
            @click=${() => this.removeStep(index)}
          >
            Remove
          </button>
        </div>
      </li>
    `;
  }

  private renderAddActions(): TemplateResult {
    return html`
      <div class="calc-actions">
        <button
          class="button"
          type="button"
          data-testid="add-subcalc"
          @click=${this.openBrowser}
        >
          Add subcalculator
        </button>
        <button
          class="button"
          type="button"
          data-testid="add-value"
          @click=${this.addValue}
        >
          Add value
        </button>
        <button
          class="button"
          type="button"
          data-testid="add-text"
          @click=${this.addText}
        >
          Add text
        </button>
      </div>
    `;
  }

  private renderProblems(
    problems: readonly string[],
  ): TemplateResult | typeof nothing {
    if (problems.length === 0) {
      return nothing;
    }
    return html`
      <div class="alert danger calc-custom-problems" role="alert">
        <p>Fix these before saving:</p>
        <ul>
          ${problems.map((problem) => html`<li>${problem}</li>`)}
        </ul>
      </div>
    `;
  }

  private renderError(): TemplateResult | typeof nothing {
    if (this.error === '') {
      return nothing;
    }
    return html`
      <p class="alert danger" role="alert" data-testid="save-error">
        ${this.error}
      </p>
    `;
  }

  private renderDelete(): TemplateResult | typeof nothing {
    if (this.isNew) {
      return nothing;
    }
    return html`
      <button
        class="button danger"
        type="button"
        data-testid="delete-custom"
        @click=${this.handleDelete}
      >
        ${this.confirmingDelete ? 'Confirm delete' : 'Delete'}
      </button>
    `;
  }

  private problems(): readonly string[] {
    const catalog = this.catalog;
    const working = this.working;
    if (catalog === undefined || working === null) {
      return [];
    }
    return customProblems(working, catalog);
  }

  private readonly applyStep = (step: CustomStep): void => {
    const working = this.working;
    if (working === null || this.stepIndex < 0) {
      return;
    }
    const steps = [...working.steps];
    steps[this.stepIndex] = step;
    this.working = { ...working, steps };
    this.prune();
    this.requestUpdate();
  };

  private editStep(index: number): void {
    const working = this.working;
    if (working === null) {
      return;
    }
    this.stepIndex = index;
    this.stepDialog?.open(working, index);
  }

  private readonly addSubcalc = (calculatorId: string): void => {
    const entry = this.catalog?.get(calculatorId);
    const working = this.working;
    if (entry === undefined || working === null) {
      return;
    }
    const step: SubcalcStep = {
      kind: 'subcalc',
      id: this.freeStepId(calculatorId),
      label: entry.definition.title,
      calculatorId,
      config: defaultCustomConfig(entry.config),
      values: {},
      variables: {},
    };
    this.appendStep(step);
  };

  private readonly addValue = (): void => {
    const step: VariableStep = {
      kind: 'variable',
      id: this.freeStepId('value'),
      label: 'Value',
      unit: '1',
      variable: {},
    };
    this.appendStep(step);
  };

  private readonly addText = (): void => {
    const step: TextStep = {
      kind: 'text',
      id: this.freeStepId('text'),
      label: 'Text',
      variable: {},
    };
    this.appendStep(step);
  };

  private appendStep(step: CustomStep): void {
    const working = this.working;
    if (working === null) {
      return;
    }
    const steps = [...working.steps, step];
    this.working = { ...working, steps };
    this.requestUpdate();
    const index = steps.length - 1;
    void this.updateComplete.then(() => this.editStep(index));
  }

  private moveStep(index: number, delta: number): void {
    const working = this.working;
    if (working === null) {
      return;
    }
    const target = index + delta;
    if (target < 0 || target >= working.steps.length) {
      return;
    }
    const steps = [...working.steps];
    const moved = steps[index];
    const swapped = steps[target];
    if (moved === undefined || swapped === undefined) {
      return;
    }
    steps[index] = swapped;
    steps[target] = moved;
    this.working = { ...working, steps };
    this.prune();
    this.requestUpdate();
  }

  private removeStep(index: number): void {
    const working = this.working;
    if (working === null) {
      return;
    }
    const steps = working.steps.filter((_, candidate) => candidate !== index);
    this.working = { ...working, steps };
    this.prune();
    this.requestUpdate();
  }

  private readonly handleStepHidden = (event: Event, index: number): void => {
    const target = event.target;
    const working = this.working;
    if (working === null || !(target instanceof HTMLInputElement)) {
      return;
    }
    const step = working.steps[index];
    if (step === undefined) {
      return;
    }
    const steps = [...working.steps];
    steps[index] = withHidden(step, target.checked);
    this.working = { ...working, steps };
    this.requestUpdate();
  };

  private readonly handleTitle = (event: Event): void => {
    const target = event.target;
    const working = this.working;
    if (working === null || !(target instanceof HTMLInputElement)) {
      return;
    }
    const title = target.value;
    const next: CustomDefinition = { ...working, title };
    this.working = this.isNew
      ? { ...next, id: slugifyTitle(title, this.takenIds()) }
      : next;
    this.requestUpdate();
  };

  private readonly handleDescription = (event: Event): void => {
    const target = event.target;
    const working = this.working;
    if (working === null || !(target instanceof HTMLInputElement)) {
      return;
    }
    const description = target.value.trim();
    const { description: _removed, ...rest } = working;
    this.working = description === '' ? rest : { ...rest, description };
    this.requestUpdate();
  };

  private readonly handleSave = (): void => {
    const library = this.library;
    const working = this.working;
    if (library === undefined || working === null) {
      return;
    }
    const candidate = withTrimmedTitle(working);
    try {
      const saved = this.isNew
        ? library.create(candidate)
        : library.save(candidate);
      this.working = cloneCustom(saved);
      this.isNew = false;
      this.onSaved?.(saved);
      this.close();
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
    }
  };

  private readonly handleDelete = (): void => {
    const library = this.library;
    const working = this.working;
    if (library === undefined || working === null) {
      return;
    }
    if (!this.confirmingDelete) {
      this.confirmingDelete = true;
      this.requestUpdate();
      return;
    }
    try {
      library.remove(working.id);
      this.onDeleted?.(working.id);
      this.close();
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
    }
  };

  private readonly openBrowser = (): void => {
    this.browserDialog?.open();
  };

  private prune(): void {
    const catalog = this.catalog;
    if (catalog !== undefined && this.working !== null) {
      this.working = pruneCustom(this.working, catalog);
    }
  }

  private freeStepId(base: string): string {
    const taken = new Set((this.working?.steps ?? []).map((step) => step.id));
    return nextStepId(base, taken);
  }

  private takenIds(): ReadonlySet<string> {
    const entries = this.library?.entries() ?? [];
    return new Set(entries.map((entry) => entry.custom.id));
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-dialog');
  }

  private get stepDialog(): CustomStepDialog | null {
    return this.querySelector<CustomStepDialog>('calc-custom-step-dialog');
  }

  private get browserDialog(): CalculatorBrowserDialog | null {
    return this.querySelector<CalculatorBrowserDialog>(
      'calc-calculator-browser',
    );
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

/** A label for the kind of a step, shown in the editor's list. */
function describeStep(
  step: CustomStep,
  catalog: CalculatorCatalog | undefined,
): string {
  switch (step.kind) {
    case 'subcalc':
      return (
        catalog?.get(step.calculatorId)?.definition.title ?? step.calculatorId
      );
    case 'variable':
      return `Number (${step.unit})`;
    case 'text':
      return 'Text output';
  }
}

/** Builds a step id from a base, suffixing a number until it is free. */
function nextStepId(base: string, taken: ReadonlySet<string>): string {
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '') || 'step';
  if (!taken.has(clean)) {
    return clean;
  }
  for (let suffix = 2; suffix <= taken.size + 2; suffix += 1) {
    const candidate = `${clean}${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  return `${clean}${taken.size + 2}`;
}

/** Builds a custom id from a title, suffixing a number until it is free. */
function slugifyTitle(title: string, taken: ReadonlySet<string>): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const slug = base === '' ? 'custom' : base;
  if (!taken.has(slug)) {
    return slug;
  }
  for (let suffix = 2; suffix <= taken.size + 2; suffix += 1) {
    const candidate = `${slug}-${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  return `${slug}-${taken.size + 2}`;
}

/** Returns the step with its `hidden` flag set or removed. */
function withHidden(step: CustomStep, hidden: boolean): CustomStep {
  if (hidden) {
    return { ...step, hidden: true };
  }
  const { hidden: _removed, ...rest } = step;
  return rest;
}

/** Trims the title, falling back to a placeholder when it is empty. */
function withTrimmedTitle(custom: CustomDefinition): CustomDefinition {
  const title = custom.title.trim();
  return title === custom.title ? custom : { ...custom, title };
}

/** Deep copy of a custom so edits can be abandoned by closing the dialog. */
function cloneCustom(custom: CustomDefinition): CustomDefinition {
  return {
    version: custom.version,
    id: custom.id,
    title: custom.title,
    ...(custom.description === undefined
      ? {}
      : { description: custom.description }),
    steps: custom.steps.map((step) => cloneStep(step)),
  };
}

customElements.define('calc-custom-editor', CustomEditorDialog);
