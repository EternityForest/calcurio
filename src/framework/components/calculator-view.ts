import { html, LitElement, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { BookmarkStore } from '../bookmarks.js';
import { errorMessage } from '../errors.js';
import type { CalculatorRuntime, ValueUpdateResult } from '../runtime.js';
import type { UnitSymbol } from '../units.js';
import type { VariableDefinition } from '../types.js';
import { isTableSelectVariable } from '../types.js';
import { BookmarksDialog } from './bookmarks-dialog.js';
import './variable-field.js';
import type { FieldModel } from './variable-field.js';

const RESET_CONFIRM_MS = 4000;

/**
 * Renders one calculator from its runtime. All calculator semantics live in
 * the runtime; this element only presents fields, messages, and actions.
 */
export class CalculatorView extends LitElement {
  static override properties = {
    runtime: { attribute: false },
    globalId: { attribute: true },
    bookmarks: { attribute: false },
  };

  declare runtime: CalculatorRuntime | undefined;
  declare globalId: string | undefined;
  declare bookmarks: BookmarkStore | null | undefined;

  private unsubscribe: (() => void) | null = null;
  private status = '';
  private resetArmed = false;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private dialog: BookmarksDialog | null = null;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.attachRuntime();
  }

  override disconnectedCallback(): void {
    this.detachRuntime();
    this.clearResetTimer();
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('runtime')) {
      this.detachRuntime();
      if (this.isConnected) {
        this.attachRuntime();
      }
    }
  }

  override render(): TemplateResult | typeof nothing {
    const runtime = this.runtime;
    if (runtime === undefined) {
      return nothing;
    }
    const definition = runtime.definition;

    return html`
      <div class="calc-calculator">
        <h2 class="calc-calculator-title">${definition.title}</h2>
        ${
          definition.description === undefined
            ? nothing
            : html`<p class="help">${definition.description}</p>`
        }
        ${this.renderErrors(runtime)}
        <div class="calc-fields">
          ${definition.variables.map((variable) =>
            this.renderField(runtime, variable),
          )}
        </div>
        <div class="calc-actions">
          <button
            class="button"
            type="button"
            data-testid="reset"
            @click=${this.handleReset}
          >
            ${this.resetArmed ? 'Confirm reset' : 'Reset'}
          </button>
          <button
            class="button"
            type="button"
            data-testid="open-bookmarks"
            ?disabled=${this.bookmarks === null || this.bookmarks === undefined}
            @click=${this.openBookmarks}
          >
            Bookmarks
          </button>
        </div>
        ${
          this.status === ''
            ? nothing
            : html`<p class="help calc-status" role="status">${this.status}</p>`
        }
      </div>
      <calc-bookmarks-dialog
        ${ref(this.captureDialog)}
        .runtime=${runtime}
        .globalId=${this.globalId ?? ''}
        .bookmarks=${this.bookmarks ?? null}
        @bookmark-loaded=${this.handleBookmarkLoaded}
      ></calc-bookmarks-dialog>
    `;
  }

  private renderField(
    runtime: CalculatorRuntime,
    variable: VariableDefinition,
  ): TemplateResult {
    const name = variable.name;
    const base = {
      name,
      label: variable.label,
      description: variable.description ?? '',
      editable: runtime.isEditable(name),
      computable: runtime.isComputable(name),
      pinned: runtime.isPinned(name),
      issues: runtime.issuesFor(name).map((issue) => issue.message),
    };

    if (isTableSelectVariable(variable)) {
      const model: FieldModel = {
        ...base,
        kind: 'tableSelect',
        value: runtime.selectedKey(name) ?? '',
        choices: runtime.tableChoices(name),
      };
      return html`
        <calc-variable-field
          .model=${model}
          .onSelectionChange=${(key: string) =>
            this.selectRow(runtime, name, key)}
          .onCalculate=${() => runtime.calculate(name)}
        ></calc-variable-field>
      `;
    }

    const model: FieldModel = {
      ...base,
      kind: 'number',
      value: runtime.formattedValue(name),
      placeholder: runtime.missingLabel(name),
      unit: runtime.displayUnitFor(name) ?? variable.unit,
      unitChoices: runtime.unitChoices(name),
    };

    return html`
      <calc-variable-field
        .model=${model}
        .onCommit=${(text: string) => runtime.setDisplayText(name, text)}
        .onUnitChange=${(unit: UnitSymbol) =>
          runtime.setDisplayUnit(name, unit)}
        .onCalculate=${() => runtime.calculate(name)}
      ></calc-variable-field>
    `;
  }

  /** Applies a row choice and reports the failure inline when rejected. */
  private selectRow(
    runtime: CalculatorRuntime,
    name: string,
    key: string,
  ): ValueUpdateResult {
    try {
      runtime.setSelection(name, key);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  private renderErrors(
    runtime: CalculatorRuntime,
  ): TemplateResult | typeof nothing {
    if (runtime.errors.length === 0) {
      return nothing;
    }
    return html`
      <div class="alert danger calc-errors" role="alert">
        <ul>
          ${runtime.errors.map((error) => html`<li>${error}</li>`)}
        </ul>
      </div>
    `;
  }

  private readonly captureDialog = (element?: Element): void => {
    this.dialog = element instanceof BookmarksDialog ? element : null;
  };

  private readonly handleBookmarkLoaded = (event: Event): void => {
    const detail = (event as CustomEvent<string>).detail;
    this.status = `Loaded "${detail}".`;
    this.clearResetTimer();
    this.resetArmed = false;
    this.requestUpdate();
  };

  private readonly handleReset = (): void => {
    const runtime = this.runtime;
    if (runtime === undefined) {
      return;
    }
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.status = 'Press Reset again to clear every value.';
      this.clearResetTimer();
      this.resetTimer = setTimeout(() => {
        this.resetArmed = false;
        this.resetTimer = null;
        this.requestUpdate();
      }, RESET_CONFIRM_MS);
      this.requestUpdate();
      return;
    }

    runtime.reset();
    this.resetArmed = false;
    this.clearResetTimer();
    this.status = 'Calculator reset.';
    this.requestUpdate();
  };

  private readonly openBookmarks = (): void => {
    this.dialog?.open();
  };

  private attachRuntime(): void {
    const runtime = this.runtime;
    if (runtime === undefined || this.unsubscribe !== null) {
      return;
    }
    this.unsubscribe = runtime.subscribe(() => {
      this.requestUpdate();
    });
  }

  private detachRuntime(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private clearResetTimer(): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

customElements.define('calc-calculator', CalculatorView);
