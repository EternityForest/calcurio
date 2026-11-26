import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../errors.js';
import { formatNumber, parseNumberText } from '../format.js';
import { interpolateLookup, lookupCellOf } from '../interpolate.js';
import type { LookupCell } from '../interpolate.js';
import { parseCompositeUnit } from '../units.js';
import type { UnitSymbol } from '../units.js';
import type { TableColumn } from '../types.js';

let nextDialogId = 0;

/**
 * Modal that interpolates one lookup cell at chosen axis coordinates. Opened
 * from a table view's lookup button so a user can read an exact value without
 * running a whole calculator. A cell with no sampled points is a single value
 * at the column's standard point, so it shows that value and no inputs.
 */
export class LookupDialog extends LitElement {
  private column: TableColumn | null = null;
  private rowText = '';
  private cell: LookupCell | null = null;
  private valueUnit: UnitSymbol | null = null;
  private axisUnits: readonly UnitSymbol[] = [];
  private standards: readonly (number | null)[] = [];
  private axisTexts: string[] = [];
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
    this.cell = null;
    this.axisUnits = [];
    this.standards = [];
    this.axisTexts = [];

    const composite =
      column.unit === undefined
        ? null
        : parseCompositeUnit(String(column.unit));
    if (composite === null) {
      this.error = `${column.label} has no axis unit to interpolate against.`;
    } else {
      this.valueUnit = composite.unit;
      this.axisUnits = composite.axes;
      const standards = column.standards ?? {};
      this.standards = composite.axes.map((unit) => {
        const value = standards[unit];
        return typeof value === 'number' ? value : null;
      });
      const parsed = lookupCellOf(cellText);
      if (parsed === null) {
        this.error = `${column.label} is malformed and cannot be interpolated.`;
      } else {
        this.cell = parsed;
        this.axisTexts = composite.axes.map((_, index) => {
          const coord =
            parsed.points[0]?.coords[index] ?? this.standards[index] ?? null;
          return coord === null ? '' : formatNumber(coord);
        });
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
          ${this.error === '' ? this.renderBody() : nothing}
        </div>
      </dialog>
    `;
  }

  private renderBody(): TemplateResult | typeof nothing {
    const cell = this.cell;
    if (cell === null) {
      return nothing;
    }
    if (cell.points.length === 0) {
      return html`
        <p class="help">
          This cell holds a single value at the column's standard point.
        </p>
        ${this.renderResult()}
      `;
    }
    return html`
      ${this.axisUnits.map(
        (unit, index) => html`
          <label class="calc-field">
            <span class="calc-field-label">Axis (${unit})</span>
            <input
              class="form-control"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              data-testid=${
                this.axisUnits.length === 1
                  ? 'lookup-axis'
                  : `lookup-axis-${index}`
              }
              .value=${this.axisTexts[index] ?? ''}
              @input=${(event: Event) => this.handleAxisInput(index, event)}
            />
          </label>
        `,
      )}
      ${this.renderResult()}
      <table class="calc-table-grid calc-lookup-points">
        <thead>
          <tr>
            ${this.axisUnits.map(
              (unit) => html`<th scope="col">Axis (${unit})</th>`,
            )}
            <th scope="col">
              Value${this.valueUnit === null ? '' : ` (${this.valueUnit})`}
            </th>
          </tr>
        </thead>
        <tbody>
          ${cell.points.map(
            (point) => html`
              <tr>
                ${this.axisUnits.map(
                  (_, index) => html`
                    <td>${this.pointCoordText(point, index)}</td>
                  `,
                )}
                <td>${formatNumber(point.y)}</td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }

  private pointCoordText(
    point: LookupCell['points'][number],
    index: number,
  ): string {
    const coord = point.coords[index] ?? this.standards[index] ?? null;
    return coord === null ? '—' : formatNumber(coord);
  }

  private renderResult(): TemplateResult {
    const column = this.column;
    const cell = this.cell;
    if (column === null || cell === null) {
      return html``;
    }
    const unit = this.valueUnit === null ? '' : ` ${this.valueUnit}`;
    if (cell.points.length === 0) {
      if (cell.fallback === null) {
        return html`
          <p class="alert warning">This cell has no value to look up.</p>
        `;
      }
      return html`
        <p class="calc-lookup-result" data-testid="lookup-result" role="status">
          ${column.label}:
          <strong>${formatNumber(cell.fallback)}${unit}</strong>
        </p>
      `;
    }

    const coords: (number | null)[] = [];
    for (const text of this.axisTexts) {
      try {
        coords.push(parseNumberText(text));
      } catch (error) {
        return html`
          <p class="alert danger" role="alert">${errorMessage(error)}</p>
        `;
      }
    }
    const sampled = interpolateLookup(cell, coords, this.standards);
    if (sampled === null) {
      return html`
        <p class="alert warning">That value cannot be interpolated.</p>
      `;
    }
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

  private readonly handleAxisInput = (index: number, event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      const next = [...this.axisTexts];
      next[index] = event.target.value;
      this.axisTexts = next;
      this.requestUpdate();
    }
  };

  private readonly handleClose = (): void => {
    this.requestUpdate();
  };
}

customElements.define('calc-lookup-dialog', LookupDialog);
