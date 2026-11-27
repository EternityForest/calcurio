import { html, LitElement, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { BookmarkStore } from '../bookmarks.js';
import { errorMessage } from '../errors.js';
import type { OutputDisplayItem } from '../output.js';
import type { CalculatorRuntime, ValueUpdateResult } from '../runtime.js';
import type { UnitSymbol } from '../units.js';
import type { ConfigFieldDefinition, VariableDefinition } from '../types.js';
import { isTableSelectVariable, isTextVariable } from '../types.js';
import { configControl } from './config-control.js';
import { BookmarksDialog } from './bookmarks-dialog.js';
import { GraphDialog } from './graph-dialog.js';
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
  private graphDialog: GraphDialog | null = null;
  private outputContainer: HTMLElement | null = null;
  private readonly stringNodes = new Map<number, HTMLParagraphElement>();

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
      this.stringNodes.clear();
      if (this.isConnected) {
        this.attachRuntime();
      }
    }
  }

  override updated(): void {
    this.syncOutput();
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
        ${
          definition.headerHtml === undefined
            ? nothing
            : html`<div class="calc-header-html">
                ${unsafeHTML(definition.headerHtml)}
              </div>`
        }
        ${this.renderConfig(runtime)} ${this.renderErrors(runtime)}
        <div class="calc-fields">
          ${runtime.variables
            .filter((variable) => variable.hidden !== true)
            .map((variable) => this.renderField(runtime, variable))}
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
          ${runtime.hasComputeState ? this.renderRunActions(runtime) : nothing}
        </div>
        ${
          runtime.hasComputeState
            ? html`<div class="calc-output" ${ref(this.captureOutput)}></div>`
            : nothing
        }
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
      <calc-graph-dialog
        ${ref(this.captureGraphDialog)}
        .runtime=${runtime}
      ></calc-graph-dialog>
    `;
  }

  /** Renders the calculator's settings, which shape its variable list. */
  private renderConfig(
    runtime: CalculatorRuntime,
  ): TemplateResult | typeof nothing {
    const fields = runtime.configFields;
    if (fields.length === 0) {
      return nothing;
    }
    return html`
      <div class="calc-config">
        <h3 class="calc-section-title">Settings</h3>
        <div class="calc-config-fields">
          ${fields.map((field) => this.renderConfigField(runtime, field))}
        </div>
      </div>
    `;
  }

  private renderConfigField(
    runtime: CalculatorRuntime,
    field: ConfigFieldDefinition,
  ): TemplateResult {
    const value = runtime.config[field.name];
    return html`
      <label class="calc-config-field">
        <span class="calc-config-label">${field.label}</span>
        ${configControl(field, value, (next) =>
          runtime.setConfig({ [field.name]: next }),
        )}
      </label>
      ${
        field.description === undefined
          ? nothing
          : html`<p class="help calc-config-help">${field.description}</p>`
      }
    `;
  }

  private renderField(
    runtime: CalculatorRuntime,
    variable: VariableDefinition,
  ): TemplateResult {
    const name = variable.name;
    const runMode = runtime.hasComputeState;

    const output =
      runMode && runtime.isComputable(name) && !isTableSelectVariable(variable);
    const source = runtime.sourceLabel(name);
    const setterButtonLabels = variable.setterButtons?.map((b) => b.label);
    const baseParts = {
      name,
      label: variable.label,
      description: variable.description ?? '',
      editable: runtime.isEditable(name) && !output,
      computable:
        runtime.isComputable(name) &&
        !runMode &&
        !runtime.isWired(name) &&
        !('tableSelect' in variable && variable?.tableSelect),
      pinned: runtime.isPinned(name),
      issues: runtime.issuesFor(name).map((issue) => issue.message),
      highlight: source !== null,
    };
    const base =
      setterButtonLabels !== undefined && setterButtonLabels.length > 0
        ? { ...baseParts, setterButtons: setterButtonLabels as readonly string[] }
        : baseParts;

    if (isTableSelectVariable(variable)) {
      const model: FieldModel = {
        ...base,
        kind: 'tableSelect',
        value: runtime.selectedKey(name) ?? '',
        choices: runtime.tableChoices(name),
        findClosest: runtime.canFindClosestRow(name),
        computable: false,
      };
      return html`
        <calc-variable-field
          .model=${model}
          .onSelectionChange=${(key: string) =>
            this.selectRow(runtime, name, key)}
          .onFindClosest=${() => this.findClosestRow(runtime, name)}
          .onCalculate=${() => runtime.calculate(name)}
          .onSetterButton=${(index: number) =>
            this.handleSetterButton(runtime, name, index)}
        ></calc-variable-field>
      `;
    }

    if (isTextVariable(variable)) {
      const model: FieldModel = {
        ...base,
        kind: 'text',
        value: runtime.formattedValue(name),
        placeholder: runtime.missingLabel(name),
      };
      return html`
        <calc-variable-field
          .model=${model}
          .onCommit=${(text: string) => runtime.setDisplayText(name, text)}
          .onCalculate=${() => runtime.calculate(name)}
          .onSetterButton=${(index: number) =>
            this.handleSetterButton(runtime, name, index)}
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
      plottable:
        !runMode &&
        runtime.isEditable(name) &&
        runtime.graphTargets(name).length > 0,
    };

    return html`
      <calc-variable-field
        .model=${model}
        .onCommit=${(text: string) => runtime.setDisplayText(name, text)}
        .onUnitChange=${(unit: UnitSymbol) =>
          runtime.setDisplayUnit(name, unit)}
        .onCalculate=${() => runtime.calculate(name)}
        .onPlot=${() => this.openGraph(name)}
        .onSetterButton=${(index: number) =>
          this.handleSetterButton(runtime, name, index)}
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

  /** Picks the row closest to the values already entered, if any matches. */
  private findClosestRow(runtime: CalculatorRuntime, name: string): void {
    try {
      runtime.findClosestRow(name);
    } catch (error) {
      this.status = `Could not find a row: ${errorMessage(error)}`;
      this.requestUpdate();
    }
  }

  /** Handles a setter button click by invoking the setter callback. */
  private handleSetterButton(
    runtime: CalculatorRuntime,
    name: string,
    index: number,
  ): void {
    const variable = runtime.variable(name);
    const buttons = variable.setterButtons;
    if (buttons === undefined || buttons[index] === undefined) {
      return;
    }
    const setter = buttons[index].setter;
    const newValue = setter(runtime.state);
    runtime.setFromSetter(name, newValue);
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

  private renderRunActions(runtime: CalculatorRuntime): TemplateResult {
    const running = runtime.isRunning;
    return html`
      <button
        class="button"
        type="button"
        data-testid="run"
        ?disabled=${running || !runtime.canRunComputeState()}
        @click=${this.handleRun}
      >
        Run simulation
      </button>
      <button
        class="button danger"
        type="button"
        data-testid="cancel"
        ?disabled=${!running}
        @click=${this.handleCancel}
      >
        Cancel
      </button>
    `;
  }

  /** Renders `computeState` output below the fields, once per run. */
  private syncOutput(): void {
    const container = this.outputContainer;
    if (container === null) {
      return;
    }
    const runtime = this.runtime;
    const items = runtime === undefined ? [] : runtime.outputDisplay;
    if (items.length === 0) {
      this.stringNodes.clear();
    }
    const nodes: Node[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item !== undefined) {
        nodes.push(this.nodeFor(item, index));
      }
    }
    if (!sameChildren(container, nodes)) {
      container.replaceChildren(...nodes);
    }
  }

  /** Returns the DOM node for one display item, wrapping plain text. */
  private nodeFor(item: OutputDisplayItem, index: number): Node {
    if (typeof item.content !== 'string') {
      return item.content;
    }
    let node = this.stringNodes.get(index);
    if (node === undefined) {
      node = document.createElement('p');
      node.className = 'calc-output-text';
      this.stringNodes.set(index, node);
    }
    if (node.textContent !== item.content) {
      node.textContent = item.content;
    }
    return node;
  }

  private readonly captureOutput = (element?: Element): void => {
    this.outputContainer = element instanceof HTMLElement ? element : null;
  };

  private readonly handleRun = (): void => {
    const runtime = this.runtime;
    if (runtime === undefined || runtime.isRunning) {
      return;
    }
    this.status = '';
    runtime.computeState().catch((error) => {
      this.status = `Could not run: ${errorMessage(error)}`;
      this.requestUpdate();
    });
  };

  private readonly handleCancel = (): void => {
    this.runtime?.cancelComputeState();
  };

  private readonly captureDialog = (element?: Element): void => {
    this.dialog = element instanceof BookmarksDialog ? element : null;
  };

  private readonly captureGraphDialog = (element?: Element): void => {
    this.graphDialog = element instanceof GraphDialog ? element : null;
  };

  private readonly openGraph = (name: string): void => {
    this.graphDialog?.open(name);
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

/** True when the container already holds exactly these nodes in order. */
function sameChildren(container: HTMLElement, nodes: readonly Node[]): boolean {
  if (container.childNodes.length !== nodes.length) {
    return false;
  }
  for (let index = 0; index < nodes.length; index += 1) {
    if (container.childNodes[index] !== nodes[index]) {
      return false;
    }
  }
  return true;
}

customElements.define('calc-calculator', CalculatorView);
