import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../errors.js';
import { formatNumber, parseNumberText } from '../format.js';
import { interpolateAt, parseLookupCell } from '../interpolate.js';
import type { LookupPoint } from '../interpolate.js';
import { parseCompositeUnit } from '../units.js';
import type { UnitSymbol } from '../units.js';
import type { TableColumn } from '../types.js';

let nextDialogId = 0;

/**
 * Modal that interpolates one lookup cell at a chosen axis coordinate. Opened
 * from a table view's lookup button so a user can read an exact value without
 * running a whole calculator.
 */
export class LookupDialog extends LitElement {
  private column: TableColumn | null = null;
  private rowText = '';
  private points: readonly LookupPoint[] = [];
  private valueUnit: UnitSymbol | null = null;
  private axisUnit: UnitSymbol | null = null;
  private axisText = '';
  private error = '';
  private readonly titleId = `calc-lookup-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Prepares the dialog for one lookup cell and opens it. */
  open(column: TableColumn, cellText: string, rowText: string): void {
    this.column = column;
    this.rowText = rowText;
    this.error = '';
    this.points = [];
    this.axisText = '';

    const composite =
      column.unit === undefined
        ? null
        : parseCompositeUnit(String(column.unit));
    if (composite === null) {
      this.error = `${column.label} has no axis unit to interpolate against.`;
    } else {
      this.valueUnit = composite.unit;
      this.axisUnit = composite.axis;
      const parsed = parseLookupCell(cellText);
      if (parsed === null) {
        this.error = `${column.label} is malformed and cannot be interpolated.`;
      } else {
        this.points = parsed;
        this.axisText = formatNumber(parsed[0]!.x);
      }
    }

    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.showDialog();
    });
  }

  /** Closes the modal. */
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
    const column = this.column;
    if (column === undefined || column === null) {
      return nothing;
    }

    return html`
      <dialog
        class="calc-dialog calc-lookup-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Look up ${column.label}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${
            this.rowText === ''
              ? nothing
              : html`<p class="help">Row ${this.rowText}</p>`
          }
          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }
          ${
            this.error === ''
              ? html`
                  <label class="calc-field">
                    <span class="calc-field-label">
                      Axis${this.axisUnit === null ? '' : ` (${this.axisUnit})`}
                    </span>
                    <input
                      class="form-control"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      data-testid="lookup-axis"
                      .value=${this.axisText}
                      @input=${this.handleAxisInput}
                    />
                  </label>
                  ${this.renderResult()}
                  <table class="calc-table-grid calc-lookup-points">
                    <thead>
                      <tr>
                        <th scope="col">
                          Axis${this.axisUnit === null ? '' : ` (${this.axisUnit})`}
                        </th>
                        <th scope="col">
                          Value${this.valueUnit === null ? '' : ` (${this.valueUnit})`}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.points.map(
                        (point) => html`
                          <tr>
                            <td>${formatNumber(point.x)}</td>
                            <td>${formatNumber(point.y)}</td>
                          </tr>
                        `,
                      )}
                    </tbody>
                  </table>
                `
              : nothing
          }
        </div>
      </dialog>
    `;
  }

  private renderResult(): TemplateResult {
    const column = this.column;
    if (column === null) {
      return html``;
    }
    let axis: number | null;
    try {
      axis = parseNumberText(this.axisText);
    } catch (error) {
      return html`
        <p class="alert danger" role="alert">${errorMessage(error)}</p>
      `;
    }
    if (axis === null) {
      return html`<p class="help">Enter an axis value to interpolate.</p>`;
    }
    const sampled = interpolateAt(this.points, axis);
    if (sampled === null) {
      return html`
        <p class="alert warning">That value cannot be interpolated.</p>
      `;
    }
    const unit = this.valueUnit === null ? '' : ` ${this.valueUnit}`;
    return html`
      <p class="calc-lookup-result" data-testid="lookup-result" role="status">
        ${column.label}: <strong>${formatNumber(sampled)}${unit}</strong>
      </p>
    `;
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-lookup-dialog');
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

  private readonly handleAxisInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      this.axisText = event.target.value;
      this.requestUpdate();
    }
  };

  private readonly handleClose = (): void => {
    this.requestUpdate();
  };
}

customElements.define('calc-lookup-dialog', LookupDialog);
