import { html, LitElement, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { errorMessage } from '../errors.js';
import { formatNumber } from '../format.js';
import type { ValueUpdateResult } from '../runtime.js';
import {
  applyTableRows,
  exportTableRowsMarkdown,
  parseTableRowsMarkdown,
} from '../table-rows.js';
import type { TableRowStore } from '../table-rows.js';
import {
  isBooleanColumn,
  isLookupColumn,
  isNumericColumn,
  rowLabel,
} from '../tables.js';
import type {
  TableCell,
  TableColumn,
  TableDefinition,
  TableRow,
} from '../types.js';
import { LookupDialog } from './lookup-dialog.js';
import { TableRowDialog } from './table-row-dialog.js';
import type { TableRowMode } from './table-row-dialog.js';
import { TableRowsDialog } from './table-rows-dialog.js';

/** How long a Delete button stays armed before it forgets the first click. */
const DELETE_CONFIRM_MS = 4000;

/**
 * View of one data table. Columns show the storage unit so values are never
 * ambiguous. When a custom-row store is supplied the view lets a user override
 * or extend the table, and import or export those rows as markdown.
 */
export class TableView extends LitElement {
  static override properties = {
    table: { attribute: false },
    store: { attribute: false },
  };

  declare table: TableDefinition | undefined;
  declare store: TableRowStore | null | undefined;

  /** Called after custom rows change so calculators can recompute. */
  onChanged: () => void = () => {};

  private custom: readonly TableRow[] = [];
  private loadError = '';
  private pendingDeleteKey: string | null = null;
  private deleteTimer: ReturnType<typeof setTimeout> | null = null;
  private lookupDialog: LookupDialog | null = null;
  private rowDialog: TableRowDialog | null = null;
  private rowsDialog: TableRowsDialog | null = null;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override disconnectedCallback(): void {
    this.clearDeleteTimer();
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('table') || changed.has('store')) {
      this.refreshCustom();
    }
  }

  override render(): TemplateResult | typeof nothing {
    const table = this.table;
    if (table === undefined) {
      return nothing;
    }

    const effective = applyTableRows(table, this.custom);
    const customKeys = new Set<string>();
    for (const row of this.custom) {
      const key = row[table.keyColumn];
      if (typeof key === 'string') {
        customKeys.add(key);
      }
    }

    return html`
      <div class="calc-table">
        <h2 class="calc-calculator-title">${table.title}</h2>
        ${
          table.description === undefined
            ? nothing
            : html`<p class="help">${table.description}</p>`
        }
        ${
          this.loadError === ''
            ? nothing
            : html`<p class="alert danger" role="alert">${this.loadError}</p>`
        }
        ${this.hasStore ? this.renderToolbar() : nothing}
        <div class="calc-table-scroll">
          <table class="calc-table-grid">
            <thead>
              <tr>
                ${table.columns.map(
                  (column) => html`
                    <th scope="col">${column.label}${renderUnit(column)}</th>
                  `,
                )}
                ${this.hasStore ? html`<th scope="col">Custom</th>` : nothing}
              </tr>
            </thead>
            <tbody>
              ${effective.rows.map((row) =>
                this.renderRow(table, row, customKeys),
              )}
            </tbody>
          </table>
        </div>
        <p class="help">
          ${effective.rows.length}
          rows${
            this.custom.length === 0 ? '' : `, ${this.custom.length} custom`
          }
        </p>
        ${this.renderDialogs(table)}
      </div>
    `;
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="calc-actions calc-table-toolbar">
        <button
          class="button"
          type="button"
          data-testid="add-row"
          @click=${() => this.openRowDialog('add')}
        >
          Add row
        </button>
        <button
          class="button"
          type="button"
          data-testid="export-rows"
          @click=${this.openExport}
        >
          Export markdown
        </button>
        <button
          class="button"
          type="button"
          data-testid="import-rows"
          @click=${this.openImport}
        >
          Import markdown
        </button>
      </div>
    `;
  }

  private renderRow(
    table: TableDefinition,
    row: TableRow,
    customKeys: ReadonlySet<string>,
  ): TemplateResult {
    const key = row[table.keyColumn];
    const isCustom = typeof key === 'string' && customKeys.has(key);
    return html`
      <tr class=${isCustom ? 'calc-table-custom-row' : ''}>
        ${table.columns.map((column) => this.renderCell(table, column, row))}
        ${
          this.hasStore
            ? html`<td class="calc-table-actions">
                ${this.renderRowActions(table, row, isCustom)}
              </td>`
            : nothing
        }
      </tr>
    `;
  }

  private renderCell(
    table: TableDefinition,
    column: TableColumn,
    row: TableRow,
  ): TemplateResult {
    const cell = row[column.key];
    if (
      isLookupColumn(column) &&
      typeof cell === 'string' &&
      cell.trim() !== ''
    ) {
      return html`
        <td class="calc-table-lookup-cell">
          <span>${cell}</span>
          <button
            class="button calc-table-lookup-button"
            type="button"
            title=${`Look up ${column.label}`}
            data-testid=${`lookup-${column.key}-${row[table.keyColumn]}`}
            @click=${() => this.openLookup(column, cell, rowLabel(table, row))}
          >
            Look up
          </button>
        </td>
      `;
    }
    return html`<td>${renderCell(column, cell)}</td>`;
  }

  private renderRowActions(
    table: TableDefinition,
    row: TableRow,
    isCustom: boolean,
  ): TemplateResult | typeof nothing {
    const key = row[table.keyColumn];
    if (typeof key !== 'string' || key === '') {
      return nothing;
    }
    if (!isCustom) {
      return html`
        <button
          class="button calc-table-action"
          type="button"
          data-testid=${`override-${key}`}
          @click=${() => this.openRowDialog('override', row)}
        >
          Override
        </button>
      `;
    }
    const pending = this.pendingDeleteKey === key;
    return html`
      <button
        class="button calc-table-action"
        type="button"
        data-testid=${`edit-${key}`}
        @click=${() => this.openRowDialog('edit', row)}
      >
        Edit
      </button>
      <button
        class="button danger calc-table-action"
        type="button"
        data-testid=${`delete-${key}`}
        @click=${() => this.handleDelete(key)}
      >
        ${pending ? 'Confirm delete' : 'Delete'}
      </button>
    `;
  }

  private renderDialogs(table: TableDefinition): TemplateResult {
    return html`
      <calc-lookup-dialog ${ref(this.captureLookupDialog)}></calc-lookup-dialog>
      <calc-table-row-dialog
        ${ref(this.captureRowDialog)}
        .table=${table}
        .onSubmit=${this.handleRowSubmit}
      ></calc-table-row-dialog>
      <calc-table-rows-dialog
        ${ref(this.captureRowsDialog)}
        .table=${table}
        .onImport=${this.handleImport}
      ></calc-table-rows-dialog>
    `;
  }

  private get hasStore(): boolean {
    return this.store !== null && this.store !== undefined;
  }

  private refreshCustom(): void {
    const table = this.table;
    const store = this.store;
    if (table === undefined || store === null || store === undefined) {
      this.custom = [];
      this.loadError = '';
      return;
    }
    try {
      this.custom = store.list(table.id);
      this.loadError = '';
    } catch (error) {
      this.custom = [];
      this.loadError = errorMessage(error);
    }
  }

  /** Refreshes the overlay and lets the owning app recompute its calculators. */
  private afterChange(): void {
    this.refreshCustom();
    this.requestUpdate();
    this.onChanged();
  }

  private openRowDialog(mode: TableRowMode, row?: TableRow): void {
    this.rowDialog?.open(mode, row);
  }

  private openLookup(
    column: TableColumn,
    cellText: string,
    rowText: string,
  ): void {
    this.lookupDialog?.open(column, cellText, rowText);
  }

  private openExport(): void {
    const table = this.table;
    if (table === undefined) {
      return;
    }
    this.rowsDialog?.open(
      'export',
      exportTableRowsMarkdown(table, this.custom),
    );
  }

  private openImport(): void {
    this.rowsDialog?.open('import', '');
  }

  private handleDelete(key: string): void {
    const table = this.table;
    const store = this.store;
    if (table === undefined || store === null || store === undefined) {
      return;
    }
    if (this.pendingDeleteKey !== key) {
      this.pendingDeleteKey = key;
      this.clearDeleteTimer();
      this.deleteTimer = setTimeout(() => {
        this.pendingDeleteKey = null;
        this.deleteTimer = null;
        this.requestUpdate();
      }, DELETE_CONFIRM_MS);
      this.requestUpdate();
      return;
    }
    this.clearDeleteTimer();
    this.pendingDeleteKey = null;
    try {
      store.delete(table, key);
    } catch (error) {
      this.loadError = errorMessage(error);
      this.requestUpdate();
      return;
    }
    this.afterChange();
  }

  private readonly handleRowSubmit = (row: TableRow): ValueUpdateResult => {
    const table = this.table;
    const store = this.store;
    if (table === undefined || store === null || store === undefined) {
      return { ok: false, message: 'Custom rows are not available here.' };
    }
    try {
      store.save(table, row);
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
    this.afterChange();
    return { ok: true };
  };

  private readonly handleImport = (text: string): ValueUpdateResult => {
    const table = this.table;
    const store = this.store;
    if (table === undefined || store === null || store === undefined) {
      return { ok: false, message: 'Custom rows are not available here.' };
    }
    let rows: readonly TableRow[];
    try {
      rows = parseTableRowsMarkdown(table, text);
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
    if (rows.length === 0) {
      return { ok: false, message: 'That markdown has no rows to import.' };
    }
    let saved = 0;
    for (const row of rows) {
      try {
        store.save(table, row);
      } catch (error) {
        this.afterChange();
        return {
          ok: false,
          message:
            `Imported ${saved} of ${rows.length} rows, then failed: ` +
            errorMessage(error),
        };
      }
      saved += 1;
    }
    this.afterChange();
    return {
      ok: true,
      message: `Imported ${saved} row${saved === 1 ? '' : 's'}.`,
    };
  };

  private clearDeleteTimer(): void {
    if (this.deleteTimer !== null) {
      clearTimeout(this.deleteTimer);
      this.deleteTimer = null;
    }
  }

  private readonly captureLookupDialog = (element?: Element): void => {
    this.lookupDialog = element instanceof LookupDialog ? element : null;
  };

  private readonly captureRowDialog = (element?: Element): void => {
    this.rowDialog = element instanceof TableRowDialog ? element : null;
  };

  private readonly captureRowsDialog = (element?: Element): void => {
    this.rowsDialog = element instanceof TableRowsDialog ? element : null;
  };
}

function renderUnit(column: TableColumn): TemplateResult | typeof nothing {
  if (column.unit === undefined) {
    return nothing;
  }
  return html`<span class="calc-table-unit"> (${column.unit})</span>`;
}

function renderCell(
  column: TableColumn,
  cell: TableCell | undefined,
): string | TemplateResult {
  if (cell === null || cell === undefined) {
    return '—';
  }
  if (isBooleanColumn(column) && typeof cell === 'boolean') {
    return cell ? 'yes' : 'no';
  }
  if (isNumericColumn(column) && typeof cell === 'number') {
    return formatNumber(cell);
  }
  return String(cell);
}

customElements.define('calc-table-view', TableView);
