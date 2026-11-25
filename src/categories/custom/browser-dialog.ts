import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { CatalogEntry, CalculatorCatalog } from '../../custom/catalog.js';

let nextDialogId = 0;

/**
 * Browses the calculators a custom may embed. Any calculator can be added
 * more than once, so no entry is ever excluded.
 */
export class CalculatorBrowserDialog extends LitElement {
  static override properties = {
    catalog: { attribute: false },
    onChosen: { attribute: false },
  };

  declare catalog: CalculatorCatalog | undefined;
  declare onChosen: ((calculatorId: string) => void) | undefined;

  private filter = '';
  private readonly titleId = `calc-calculator-browser-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the modal with an empty filter. */
  open(): void {
    this.filter = '';
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

  override render(): TemplateResult {
    const entries = this.visibleEntries();
    return html`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Add a subcalculator</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <label class="calc-custom-filter">
            <span class="calc-field-label">Filter</span>
            <input
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="Filter by name"
              .value=${this.filter}
              @input=${this.handleFilter}
            />
          </label>
          <div class="calc-tiles calc-custom-browser">
            ${entries.map((entry) => this.renderEntry(entry))}
          </div>
          ${
            entries.length === 0
              ? html`<p class="help">No calculators match this filter.</p>`
              : nothing
          }
        </div>
      </dialog>
    `;
  }

  private renderEntry(entry: CatalogEntry): TemplateResult {
    const description = entry.definition.description ?? '';
    return html`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-${entry.definition.id}`}
        @click=${() => this.choose(entry.definition.id)}
      >
        <strong>${entry.definition.title}</strong>
        ${
          description === ''
            ? nothing
            : html`<span class="help">${description}</span>`
        }
      </button>
    `;
  }

  private visibleEntries(): readonly CatalogEntry[] {
    const entries = this.catalog?.list() ?? [];
    const needle = this.filter.trim().toLowerCase();
    if (needle === '') {
      return entries;
    }
    return entries.filter(
      (entry) =>
        entry.definition.title.toLowerCase().includes(needle) ||
        entry.definition.id.toLowerCase().includes(needle),
    );
  }

  private readonly handleFilter = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.filter = target.value;
      this.requestUpdate();
    }
  };

  private choose(calculatorId: string): void {
    this.onChosen?.(calculatorId);
    this.close();
  }

  private readonly handleClose = (): void => {
    this.filter = '';
    this.requestUpdate();
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

customElements.define('calc-calculator-browser', CalculatorBrowserDialog);
