import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../errors.js';
import { formatNumber, parseNumberText } from '../format.js';
import { parseLookupCell } from '../interpolate.js';
import type { ValueUpdateResult } from '../runtime.js';
import {
  isBooleanColumn,
  isLookupColumn,
  isNumericColumn,
  tableRowProblems,
} from '../tables.js';
import type {
  TableCell,
  TableColumn,
  TableDefinition,
  TableRow,
} from '../types.js';

let nextDialogId = 0;

/** How the dialog was opened, which decides its heading and hints. */
export type TableRowMode = 'add' | 'edit' | 'override';

/**
 * Modal for adding or editing one custom table row. Every cell is edited as
 * text and coerced on save; the key column is locked when a row already exists
 * so editing cannot silently rename it.
 */
export class TableRowDialog extends LitElement {
  static override properties = {
    table: { attribute: false },
  };

  declare table: TableDefinition | undefined;

  /** Saves the finished row; the store's answer decides whether we close. */
  onSubmit: (row: TableRow) => ValueUpdateResult = () => ({ ok: true });

  private mode: TableRowMode = 'add';
  private cells: Record<string, string> = {};
  private keyLocked = false;
  private error = '';
  private readonly titleId = `calc-row-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Fills the form from `row` (or blanks for add) and opens the modal. */
  open(mode: TableRowMode, row?: TableRow): void {
    this.mode = mode;
    this.error = '';
    this.cells = {};
    this.keyLocked = mode !== 'add';
    const table = this.table;
    if (table !== undefined) {
      for (const column of table.columns) {
        this.cells[column.key] =
          row === undefined ? '' : cellToText(column, row[column.key]);
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
    const table = this.table;
    if (table === undefined) {
      return nothing;
    }

    return html`
      <dialog
        class="calc-dialog calc-row-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>${this.heading(table)}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${
            this.mode === 'override'
              ? html`
                  <p class="help">
                    Saving replaces this built-in row in every calculator.
                  </p>
                `
              : nothing
          }
          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }

          <div class="calc-row-fields">
            ${table.columns.map((column) => this.renderField(table, column))}
          </div>

          <div class="calc-row-actions">
            <button
              class="button"
              type="button"
              data-testid="row-save"
              @click=${this.handleSave}
            >
              Save row
            </button>
          </div>
        </div>
      </dialog>
    `;
  }

  private heading(table: TableDefinition): string {
    if (this.mode === 'add') {
      return `Add a row to ${table.title}`;
    }
    if (this.mode === 'override') {
      return `Override a row in ${table.title}`;
    }
    return `Edit a row in ${table.title}`;
  }

  private renderField(
    table: TableDefinition,
    column: TableColumn,
  ): TemplateResult {
    const value = this.cells[column.key] ?? '';
    const unit = column.unit === undefined ? '' : ` (${column.unit})`;
    const isKey = column.key === table.keyColumn;
    const testId = `row-${column.key}`;
    return html`
      <label class="calc-field">
        <span class="calc-field-label">${column.label}${unit}</span>
        ${
          isBooleanColumn(column)
            ? html`
                <select
                  class="form-control"
                  data-testid=${testId}
                  ?disabled=${isKey && this.keyLocked}
                  @change=${(event: Event) => this.handleInput(column, event)}
                >
                  <option value="" ?selected=${value === ''}>— none —</option>
                  <option value="yes" ?selected=${value === 'yes'}>yes</option>
                  <option value="no" ?selected=${value === 'no'}>no</option>
                </select>
              `
            : html`
                <input
                  class="form-control"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  data-testid=${testId}
                  ?readonly=${isKey && this.keyLocked}
                  .value=${value}
                  @input=${(event: Event) => this.handleInput(column, event)}
                />
              `
        }
      </label>
    `;
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-row-dialog');
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

  private readonly handleInput = (column: TableColumn, event: Event): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement
    ) {
      this.cells = { ...this.cells, [column.key]: target.value };
      this.error = '';
      this.requestUpdate();
    }
  };

  private readonly handleSave = (): void => {
    const table = this.table;
    if (table === undefined) {
      return;
    }
    const row: Record<string, TableCell> = {};
    for (const column of table.columns) {
      try {
        row[column.key] = coerceCell(column, this.cells[column.key] ?? '');
      } catch (error) {
        this.error = errorMessage(error);
        this.requestUpdate();
        return;
      }
    }
    const problems = tableRowProblems(table, row, 'Custom row');
    if (problems.length > 0) {
      this.error = problems.join('\n');
      this.requestUpdate();
      return;
    }
    const result = this.onSubmit(row);
    if (!result.ok) {
      this.error = result.message ?? 'That row could not be saved.';
      this.requestUpdate();
      return;
    }
    this.close();
  };

  private readonly handleClose = (): void => {
    this.error = '';
    this.requestUpdate();
  };
}

/** Renders a stored cell as the text shown in an editor field. */
function cellToText(column: TableColumn, cell: TableCell | undefined): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  if (isBooleanColumn(column) && typeof cell === 'boolean') {
    return cell ? 'yes' : 'no';
  }
  if (isNumericColumn(column) && typeof cell === 'number') {
    return formatNumber(cell);
  }
  return String(cell);
}

/** Turns one editor field back into a stored cell. */
function coerceCell(column: TableColumn, text: string): TableCell {
  const trimmed = text.trim();
  if (isBooleanColumn(column)) {
    if (trimmed === '') {
      return null;
    }
    if (trimmed === 'yes') {
      return true;
    }
    if (trimmed === 'no') {
      return false;
    }
    throw new Error(`"${trimmed}" is not a yes/no value.`);
  }
  if (trimmed === '') {
    return null;
  }
  if (isNumericColumn(column)) {
    return parseNumberText(trimmed);
  }
  if (isLookupColumn(column)) {
    if (parseLookupCell(trimmed) === null) {
      throw new Error(`"${trimmed}" is not a lookup value.`);
    }
    return trimmed;
  }
  return trimmed;
}

customElements.define('calc-table-row-dialog', TableRowDialog);
